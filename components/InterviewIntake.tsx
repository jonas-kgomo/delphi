import React from 'react';
import { Survey } from '../types';
import { GoogleLogin } from '@react-oauth/google';
import { db } from '../services/db';
import { captureGoogleCredential } from '../lib/authProfile';

interface InterviewIntakeProps {
  survey: Survey;
  /** Shown when the respondent must sign in before the chat starts */
  nonce: string;
}

/** Login-only gate — identity comes from Google; consent happens in the chat. */
export const InterviewIntake: React.FC<InterviewIntakeProps> = ({ survey, nonce }) => {
  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full bg-ink-50 rounded-2xl overflow-hidden border border-ink-200 shadow-xl">
      <div className="relative flex-1 overflow-y-auto">
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, #1a3a2f 0%, transparent 45%), radial-gradient(circle at 80% 60%, #c45c26 0%, transparent 40%)',
          }}
        />
        <div className="relative max-w-lg mx-auto px-6 py-10 space-y-8">
          <header className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-700">
            <p className="text-[11px] uppercase tracking-[0.28em] text-ink-500">
              Sign in to continue
            </p>
            <h1 className="font-display text-3xl sm:text-4xl text-ink-950 leading-tight">
              {survey.title}
            </h1>
            <p className="text-ink-600 leading-relaxed text-[15px]">
              {survey.description ||
                'This is a conversation, not a form. Sign in so we can address you properly — consent and the interview happen in chat.'}
            </p>
          </header>

          <section className="space-y-4 bg-white/80 backdrop-blur-sm border border-ink-200 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <p className="text-sm text-ink-700 leading-snug">
              Use your Google account. We’ll use your name, photo, and email from Google — no
              separate form.
            </p>
            <div className="flex justify-center pt-1">
              <GoogleLogin
                nonce={nonce}
                onError={() => alert('Login failed')}
                onSuccess={({ credential }) => {
                  if (!credential) return;
                  captureGoogleCredential(credential);
                  db.auth
                    .signInWithIdToken({
                      clientName: 'google-button-for-web',
                      idToken: credential,
                      nonce,
                    })
                    .catch((err) => {
                      alert('Uh oh: ' + err.body?.message);
                    });
                }}
              />
            </div>
          </section>

          <p className="text-center text-xs text-ink-400">
            Takes about {Math.max(5, survey.questions.length * 2)} minutes · conversational pace
          </p>
        </div>
      </div>
    </div>
  );
};
