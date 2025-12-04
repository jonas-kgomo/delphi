import React, { useEffect, useRef, useState } from 'react';
import { Message, Survey, QuestionType, Question } from '../types';
import { createInterviewSession } from '../services/geminiService';
import { Button } from './ui/Button';
import ReactMarkdown from 'react-markdown';
import { Send, Sparkles, Check } from 'lucide-react';
import { Chat } from '@google/genai';

interface InterviewerProps {
  survey: Survey;
  onExit: () => void;
}

export const Interviewer: React.FC<InterviewerProps> = ({ survey, onExit }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  useEffect(() => {
    const initChat = async () => {
      setIsLoading(true);
      try {
        const chat = createInterviewSession(survey);
        chatSessionRef.current = chat;
        
        // Start the conversation
        const result = await chat.sendMessage({ message: "Start the interview now." });
        const text = result.text || "";
        
        // Extract Question ID if present
        const { cleanText, questionId } = parseMessageForQID(text);

        setMessages([{
          id: crypto.randomUUID(),
          role: 'model',
          content: cleanText || "Hello! I'm ready to start the survey.",
          questionId
        }]);
      } catch (error) {
        console.error(error);
        setMessages([{
          id: crypto.randomUUID(),
          role: 'model',
          content: "I'm having trouble connecting to Delphi. Please try refreshing."
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    initChat();
  }, [survey]);

  // Helper to extract [[QID:abc]] tags
  const parseMessageForQID = (text: string) => {
    const regex = /\[\[QID:(.+?)\]\]/;
    const match = text.match(regex);
    if (match) {
      return {
        cleanText: text.replace(regex, '').trim(),
        questionId: match[1]
      };
    }
    return { cleanText: text, questionId: undefined };
  };

  const handleSend = async (textInput?: string) => {
    const contentToSend = textInput || input;
    if (!contentToSend.trim() || !chatSessionRef.current || isLoading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: contentToSend
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await chatSessionRef.current.sendMessage({ message: userMsg.content });
      const rawText = result.text || "";

      if (rawText.includes('[[END_OF_SURVEY]]')) {
        setIsFinished(true);
        const finalMsg = rawText.replace('[[END_OF_SURVEY]]', '').trim();
        if (finalMsg) {
             setMessages(prev => [...prev, {
            id: crypto.randomUUID(),
            role: 'model',
            content: finalMsg
          }]);
        }
      } else {
        const { cleanText, questionId } = parseMessageForQID(rawText);
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: 'model',
          content: cleanText,
          questionId
        }]);
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'system',
        content: "Sorry, there was an error processing your response."
      }]);
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

  // --- UI Renderers for Question Types ---

  const renderActiveQuestionUI = (qId: string) => {
    const question = survey.questions.find(q => q.id === qId);
    if (!question) return null;

    if (question.type === QuestionType.Scale) {
        return (
            <div className="flex flex-col gap-4 mt-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between text-xs text-stone-500 px-1">
                    <span>{question.minLabel || "Low"}</span>
                    <span>{question.maxLabel || "High"}</span>
                </div>
                <div className="flex gap-2 justify-between">
                    {[1, 2, 3, 4, 5].map(val => (
                        <button
                            key={val}
                            onClick={() => handleSend(val.toString())}
                            className="flex-1 aspect-square rounded-xl border border-stone-200 hover:border-stone-900 hover:bg-stone-900 hover:text-white transition-all text-stone-700 font-medium text-lg"
                        >
                            {val}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    if (question.type === QuestionType.MultipleChoice || question.type === QuestionType.YesNo) {
        const options = question.type === QuestionType.YesNo 
            ? ["Yes", "No"] 
            : (question.options || []);
        
        return (
            <div className="flex flex-col gap-2 mt-4 animate-in fade-in slide-in-from-bottom-2">
                {options.map((opt, i) => (
                    <button
                        key={i}
                        onClick={() => handleSend(opt)}
                        className="w-full text-left px-4 py-3 rounded-xl border border-stone-200 hover:border-stone-900 hover:bg-stone-900 hover:text-white transition-all text-stone-800"
                    >
                        {opt}
                    </button>
                ))}
            </div>
        );
    }

    if (question.type === QuestionType.Matrix) {
        return <MatrixInput question={question} onSend={handleSend} />;
    }

    return null;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-stone-200">
      {/* Header */}
      <div className="px-6 py-4 bg-stone-50 border-b border-stone-100 flex justify-between items-center">
        <div>
          <h2 className="font-serif font-bold text-stone-800">{survey.title}</h2>
          <p className="text-xs text-stone-500">Conducting Interview • {survey.questions.length} questions</p>
        </div>
        <Button size="sm" variant="ghost" onClick={onExit}>End</Button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => {
            const isLatestModelMsg = idx === messages.length - 1 && msg.role === 'model';
            
            return (
                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div 
                        className={`max-w-[85%] rounded-2xl px-5 py-3 text-md leading-relaxed shadow-sm ${
                        msg.role === 'user' 
                            ? 'bg-stone-900 text-stone-50 rounded-br-none' // Dark bubble, light text
                            : msg.role === 'system'
                            ? 'bg-red-50 text-red-600 border border-red-100'
                            : 'bg-stone-100 text-stone-800 rounded-bl-none border border-stone-200'
                        }`}
                    >
                        <ReactMarkdown 
                            components={{
                                p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                                strong: ({node, ...props}) => <span className={`font-semibold ${msg.role === 'user' ? 'text-white' : 'text-stone-900'}`} {...props} />
                            }}
                        >
                            {msg.content}
                        </ReactMarkdown>
                    </div>

                    {/* Render Interactive UI only for the latest message if waiting for answer */}
                    {isLatestModelMsg && msg.questionId && !isLoading && !isFinished && (
                        <div className="w-full max-w-[85%]">
                            {renderActiveQuestionUI(msg.questionId)}
                        </div>
                    )}
                </div>
            );
        })}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-stone-50 rounded-2xl rounded-bl-none px-4 py-3 border border-stone-100 flex items-center gap-2">
               <Sparkles className="w-4 h-4 text-stone-400 animate-pulse" />
               <span className="text-sm text-stone-400">Delphi is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {isFinished ? (
        <div className="p-6 bg-stone-50 text-center border-t border-stone-100">
            <h3 className="font-serif text-lg font-bold text-stone-800 mb-2">Interview Complete</h3>
            <p className="text-stone-600 mb-4">Thank you for your time. Your responses have been recorded.</p>
            <Button onClick={onExit} className="w-full">Return to Dashboard</Button>
        </div>
      ) : (
        <div className="p-4 bg-white border-t border-stone-100">
            {/* The text input should always be light, with dark text for contrast */}
            <div className="relative flex items-end gap-2 bg-stone-50 p-2 rounded-xl border border-stone-200 focus-within:ring-2 focus-within:ring-stone-200 transition-all">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your answer..."
                    className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-2 px-2 text-stone-900 placeholder-stone-400"
                    rows={1}
                />
                <Button 
                    onClick={() => handleSend()} 
                    disabled={!input.trim() || isLoading}
                    size="sm"
                    className="mb-1"
                >
                    <Send className="w-4 h-4" />
                </Button>
            </div>
            <div className="text-center mt-2">
                <span className="text-[10px] text-stone-400 uppercase tracking-widest">
                    Press Enter to send
                </span>
            </div>
        </div>
      )}
    </div>
  );
};

// Specialized Matrix Component to handle multi-step state within the Chat UI
const MatrixInput = ({ question, onSend }: { question: Question, onSend: (val: string) => void }) => {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    
    // We send the data when all rows are answered
    const rows = question.rows || [];
    const isComplete = rows.every(r => answers[r]);

    const handleSubmit = () => {
        // Format: "Topic: Choice; Topic: Choice"
        const formatted = Object.entries(answers).map(([k, v]) => `${k}: ${v}`).join('; ');
        onSend(formatted);
    };

    return (
        <div className="mt-4 bg-white border border-stone-200 rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-stone-500 uppercase bg-stone-50 border-b border-stone-100">
                        <tr>
                            <th className="px-4 py-3 font-medium">Topic</th>
                            {question.options?.map(opt => (
                                <th key={opt} className="px-4 py-3 font-medium text-center whitespace-nowrap">{opt}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <tr key={i} className="border-b border-stone-50 last:border-0 hover:bg-stone-50/50">
                                <td className="px-4 py-3 font-medium text-stone-800">{row}</td>
                                {question.options?.map(opt => {
                                    const isSelected = answers[row] === opt;
                                    return (
                                        <td key={opt} className="px-4 py-3 text-center">
                                            <button 
                                                onClick={() => setAnswers(prev => ({ ...prev, [row]: opt }))}
                                                className={`w-5 h-5 rounded-full border flex items-center justify-center mx-auto transition-colors ${
                                                    isSelected 
                                                    ? 'bg-stone-900 border-stone-900 text-white' 
                                                    : 'border-stone-300 hover:border-stone-500'
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
            <div className="p-3 bg-stone-50 border-t border-stone-100 flex justify-end">
                <Button size="sm" onClick={handleSubmit} disabled={!isComplete}>
                    Submit Responses
                </Button>
            </div>
        </div>
    );
};