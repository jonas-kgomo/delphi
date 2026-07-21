import { init, id, tx, lookup } from '@instantdb/react';

// InstantDB schema for Delphi
// Tables: surveys, responses, utterances, votes

const APP_ID = import.meta.env.VITE_INSTANT_APP_ID || "";
if (!APP_ID) {
  console.error("VITE_INSTANT_APP_ID is missing from environment variables!");
}

type Schema = {
  surveys: {
    id: string;
    title: string;
    description: string;
    questions: string; // JSON-stringified Question[]
    model: string;
    createdAt: number;
    creatorId: string;
    deliberationOpen?: boolean;
    /** Listed on the public directory for anyone to discover */
    isPublic?: boolean;
  };
  responses: {
    id: string;
    surveyId: string;
    answers: string; // JSON-stringified { questionId: answer }
    transcript: string; // JSON-stringified Message[]
    respondentId: string;
    participant?: string; // JSON-stringified ParticipantIntake
    completedAt: number;
  };
  /** Polis-style statements distilled from responses or submitted by voters */
  utterances: {
    id: string;
    surveyId: string;
    text: string;
    source: 'extracted' | 'participant';
    authorId: string;
    createdAt: number;
  };
  /** Agree / Disagree / Pass — one vote per voter per utterance */
  votes: {
    id: string;
    utteranceId: string;
    surveyId: string;
    voterId: string;
    value: 'agree' | 'disagree' | 'pass';
    reason?: string;
    createdAt: number;
  };
};

export const db = init({ appId: APP_ID });

export { id, tx, lookup };

// --- Helper: Get or create a persistent anonymous session ID ---
export const getSessionId = (): string => {
  let sessionId = localStorage.getItem('delphi_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('delphi_session_id', sessionId);
  }
  return sessionId;
};
