export enum QuestionType {
  MultipleChoice = 'MULTIPLE_CHOICE',
  Scale = 'SCALE',
  ShortText = 'SHORT_TEXT',
  LongText = 'LONG_TEXT',
  YesNo = 'YES_NO',
  Matrix = 'MATRIX'
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[]; // For MultipleChoice (columns in Matrix)
  rows?: string[]; // For Matrix (the list of items to rate)
  minLabel?: string; // For Scale
  maxLabel?: string; // For Scale
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  questionId?: string; // To trigger UI rendering
  isThinking?: boolean;
}

export type ViewMode = 'DASHBOARD' | 'BUILDER' | 'INTERVIEWER' | 'RESULTS';