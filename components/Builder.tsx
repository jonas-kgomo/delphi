import React, { useState } from 'react';
import { Survey, Question, QuestionType } from '../types';
import { generateSurveyFromGoal } from '../services/geminiService';
import { Button } from './ui/Button';
import { Plus, Trash2, Wand2, ArrowRight, Table, LayoutList } from 'lucide-react';

interface BuilderProps {
  onSurveyCreated: (survey: Survey) => void;
  existingSurvey?: Survey | null;
  onPreview: (survey: Survey) => void;
}

const TEMPLATES = [
  {
    label: "Feedback Form",
    icon: "💬",
    prompt: "Create a customer feedback survey for a mobile application, focusing on usability, features, and net promoter score."
  },
  {
    label: "Event Registration",
    icon: "🎉",
    prompt: "Create an event registration survey for a tech conference, asking for dietary restrictions, workshop preferences, and travel details."
  },
  {
    label: "Public Health (Malaria)",
    icon: "🏥",
    prompt: "Create a public health survey to assess malaria awareness, prevention habits (bed nets), and recent symptoms in a rural community."
  }
];

export const Builder: React.FC<BuilderProps> = ({ onSurveyCreated, existingSurvey, onPreview }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [survey, setSurvey] = useState<Survey | null>(existingSurvey || null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (overridePrompt?: string) => {
    const promptToUse = overridePrompt || prompt;
    if (!promptToUse.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    try {
      const generatedSurvey = await generateSurveyFromGoal(promptToUse);
      setSurvey(generatedSurvey);
      onSurveyCreated(generatedSurvey);
    } catch (err) {
      setError("We couldn't generate the survey. Please try clarifying your goal.");
    } finally {
      setIsGenerating(false);
    }
  };

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

  if (!survey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 max-w-2xl mx-auto text-center animate-in fade-in zoom-in duration-500">
        <div className="bg-stone-100 p-4 rounded-full mb-6">
          <Wand2 className="w-8 h-8 text-stone-600" />
        </div>
        <h1 className="text-4xl font-serif font-medium text-stone-900 mb-4">
          What do you want to discover?
        </h1>
        <p className="text-stone-500 text-lg mb-8 max-w-lg">
          Describe your research goal. Delphi will draft a complete survey with matrices, scales, and logic in seconds.
        </p>
        
        <div className="w-full relative mb-12">
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., I want to understand why Gen Z prefers thrifting over fast fashion..."
            className="w-full p-4 pr-14 text-lg border-2 border-stone-200 rounded-xl focus:border-stone-900 focus:ring-0 outline-none resize-none shadow-sm transition-all min-h-[120px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleGenerate();
              }
            }}
          />
          <div className="absolute bottom-4 right-4">
            <Button 
              onClick={() => handleGenerate()} 
              disabled={!prompt.trim()} 
              isLoading={isGenerating}
              size="sm"
            >
              Generate
            </Button>
          </div>
        </div>
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="w-full border-t border-stone-200 pt-8">
            <p className="text-xs font-semibold tracking-wider text-stone-400 uppercase mb-4">Quick Start Templates</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {TEMPLATES.map((t, i) => (
                    <button 
                        key={i}
                        onClick={() => {
                            setPrompt(t.prompt);
                            handleGenerate(t.prompt);
                        }}
                        className="flex flex-col items-center p-4 bg-white border border-stone-200 rounded-xl hover:border-stone-900 hover:shadow-md transition-all text-left group"
                    >
                        <span className="text-2xl mb-2 grayscale group-hover:grayscale-0 transition-all">{t.icon}</span>
                        <span className="font-medium text-stone-800 text-sm">{t.label}</span>
                    </button>
                ))}
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-20 animate-in slide-in-from-bottom-4 duration-500 ">
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
                {q.type === QuestionType.MultipleChoice && (
                  <div className="space-y-2">
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