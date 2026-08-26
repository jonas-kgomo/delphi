import React, { useState, useEffect, useRef } from 'react';
import { Survey, Question, QuestionType, AIModelType } from '../types';
import { generateSurveyFromGoal } from '../services/geminiService';
import { Button } from './ui/Button';
import { Plus, Trash2, ArrowRight, Table, LayoutList, Layers, Users, Globe, MapPin, SquareMousePointer, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { brandSession } from '../lib/brand';

interface BuilderProps {
  onSurveyCreated: (survey: Survey) => void;
  existingSurvey?: Survey | null;
  onPreview: (survey: Survey) => void;
  model: AIModelType;
  /** When false, the composer stays usable but Generate asks for sign-in */
  isAuthenticated?: boolean;
  onAuthRequired?: () => void;
  /** Hide the page title when embedded on the landing page */
  embedded?: boolean;
}

const TEMPLATES = [
  {
    label: "Customer Feedback",
    prompt: "Create a customer feedback survey for a mobile application, focusing on usability, features, and net promoter score."
  },
  {
    label: "Event Registration",
    prompt: "Create an event registration survey for a tech conference, asking for dietary restrictions, workshop preferences, and travel details."
  },
  {
    label: "Natal · Public Works",
    prompt: "Create a KwaZulu-Natal interview for the Department of Public Works and Infrastructure: how people experience clinics, schools, government offices, and the roads that serve them — what fails, who is told, whether anyone arrives, and whether EPWP work should stay with maintenance rather than only new builds. Deliberative, for a civic bridge from the ward to Pretoria. Not a satisfaction score."
  },
  {
    label: "eMalahleni · Local Benefit",
    prompt: "Create a Mpumalanga interview for the Department of Public Works and Infrastructure: how should this infrastructure project create opportunities for local workers and businesses? Job creation and infrastructure-led growth are explicit departmental priorities. Ask what makes temporary employment lead to lasting opportunity — a trade, a local supplier kept on, maintenance after handover — and whether local labour belongs in the tender, not only in the speech. Deliberative, not a jobs-announced score."
  },
  {
    label: "Cape · Climate",
    prompt: "Create a community climate-resilience interview for the Eastern Cape: drought, flood, coastal change, informal adaptation (livestock, water points), and whether vernacular weather knowledge should count as official observation. Deliberative, not a yes/no on climate change."
  },
  {
    label: "Vhembe · Malaria",
    prompt: "Create a community malaria interview for Vhembe District, Limpopo: what people actually use at night, where fever is treated first, whether indoor spraying should wait for people to be home, and how seasonal and cross-border work meets the programme calendar. Deliberative, not a quiz on mosquitoes."
  },
  {
    label: "Kenya · Subjective Views",
    prompt: "Create an interview on subjective views of AI in a low-resource, multilingual setting: where people met the tool, what broke trust (language, connectivity, records leaving the room), job-loss fear, and who must sit in the governance room. Values and efficacy as lived — not a model benchmark."
  },
  {
    label: "Lagos · Digital ID",
    prompt: "Create an interview on digital ID in Lagos: where people met NIN or SIM-NIN processes, what broke trust (distance to the centre, cut lines, failed biometrics), whether the ID should stay a credential rather than a gate, and who must sit in the governance room — including people who will never complete enrolment. Values as lived — not a dashboard of numbers issued."
  },
  {
    label: "A/B Testing (Tournament)",
    prompt: "Create an A/B test survey comparing 4 digital health tools. Determine the absolute favorite by running an immersive pairwise A/B scenario."
  }
];

const DOMAINS = ["General Inquiry", "Scientific Research", "Medical / Clinical", "Political Polling", "Market Research", "Classic Survey"];
const TONES = ["Neutral & Objective", "Empathetic & Warm", "Formal & Academic", "Casual & Engaging"];

export const Builder: React.FC<BuilderProps> = ({
  onSurveyCreated,
  existingSurvey,
  onPreview,
  model,
  isAuthenticated = true,
  onAuthRequired,
  embedded = false,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [survey, setSurvey] = useState<Survey | null>(existingSurvey || null);
  const [error, setError] = useState<string | null>(null);

  // Context State
  const [domain, setDomain] = useState(DOMAINS[0]);
  const [tone, setTone] = useState(TONES[0]);
  const [audience, setAudience] = useState("");
  const [region, setRegion] = useState("");
  const [contextOpen, setContextOpen] = useState(false);
  const contextRef = useRef<HTMLDivElement>(null);

  // Sync when parent selects a published survey (new draft remounts via key)
  useEffect(() => {
    if (!existingSurvey) return;
    if (survey?.id === existingSurvey.id) return;
    setSurvey(existingSurvey);
  }, [existingSurvey, survey?.id]);

  useEffect(() => {
    if (!contextOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!contextRef.current?.contains(e.target as Node)) setContextOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [contextOpen]);

  const runGenerate = async (opts: {
    prompt: string;
    domain: string;
    tone: string;
    audience: string;
    region: string;
  }) => {
    setIsGenerating(true);
    setError(null);
    const fullPrompt = `
      Research Goal: "${opts.prompt}"
      Context & Domain: ${opts.domain}
      Target Audience: ${opts.audience || 'General Population'}
      Region/Location: ${opts.region || 'Global'}
      Desired Tone: ${opts.tone}
    `;
    try {
      const generatedSurvey = await generateSurveyFromGoal(fullPrompt, model);
      setSurvey(generatedSurvey);
      onSurveyCreated(generatedSurvey);
    } catch {
      setError("We couldn't generate the survey. Please try clarifying your goal.");
    } finally {
      setIsGenerating(false);
      setContextOpen(false);
    }
  };

  const handleGenerate = async (overridePrompt?: string) => {
    const promptToUse = overridePrompt || prompt;
    if (!promptToUse.trim()) return;

    if (!isAuthenticated) {
      try {
        brandSession.set(
          'pending_compose',
          JSON.stringify({ prompt: promptToUse, domain, tone, audience, region })
        );
      } catch { /* ignore */ }
      onAuthRequired?.();
      return;
    }

    await runGenerate({ prompt: promptToUse, domain, tone, audience, region });
  };

  // Resume compose after sign-in from landing
  useEffect(() => {
    if (!isAuthenticated || survey || isGenerating) return;
    try {
      const raw = brandSession.get('pending_compose');
      if (!raw) return;
      const pending = JSON.parse(raw) as {
        prompt?: string;
        domain?: string;
        tone?: string;
        audience?: string;
        region?: string;
      };
      brandSession.remove('pending_compose');
      if (!pending.prompt?.trim()) return;
      setPrompt(pending.prompt);
      if (pending.domain) setDomain(pending.domain);
      if (pending.tone) setTone(pending.tone);
      if (pending.audience != null) setAudience(pending.audience);
      if (pending.region != null) setRegion(pending.region);
      void runGenerate({
        prompt: pending.prompt,
        domain: pending.domain || DOMAINS[0],
        tone: pending.tone || TONES[0],
        audience: pending.audience || '',
        region: pending.region || '',
      });
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when auth flips on
  }, [isAuthenticated]);

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    if (!survey) return;
    const newQuestions = survey.questions.map(q => 
      q.id === id ? { ...q, ...updates } : q
    );
    const updatedSurvey = { ...survey, questions: newQuestions };
    setSurvey(updatedSurvey);
    onSurveyCreated(updatedSurvey);
  };

  const deleteQuestion = (id: string) => {
    if (!survey) return;
    const newQuestions = survey.questions.filter(q => q.id !== id);
    const updatedSurvey = { ...survey, questions: newQuestions };
    setSurvey(updatedSurvey);
    onSurveyCreated(updatedSurvey);
  };

  const contextBits = [
    domain !== DOMAINS[0] ? domain : null,
    audience.trim() || null,
    region.trim() || null,
    tone !== TONES[0] ? tone : null,
  ].filter(Boolean) as string[];
  const contextLabel = contextBits.length ? contextBits.join(' · ') : 'Context';
  const fieldClass =
    'w-full h-9 px-2.5 rounded-lg border border-ink-200 bg-ink-50 text-sm text-ink-800 outline-none focus:border-ink-800 focus:ring-2 focus:ring-ink-100';

  if (!survey) {
    return (
      <div className="w-full">
        {!embedded && (
          <div className="mb-6">
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-ink-800 mb-2 tracking-tight">
              What do you want to learn?
            </h1>
            <p className="text-ink-800/60 text-sm max-w-lg">
              How a service is used, whether a policy lands, why a product is refused — we compose the
              interview.
            </p>
          </div>
        )}

        <div className="w-full relative z-10 mb-5 bg-white rounded-2xl border border-ink-200 shadow-sm focus-within:border-ink-800 focus-within:ring-4 focus-within:ring-ink-100 transition-[border-color,box-shadow] duration-150">
          <div className="flex items-start gap-3 px-4 sm:px-5 pt-4">
            <SquareMousePointer className="w-5 h-5 text-ink-300 mt-1.5 shrink-0" strokeWidth={1.75} />
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. How this ward reaches the clinic — and who they tell when it fails"
              className="w-full pb-4 text-2xl sm:text-3xl font-serif text-ink-900 placeholder-ink-300 bg-transparent outline-none resize-none min-h-[140px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleGenerate();
                }
              }}
            />
          </div>

          <div className="flex items-center gap-2 border-t border-ink-100 px-3 py-2">
            <div ref={contextRef} className="relative min-w-0">
              <button
                type="button"
                onClick={() => setContextOpen((open) => !open)}
                aria-haspopup="dialog"
                aria-expanded={contextOpen}
                aria-label="Interview context"
                className={`flex items-center gap-1.5 max-w-[min(100%,16rem)] sm:max-w-xs h-10 pl-2.5 pr-2 rounded-lg border text-sm font-medium transition-[transform,background-color,border-color] duration-150 active:scale-[0.97] ${
                  contextOpen || contextBits.length
                    ? 'border-ink-800 bg-ink-50 text-ink-900'
                    : 'border-ink-200 bg-white text-ink-600 hover:border-ink-400 hover:text-ink-800'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 shrink-0 text-ink-400" strokeWidth={2} />
                <span className="truncate">{contextLabel}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 shrink-0 text-ink-400 transition-transform duration-150 ${contextOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {contextOpen && (
                <div
                  role="dialog"
                  aria-label="Interview context"
                  className="absolute left-0 bottom-full mb-2 w-[min(calc(100vw-2rem),20rem)] rounded-xl border border-ink-200 bg-white shadow-lg shadow-ink-950/5 p-3 z-50 origin-bottom-left"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <label className="block mb-2.5">
                    <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-ink-400 mb-1">
                      <Layers className="w-3 h-3" />
                      Domain
                    </span>
                    <select
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className={fieldClass}
                    >
                      {DOMAINS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block mb-2.5">
                    <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-ink-400 mb-1">
                      <Users className="w-3 h-3" />
                      Audience
                    </span>
                    <input
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      placeholder="e.g. ward residents"
                      className={fieldClass}
                    />
                  </label>
                  <label className="block mb-2.5">
                    <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-ink-400 mb-1">
                      <MapPin className="w-3 h-3" />
                      Region
                    </span>
                    <input
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder="e.g. KwaZulu-Natal"
                      className={fieldClass}
                    />
                  </label>
                  <label className="block">
                    <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-ink-400 mb-1">
                      <Globe className="w-3 h-3" />
                      Tone
                    </span>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className={fieldClass}
                    >
                      {TONES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
            </div>

            <Button
              onClick={() => void handleGenerate()}
              disabled={!prompt.trim()}
              isLoading={isGenerating}
              className="ml-auto shrink-0 rounded-xl px-3 sm:px-4 text-sm gap-1.5 whitespace-nowrap active:scale-[0.97]"
            >
              <>
                <span className="sm:hidden">Compose</span>
                <span className="hidden sm:inline">Compose survey</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-70" strokeWidth={2} />
                <span className="font-serif font-semibold">Interview</span>
              </>
            </Button>
          </div>
        </div>

        {!isAuthenticated && (
          <p className="text-sm text-ink-500 mb-4">
            You can draft your goal freely. Sign in when you’re ready to generate.
          </p>
        )}

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="w-full mt-2">
          <p className="text-[11px] font-semibold tracking-wider text-ink-400 uppercase mb-3 flex items-center gap-2">
            <Layers className="w-3.5 h-3.5" />
            Start from a template
          </p>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPrompt(t.prompt)}
                className="px-3.5 py-1.5 bg-white border border-ink-200 rounded-full hover:border-ink-800 hover:bg-ink-50 text-sm font-medium text-ink-600 hover:text-ink-900 active:scale-[0.97] transition-[transform,background-color,border-color,color] duration-150"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto pb-20 animate-in slide-in-from-bottom-4 duration-500 ">
      {/* Header */}
      <div className="mb-12 border-b border-stone-200 pb-8">
        <input 
          value={survey.title}
          onChange={(e) => {
            const updated = { ...survey, title: e.target.value };
            setSurvey(updated);
            onSurveyCreated(updated);
          }}
          className="text-4xl font-serif font-bold text-stone-900 w-full bg-transparent outline-none placeholder-stone-300"
          placeholder="Survey Title"
        />
        <textarea 
          value={survey.description}
          onChange={(e) => {
            const updated = { ...survey, description: e.target.value };
            setSurvey(updated);
            onSurveyCreated(updated);
          }}
          className="mt-4 w-full text-lg text-stone-500 bg-transparent outline-none resize-none placeholder-stone-300"
          placeholder="Add a description..."
          rows={2}
        />
      </div>

      {/* Questions List */}
      <div className="space-y-8">
        {survey.questions.map((q, index) => (
          <div key={q.id} className="group relative bg-white p-6 rounded-xl shadow-sm border border-stone-100 hover:shadow-md transition-all">
             <div className="absolute -left-10 top-6 text-stone-300 font-serif text-xl font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                {index + 1}
             </div>
             
             {/* Question Type Badge */}
             <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold tracking-wider text-stone-400 uppercase bg-stone-50 px-2 py-1 rounded">
                    {q.type.replace('_', ' ')}
                    </span>
                    {q.type === QuestionType.Matrix && <Table className="w-4 h-4 text-stone-400" />}
                    {q.type === QuestionType.MultipleChoice && <LayoutList className="w-4 h-4 text-stone-400" />}
                </div>
                <button onClick={() => deleteQuestion(q.id)} className="text-stone-300 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
             </div>

             {/* Question Text */}
             <input 
                value={q.text}
                onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                className="w-full text-xl font-medium text-stone-800 bg-transparent outline-none border-b border-transparent focus:border-stone-200 pb-1 mb-4"
                placeholder="Question text..."
             />

             {/* Dynamic Inputs based on Type */}
             <div className="pl-4 border-l-2 border-stone-100">
                {(q.type === QuestionType.MultipleChoice || q.type === QuestionType.AB_TEST) && (
                  <div className="space-y-2">
                    {q.type === QuestionType.AB_TEST && <div className="text-xs text-stone-400 mb-2 uppercase">Items for Tournament</div>}
                    {q.options?.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2 text-stone-600">
                        <div className="w-4 h-4 rounded-full border border-stone-300"></div>
                        <input 
                          value={opt}
                          onChange={(e) => {
                            const newOptions = [...(q.options || [])];
                            newOptions[i] = e.target.value;
                            updateQuestion(q.id, { options: newOptions });
                          }}
                          className="bg-transparent outline-none w-full"
                        />
                      </div>
                    ))}
                    <button 
                      onClick={() => updateQuestion(q.id, { options: [...(q.options || []), "New Option"] })}
                      className="text-sm text-stone-400 hover:text-stone-900 flex items-center gap-1 mt-2"
                    >
                      <Plus className="w-3 h-3" /> Add Option
                    </button>
                  </div>
                )}

                {q.type === QuestionType.Scale && (
                   <div className="flex justify-between text-sm text-stone-500 px-4 py-2 bg-stone-50 rounded-lg">
                      <span>1 - {q.minLabel || "Disagree"}</span>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(n => (
                          <div key={n} className="w-6 h-6 rounded-full border border-stone-300"></div>
                        ))}
                      </div>
                      <span>5 - {q.maxLabel || "Agree"}</span>
                   </div>
                )}

                {q.type === QuestionType.Matrix && (
                    <div className="bg-stone-50 rounded-lg p-4 overflow-x-auto">
                        <div className="text-xs text-stone-400 uppercase mb-2">Rows (Items)</div>
                         {q.rows?.map((row, i) => (
                            <div key={i} className="mb-2 flex items-center gap-2">
                                <input 
                                    value={row}
                                    onChange={(e) => {
                                        const newRows = [...(q.rows || [])];
                                        newRows[i] = e.target.value;
                                        updateQuestion(q.id, { rows: newRows });
                                    }}
                                    className="w-full bg-white border border-stone-200 px-2 py-1 rounded text-sm"
                                />
                            </div>
                         ))}
                         <button 
                            onClick={() => updateQuestion(q.id, { rows: [...(q.rows || []), "New Item"] })}
                            className="text-xs text-stone-400 hover:text-stone-900 flex items-center gap-1 mb-4"
                         >
                            <Plus className="w-3 h-3" /> Add Row
                         </button>

                         <div className="text-xs text-stone-400 uppercase mb-2">Columns (Options)</div>
                         <div className="flex gap-2">
                             {q.options?.map((opt, i) => (
                                 <input 
                                    key={i}
                                    value={opt}
                                    onChange={(e) => {
                                        const newOpts = [...(q.options || [])];
                                        newOpts[i] = e.target.value;
                                        updateQuestion(q.id, { options: newOpts });
                                    }}
                                    className="bg-white border border-stone-200 px-2 py-1 rounded text-sm w-32"
                                 />
                             ))}
                             <button 
                                onClick={() => updateQuestion(q.id, { options: [...(q.options || []), "Option"] })}
                                className="w-8 h-8 flex items-center justify-center rounded bg-stone-200 text-stone-500 hover:bg-stone-300"
                             >
                                <Plus className="w-3 h-3" />
                             </button>
                         </div>
                    </div>
                )}

                {(q.type === QuestionType.ShortText || q.type === QuestionType.LongText) && (
                  <div className="h-10 border-b border-stone-200 w-2/3 text-stone-300 flex items-center select-none">
                    User answer will go here...
                  </div>
                )}
             </div>
          </div>
        ))}
      </div>

      <div className="mt-12 flex justify-between items-center sticky bottom-8 bg-stone-50/80 backdrop-blur-md p-4 rounded-2xl border border-stone-200/50 shadow-lg z-10">
         <div className="text-sm text-stone-500">
            {survey.questions.length} Questions
         </div>
         <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setSurvey(null)}>
               Reset
            </Button>
            <Button onClick={() => onPreview(survey)}>
               Start Interview <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
         </div>
      </div>
    </div>
  );
};