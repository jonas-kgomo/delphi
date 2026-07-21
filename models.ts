import type { LucideIcon } from 'lucide-react';
import { Zap, Eye, Brain, Feather } from 'lucide-react';
import type { AIModelType } from './types';

export interface AIModelOption {
  id: AIModelType;
  label: string;
  hint: string;
  Icon: LucideIcon;
}

/** Product-facing names — never expose underlying provider model IDs in the UI */
export const AI_MODELS: AIModelOption[] = [
  { id: 'herald',   label: 'Herald',   hint: 'Quick & light',       Icon: Zap },
  { id: 'oracle',   label: 'Oracle',   hint: 'Clear judgment',      Icon: Eye },
  { id: 'sibyl',    label: 'Sibyl',    hint: 'Deep reflection',     Icon: Brain },
  { id: 'composer', label: 'Composer', hint: 'Highest fidelity',    Icon: Feather },
];

export const DEFAULT_AI_MODEL: AIModelType = 'herald';

export const getAIModel = (id: AIModelType): AIModelOption =>
  AI_MODELS.find((m) => m.id === id) || AI_MODELS[0];
