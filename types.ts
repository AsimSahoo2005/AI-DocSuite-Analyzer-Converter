
export enum AppFeature {
  AiAnalyzer = 'AI_ANALYZER',
  FileConverter = 'FILE_CONVERTER',
}

export enum AnalysisType {
  Summarize = 'SUMMARIZE',
  Strategy = 'STRATEGY',
  Quiz = 'QUIZ',
}

export type ConversionMap = {
  [key: string]: {
    label: string;
    targetMime: string;
    disabled?: boolean;
    disabledReason?: string;
  }[];
};

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface Quiz {
  title: string;
  questions: QuizQuestion[];
}
