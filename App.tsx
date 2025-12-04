import React, { useState } from 'react';
import { ViewMode, Survey } from './types';
import { Builder } from './components/Builder';
import { Interviewer } from './components/Interviewer';
import { Bot, FileText, Menu } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<ViewMode>('DASHBOARD');
  const [currentSurvey, setCurrentSurvey] = useState<Survey | null>(null);

  const handleSurveyCreated = (survey: Survey) => {
    setCurrentSurvey(survey);
  };

  const handlePreview = (survey: Survey) => {
    setCurrentSurvey(survey);
    setView('INTERVIEWER');
  };

  return (
    <div className="min-h-screen font-sans text-stone-900 bg-stone-50 selection:bg-stone-200">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-stone-200 z-50 flex items-center justify-between px-6 lg:px-12">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('DASHBOARD')}>
          <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center text-white">
            <Bot size={20} />
          </div>
          <span className="font-serif text-xl font-bold tracking-tight">Delphi</span>
        </div>
        
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setView('DASHBOARD')}
            className={`text-sm font-medium transition-colors hover:text-stone-900 ${view === 'DASHBOARD' || view === 'BUILDER' ? 'text-stone-900' : 'text-stone-400'}`}
          >
            Builder
          </button>
          <button 
             onClick={() => {
                if(currentSurvey) setView('INTERVIEWER');
             }}
             disabled={!currentSurvey}
             className={`text-sm font-medium transition-colors hover:text-stone-900 ${view === 'INTERVIEWER' ? 'text-stone-900' : 'text-stone-400'} disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            Interview
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 px-6 lg:px-12 min-h-screen max-w-5xl mx-auto">
        {(view === 'DASHBOARD' || view === 'BUILDER') && (
            <Builder 
                onSurveyCreated={handleSurveyCreated} 
                existingSurvey={currentSurvey}
                onPreview={handlePreview}
            />
        )}

        {view === 'INTERVIEWER' && currentSurvey && (
            <Interviewer 
                survey={currentSurvey} 
                onExit={() => setView('BUILDER')} 
            />
        )}
      </main>
      
      {/* Footer */}
      <footer className="py-8 text-center text-xs text-stone-400">
         <p>Powered by Gemini 2.5 Flash • Built with React & Tailwind</p>
      </footer>
    </div>
  );
}