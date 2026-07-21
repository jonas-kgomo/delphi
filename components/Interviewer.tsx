import React, { useEffect, useRef, useState } from 'react';
import { Message, Survey, QuestionType, Question, AIModelType, ParticipantIntake } from '../types';
import { createInterviewSession, transcribeAudio } from '../services/geminiService';
import { InterviewIntake } from './InterviewIntake';
import { DelphiAvatar, UserAvatar } from './Avatars';
import type { AuthProfile } from '../lib/authProfile';
import { Button } from './ui/Button';
import ReactMarkdown from 'react-markdown';
import { Send, Sparkles, Check, Mic, Square } from 'lucide-react';

interface InterviewerProps {
  survey: Survey;
  onExit: () => void;
  model: AIModelType;
  isRespondent?: boolean;
  /** From Google auth — required for real interviews */
  authProfile?: AuthProfile | null;
  /** For respondent login gate */
  authNonce?: string;
  onComplete?: (transcript: Message[], intake: ParticipantIntake) => Promise<void>;
}

export const Interviewer: React.FC<InterviewerProps> = ({
  survey,
  onExit,
  model,
  isRespondent = false,
  authProfile = null,
  authNonce = '',
  onComplete,
}) => {
  const [intake, setIntake] = useState<ParticipantIntake | null>(null);
  const [awaitingConsent, setAwaitingConsent] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const chatSessionRef = useRef<ReturnType<typeof createInterviewSession> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const transcriptPersistedRef = useRef(false);
  const answeredQuestionsRef = useRef<Set<string>>(new Set());
  const intakeRef = useRef<ParticipantIntake | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    if (isFinished && onComplete && intakeRef.current && !transcriptPersistedRef.current) {
      transcriptPersistedRef.current = true;
      setIsSaving(true);
      onComplete(messages, intakeRef.current).finally(() => setIsSaving(false));
    }
  }, [isFinished, onComplete, messages]);

  const handleToggleRecord = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        chunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorderRef.current.onstop = async () => {
          stream.getTracks().forEach((track) => track.stop());
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          setIsRecording(false);
          setIsLoading(true);
          try {
            const text = await transcribeAudio(audioBlob);
            setInput((prev) => (prev + ' ' + text).trim());
          } catch {
            setMessages((prev) => [
              ...prev,
              { id: crypto.randomUUID(), role: 'system', content: 'Sorry, voice transcription failed.' },
            ]);
          } finally {
            setIsLoading(false);
          }
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Error accessing microphone:', err);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const parseMessageForQID = (text: string) => {
    const isProbe = /\[\[PROBE\]\]/i.test(text);
    let working = text.replace(/\[\[PROBE\]\]/gi, '').trim();

    const qidRegex = /\[\[QID:([^\]]+)\]\]/;
    const qidMatch = working.match(qidRegex);
    if (qidMatch) {
      const parts = qidMatch[1].split('|');
      let questionId = parts[0].trim();
      const dynamicOptions = parts.slice(1);

      if (questionId.length < 36) {
        const resolved = survey.questions.find((q) => q.id.startsWith(questionId));
        if (resolved) questionId = resolved.id;
      }

      return {
        cleanText: working.replace(qidRegex, '').trim(),
        questionId,
        dynamicOptions: dynamicOptions.length > 0 ? dynamicOptions : undefined,
        isProbe,
      };
    }

    const typeRegex = /\[\[(SCALE|MULTIPLE_CHOICE|SHORT_TEXT|LONG_TEXT|YES_NO|MATRIX|AB_TEST)\]\]/i;
    const typeMatch = working.match(typeRegex);
    if (typeMatch) {
      const typeName = typeMatch[1].toUpperCase();
      const nextQuestion =
        survey.questions.find((q) => q.type === typeName && !answeredQuestionsRef.current.has(q.id)) ||
        survey.questions.find((q) => !answeredQuestionsRef.current.has(q.id));

      if (nextQuestion) {
        return {
          cleanText: working.replace(typeRegex, '').trim(),
          questionId: nextQuestion.id,
          dynamicOptions: undefined,
          isProbe,
        };
      }
    }

    const nextUnanswered = survey.questions.find((q) => !answeredQuestionsRef.current.has(q.id));
    if (nextUnanswered && working.includes(nextUnanswered.text.substring(0, 30))) {
      return { cleanText: working, questionId: nextUnanswered.id, dynamicOptions: undefined, isProbe };
    }

    // Probe without QID — keep the open question
    if (isProbe) {
      const openId = [...messages].reverse().find((m) => m.role === 'model' && m.questionId)?.questionId;
      return { cleanText: working, questionId: openId, dynamicOptions: undefined, isProbe: true };
    }

    return { cleanText: working, questionId: undefined, dynamicOptions: undefined, isProbe: false };
  };

  const firstName = authProfile?.firstName || authProfile?.name?.split(/\s+/)[0] || 'there';

  /** Seed the chat with a consent turn (no AI) once we know who they are */
  useEffect(() => {
    if (!authProfile || intake || awaitingConsent || messages.length > 0) return;
    setAwaitingConsent(true);
    setMessages([
      {
        id: crypto.randomUUID(),
        role: 'model',
        content: `Hi ${firstName} — I’m Delphi. Thanks for joining **${survey.title}**.

This is a conversational interview. I’ll ask about ${survey.description ? 'the topic below' : 'your views'}, listen carefully, and follow up when something needs more texture.

**Consent:** May we collect your signed-in email (${authProfile.email || 'your account'}) and your answers for this research? You can skip questions or stop anytime. Reply below — or tap a choice.`,
      },
    ]);
  }, [authProfile, intake, awaitingConsent, messages.length, firstName, survey.title, survey.description]);

  const beginAfterConsent = async (participant: ParticipantIntake) => {
    intakeRef.current = participant;
    setIntake(participant);
    setAwaitingConsent(false);
    setIsLoading(true);
    try {
      const chat = createInterviewSession(survey, model, {
        name: participant.name,
        email: participant.email,
      });
      chatSessionRef.current = chat;

      const result = await chat.sendMessage({
        message: `Consent recorded. Start the interview now with ${participant.name}. Skip re-asking consent — greet briefly and ask the first question.`,
      });
      const text = result.text || '';
      const { cleanText, questionId, dynamicOptions, isProbe } = parseMessageForQID(text);

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'model',
          content:
            cleanText ||
            `Wonderful, ${firstName}. Let’s begin — take your time.`,
          questionId,
          dynamicOptions,
          isProbe,
        },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'model',
          content: "I'm having trouble connecting to Delphi. Please try refreshing.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConsent = (accepted: boolean) => {
    if (!authProfile || !awaitingConsent) return;
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: accepted ? 'Yes — I consent and I’m willing to participate.' : 'No — I’d rather not continue.',
    };
    setMessages((prev) => [...prev, userMsg]);

    if (!accepted) {
      setAwaitingConsent(false);
      setIsFinished(true);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'model',
          content: `Understood, ${firstName}. No answers will be stored. Thank you for your time.`,
        },
      ]);
      return;
    }

    void beginAfterConsent({
      name: authProfile.name,
      firstName: authProfile.firstName,
      lastName: authProfile.lastName,
      email: authProfile.email,
      picture: authProfile.picture,
      consentToCollect: true,
      willingToParticipate: true,
    });
  };

  const handleSend = async (textInput?: string) => {
    const contentToSend = textInput || input;
    if (!contentToSend.trim() || isLoading) return;

    // During consent, treat free-text as yes/no
    if (awaitingConsent) {
      const t = contentToSend.trim().toLowerCase();
      const yes = /^(y|yes|yeah|yep|sure|ok|okay|i consent|agree|i agree)\b/.test(t) || t.includes('consent');
      const no = /^(n|no|nope|decline|prefer not)\b/.test(t);
      setInput('');
      if (yes) handleConsent(true);
      else if (no) handleConsent(false);
      else {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'user', content: contentToSend },
          {
            id: crypto.randomUUID(),
            role: 'model',
            content: 'Please tap **I consent** or **Decline**, or reply yes / no.',
          },
        ]);
      }
      return;
    }

    if (!chatSessionRef.current) return;

    const lastModelMsg = [...messages].reverse().find((m) => m.role === 'model' && m.questionId);
    // Only mark answered after a non-probe reply from the model (handled below)

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: contentToSend,
      questionId: lastModelMsg?.questionId,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await chatSessionRef.current.sendMessage({ message: userMsg.content });
      const rawText = result.text || '';

      if (rawText.includes('[[END_OF_SURVEY]]')) {
        if (lastModelMsg?.questionId) {
          answeredQuestionsRef.current.add(lastModelMsg.questionId);
        }
        setIsFinished(true);
        const finalMsg = rawText.replace('[[END_OF_SURVEY]]', '').trim();
        if (finalMsg) {
          setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), role: 'model', content: finalMsg },
          ]);
        }
      } else {
        const { cleanText, questionId, dynamicOptions, isProbe } = parseMessageForQID(rawText);

        // Advance only when the model is not probing the previous answer
        if (!isProbe && lastModelMsg?.questionId) {
          answeredQuestionsRef.current.add(lastModelMsg.questionId);
        }

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'model',
            content: cleanText,
            questionId: isProbe ? questionId || lastModelMsg?.questionId : questionId,
            dynamicOptions,
            isProbe,
          },
        ]);
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'system',
          content: `Sorry, there was an error processing your response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderActiveQuestionUI = (qId: string, dynamicOptions?: string[]) => {
    const question = survey.questions.find((q) => q.id === qId);
    if (!question) return null;

    if (question.type === QuestionType.Scale) {
      return (
        <div className="flex flex-col gap-4 mt-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex justify-between text-xs text-ink-500 px-1">
            <span>{question.minLabel || 'Low'}</span>
            <span>{question.maxLabel || 'High'}</span>
          </div>
          <div className="flex gap-2 justify-between">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleSend(val.toString())}
                className="flex-1 aspect-square rounded-xl border border-ink-200 hover:border-ink-900 hover:bg-ink-900 hover:text-white transition-all text-ink-700 font-medium text-lg"
              >
                {val}
              </button>
            ))}
          </div>
          <p className="text-xs text-ink-400">You can also type a short why below after picking a number.</p>
        </div>
      );
    }

    if (
      question.type === QuestionType.MultipleChoice ||
      question.type === QuestionType.YesNo ||
      question.type === QuestionType.AB_TEST
    ) {
      let options = question.type === QuestionType.YesNo ? ['Yes', 'No'] : question.options || [];
      if (dynamicOptions && dynamicOptions.length > 0) options = dynamicOptions;

      if (question.type === QuestionType.AB_TEST && options.length === 2) {
        return (
          <div className="flex gap-4 mt-4 animate-in fade-in slide-in-from-bottom-2">
            {options.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(opt)}
                className="flex-1 aspect-[4/3] flex flex-col justify-center items-center text-center px-4 py-3 rounded-xl border-2 border-ink-200 hover:border-ink-900 hover:bg-ink-900 hover:text-white transition-all text-ink-800 font-serif text-lg font-bold shadow-sm"
              >
                {opt}
              </button>
            ))}
          </div>
        );
      }

      return (
        <div className="flex flex-col gap-2 mt-4 animate-in fade-in slide-in-from-bottom-2">
          {options.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(opt)}
              className="w-full text-left px-4 py-3 rounded-xl border border-ink-200 hover:border-ink-900 hover:bg-ink-900 hover:text-white transition-all text-ink-800"
            >
              {opt}
            </button>
          ))}
          <p className="text-xs text-ink-400 mt-1">
            Prefer to explain in your own words? Type below — I’ll follow up if I need more.
          </p>
        </div>
      );
    }

    if (question.type === QuestionType.Matrix) {
      return <MatrixInput question={question} onSend={handleSend} />;
    }

    return null;
  };

  if (!authProfile) {
    if (!isRespondent) {
      // Creator preview without forcing re-login shouldn't happen (creator is logged in)
      return (
        <div className="flex items-center justify-center h-[50vh] text-sm text-ink-500">
          Sign in to preview the interview.
        </div>
      );
    }
    return <InterviewIntake survey={survey} nonce={authNonce} />;
  }

  const displayName = intake?.name || authProfile.name;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full bg-ink-50 rounded-2xl overflow-hidden border border-ink-200">
      <div className="px-4 sm:px-5 py-3 bg-white border-b border-ink-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <DelphiAvatar size="md" />
          <div className="min-w-0">
            <h2 className="font-sans font-semibold text-ink-900 truncate text-sm">
              {survey.title}
            </h2>
            <p className="text-[11px] text-ink-400 truncate font-sans">
              Delphi
              {isSaving ? ' · Saving…' : ''}
              {!isRespondent ? ' · Preview' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <UserAvatar name={displayName} picture={authProfile.picture} size="sm" />
          <Button size="sm" variant="ghost" onClick={onExit}>
            End
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-5 space-y-4 bg-ink-50">
        {messages.map((msg, idx) => {
          const isLatestModelMsg = idx === messages.length - 1 && msg.role === 'model';
          const isUser = msg.role === 'user';

          if (msg.role === 'system') {
            return (
              <div key={msg.id} className="flex justify-center">
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5 font-sans">
                  {msg.content}
                </p>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end`}
            >
              {isUser ? (
                <UserAvatar name={displayName} picture={authProfile.picture} size="sm" />
              ) : (
                <DelphiAvatar size="sm" />
              )}

              <div className={`flex flex-col min-w-0 max-w-[min(85%,36rem)] ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed font-sans ${
                    isUser
                      ? 'bg-ink-950 text-white rounded-br-sm'
                      : 'bg-white text-ink-800 rounded-bl-sm border border-ink-200'
                  }`}
                >
                  {msg.isProbe && (
                    <span className="block text-[10px] uppercase tracking-wider text-ember-500 mb-1 font-medium">
                      Follow-up
                    </span>
                  )}
                  <ReactMarkdown
                    components={{
                      p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                      strong: ({ node, ...props }) => (
                        <span
                          className={`font-semibold ${isUser ? 'text-white' : 'text-ink-900'}`}
                          {...props}
                        />
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {isLatestModelMsg && awaitingConsent && !isLoading && !isFinished && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleConsent(true)}
                      className="px-3.5 py-1.5 rounded-lg bg-ink-950 text-white text-sm font-medium font-sans hover:bg-ink-800 transition-colors"
                    >
                      I consent
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConsent(false)}
                      className="px-3.5 py-1.5 rounded-lg border border-ink-200 bg-white text-ink-700 text-sm font-medium font-sans hover:bg-ink-50 transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                )}

                {isLatestModelMsg && msg.questionId && !isLoading && !isFinished && !awaitingConsent && (
                  <div className="w-full mt-2">
                    {renderActiveQuestionUI(msg.questionId, msg.dynamicOptions)}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-2.5 items-end">
            <DelphiAvatar size="sm" />
            <div className="bg-white rounded-2xl rounded-bl-sm px-3.5 py-2.5 border border-ink-200 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-ink-400 animate-pulse" />
              <span className="text-sm text-ink-400 font-sans">Listening…</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {isFinished ? (
        <div className="p-6 bg-ink-50 text-center border-t border-ink-100">
          <h3 className="font-display text-lg font-semibold text-ink-900 mb-2">Interview complete</h3>
          <p className="text-ink-600 mb-4">
            {intake
              ? `Thank you, ${intake.name.split(/\s+/)[0]}. Your conversation has been recorded.`
              : 'No answers were stored.'}
          </p>
          {!isRespondent && (
            <Button onClick={onExit} className="w-full">
              Return to Dashboard
            </Button>
          )}
        </div>
      ) : (
        <div className="p-4 bg-white border-t border-ink-100">
          <div className="relative flex items-end gap-2 bg-ink-50 p-2 rounded-xl border border-ink-200 focus-within:ring-2 focus-within:ring-ember-400/30 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                awaitingConsent
                  ? 'Type yes or no — or use the buttons above…'
                  : 'Share your answer in your own words…'
              }
              className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-2 px-2 text-ink-900 placeholder-ink-400"
              rows={1}
            />
            <Button
              onClick={handleToggleRecord}
              disabled={awaitingConsent || (isLoading && !isRecording)}
              size="sm"
              variant={isRecording ? 'secondary' : 'ghost'}
              className={`mb-1 ${isRecording ? 'text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100' : ''}`}
            >
              {isRecording ? (
                <Square className="w-4 h-4 fill-current" />
              ) : (
                <Mic className="w-4 h-4 text-ink-500" />
              )}
            </Button>
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading || isRecording}
              size="sm"
              className="mb-1"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-center mt-2">
            <span className="text-[10px] text-ink-400 uppercase tracking-widest">
              Enter to send · Shift+Enter for a new line
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const MatrixInput = ({ question, onSend }: { question: Question; onSend: (val: string) => void }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const rows = question.rows || [];
  const isComplete = rows.every((r) => answers[r]);

  const handleSubmit = () => {
    const formatted = Object.entries(answers)
      .map(([k, v]) => `${k}: ${v}`)
      .join('; ');
    onSend(formatted);
  };

  return (
    <div className="mt-4 bg-white border border-ink-200 rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-ink-500 uppercase bg-ink-50 border-b border-ink-100">
            <tr>
              <th className="px-4 py-3 font-medium">Topic</th>
              {question.options?.map((opt) => (
                <th key={opt} className="px-4 py-3 font-medium text-center whitespace-nowrap">
                  {opt}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/50">
                <td className="px-4 py-3 font-medium text-ink-800">{row}</td>
                {question.options?.map((opt) => {
                  const isSelected = answers[row] === opt;
                  return (
                    <td key={opt} className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setAnswers((prev) => ({ ...prev, [row]: opt }))}
                        className={`w-5 h-5 rounded-full border flex items-center justify-center mx-auto transition-colors ${
                          isSelected
                            ? 'bg-ink-900 border-ink-900 text-white'
                            : 'border-ink-300 hover:border-ink-500'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-3 bg-ink-50 border-t border-ink-100 flex justify-end">
        <Button size="sm" onClick={handleSubmit} disabled={!isComplete}>
          Submit responses
        </Button>
      </div>
    </div>
  );
};
