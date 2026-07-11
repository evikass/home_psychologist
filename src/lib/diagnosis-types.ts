/**
 * Общие типы для всех режимов диагноза.
 * Вынесены из API route файлов, чтобы static export (GitHub Pages)
 * не ломался при удалении папки src/app/api.
 */

export type NeuroDiagnosis = {
  program: {
    name: string;
    description: string;
    source: string;
  };
  mips_level: {
    id: number;
    name: string;
    explanation: string;
  };
  recommended_state: {
    id: string;
    name: string;
    reason: string;
  };
  cycle: Array<{
    stage_id: string;
    stage_name: string;
    what_to_do: string;
  }>;
  techniques: Array<{
    id: string;
    name: string;
    why_now: string;
    steps: string[];
    expected_result: string;
  }>;
  integration_plan: {
    duration_days: number;
    daily_practice: string;
    checkpoints: string[];
  };
  summary: string;
};

export type TaleDiagnosis = {
  selected_tale: {
    id: string | null;
    type: string;
    title: string;
    source: string;
  };
  tale_text: string;
  diagnosis: {
    theme: string;
    connection: string;
    insight: string;
  };
  moral: string;
  reflection_questions: string[];
  practice: {
    title: string;
    steps: string[];
    duration: string;
  };
  summary: string;
};

export type CardDiagnosis = {
  selected_card: {
    id: string;
    title: string;
    image_description: string;
    symbolism: string;
  };
  analysis: {
    why_this_card: string;
    what_you_see: string;
    what_it_means: string;
  };
  reflection_questions: string[];
  practice: {
    title: string;
    steps: string[];
    duration: string;
  };
  summary: string;
};
