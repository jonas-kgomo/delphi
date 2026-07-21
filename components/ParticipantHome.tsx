import React from 'react';
import { ArrowRight, MessagesSquare, SquarePen } from 'lucide-react';
import { DelphiAvatar, UserAvatar } from './Avatars';
import type { AuthProfile } from '../lib/authProfile';
import type { LandingSurveyRow } from './Landing';

interface ParticipantHomeProps {
  profile: AuthProfile;
  publicSurveys: LandingSurveyRow[];
  onTakeSurvey: (surveyId: string) => void;
  onCreate: () => void;
  onSignOut: () => void;
  onHome: () => void;
}

/**
 * Simple post-login home for participants — surveys first, studio optional.
 */
export const ParticipantHome: React.FC<ParticipantHomeProps> = ({
  profile,
  publicSurveys,
  onTakeSurvey,
  onCreate,
  onSignOut,
  onHome,
}) => {
  const first = publicSurveys[0];
  const onlyOne = publicSurveys.length === 1;

  return (
    <div className="min-h-screen font-sans text-ink-800 bg-cream">
      <nav className="flex items-center justify-between px-6 sm:px-10 h-14 border-b border-ink-800/10 bg-cream">
        <button type="button" onClick={onHome} className="flex items-center gap-2.5">
          <DelphiAvatar size="sm" />
          <span className="font-serif text-lg font-semibold tracking-tight">Delphi</span>
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCreate}
            className="hidden sm:inline-flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900"
          >
            <SquarePen size={14} />
            Create an interview
          </button>
          <button type="button" onClick={onSignOut} className="text-xs text-ink-400 hover:text-ink-700">
            Sign out
          </button>
          <UserAvatar name={profile.name} picture={profile.picture} size="md" />
        </div>
      </nav>

      <main className="max-w-xl mx-auto px-6 py-12 sm:py-16 space-y-10">
        <header className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.28em] text-ink-400">Welcome</p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-ink-900 tracking-tight">
            Hi{profile.firstName ? `, ${profile.firstName}` : ''}
          </h1>
          <p className="text-ink-600 text-base leading-relaxed">
            Pick an interview to join. You can also create your own anytime.
          </p>
        </header>

        {publicSurveys.length === 0 ? (
          <div className="border border-dashed border-ink-800/15 rounded-2xl px-6 py-12 text-center space-y-4">
            <MessagesSquare className="mx-auto text-ink-300" size={28} />
            <p className="text-sm text-ink-500">No public interviews open right now.</p>
            <button
              type="button"
              onClick={onCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-ink-900 text-white text-sm font-medium rounded-full hover:bg-ink-800"
            >
              Create an interview
              <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {onlyOne && first && (
              <button
                type="button"
                onClick={() => onTakeSurvey(first.id)}
                className="w-full text-left bg-forest text-white rounded-2xl px-6 py-6 hover:bg-leaf-700 transition-colors group"
              >
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/50 mb-2">
                  Ready for you
                </p>
                <h2 className="font-serif text-2xl font-semibold leading-snug mb-2">{first.title}</h2>
                {first.description && (
                  <p className="text-sm text-white/70 line-clamp-2 mb-4">{first.description}</p>
                )}
                <span className="inline-flex items-center gap-2 text-sm font-medium text-white group-hover:gap-3 transition-all">
                  Start interview
                  <ArrowRight size={16} />
                </span>
              </button>
            )}

            {!onlyOne && (
              <>
                <h2 className="text-sm font-medium text-ink-500">Open interviews</h2>
                <ul className="space-y-3">
                  {publicSurveys.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => onTakeSurvey(s.id)}
                        className="w-full text-left bg-white border border-ink-800/10 rounded-xl px-5 py-4 hover:border-ink-800/25 transition-colors"
                      >
                        <h3 className="font-serif text-lg font-semibold text-ink-900">{s.title}</h3>
                        {s.description && (
                          <p className="text-sm text-ink-500 mt-1 line-clamp-2">{s.description}</p>
                        )}
                        <span className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-leaf-500">
                          Start interview
                          <ArrowRight size={14} />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {onlyOne && publicSurveys.length > 1 && null}

            <button
              type="button"
              onClick={onCreate}
              className="w-full sm:w-auto text-sm text-ink-500 hover:text-ink-800 underline underline-offset-4"
            >
              Or create your own interview
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
