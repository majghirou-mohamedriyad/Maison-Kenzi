/**
 * Module i18n Maison Kenzi (Autonome)
 */

export interface DeepLUsageResult {
  ok: boolean;
  isFreeKey?: boolean;
  character_count?: number;
  character_limit?: number;
  error?: string;
}

export interface TranslationResult {
  success: boolean;
  translatedText?: string;
  translations?: string[];
  error?: string;
}

export const checkDeeplUsage = async (): Promise<DeepLUsageResult> => {
  return { ok: true, character_count: 0, character_limit: 0 };
};

export const translateWithDeepl = async (text: string): Promise<TranslationResult> => {
  return { success: true, translatedText: text };
};

export const translateBatchWithDeepl = async (texts: string[]): Promise<string[]> => {
  return texts;
};
