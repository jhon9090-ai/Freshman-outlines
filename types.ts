style.ts
export interface LearningObjective {
  id: string;
  text: string;
}

export interface ItemPath {

  unitId?: string;

  mainTopicId?: string;

  subtopicId?: string;

  objectiveId?: string;

}
export interface SubTopic {
  id:string;
  title: string;
  learningObjectives: LearningObjective[];
}

export interface MainTopic {
  id: string;
  title: string;
  subtopics: SubTopic[];
  studyDuration?: number; // in minutes
}

// New type for a unit inside a theme-based outline
export interface UnitOutline {
  id: string;
  unitTitle: string;
  mainTopics: MainTopic[];
  revisionAssistant?: RevisionAssistant;
}

export interface CurriculumSource {
  subjectKey: string;
  theme: string;
  unit: string;
}

export interface StudyOutline {
  id: string;
  title: string; // Will be Theme title for theme outlines
  subject: string;
  createdAt: string;
  
  isThemeOutline?: boolean;
  mainTopics?: MainTopic[]; // For standard outlines
  units?: UnitOutline[]; // For theme outlines
  curriculumSource?: CurriculumSource; // Link to curriculum
  sourceMaterial?: string; // The original material used for generation

  revisionAssistant: RevisionAssistant;
  completedObjectives: string[];
}

export type PartialStudyOutline = Partial<Omit<StudyOutline, 'id' | 'createdAt'>>;

export interface MCQ {
    id: string;
    question: string;
    options: string[];
    correctAnswerIndex: number; // 0-based index
    explanation: string;
}

export interface RevisionAssistant {
  focusAreas: string[];
  examQuestions: MCQ[];
  keyDefinitions: { term: string; definition: string; }[];
  quickFacts: { term: string; fact: string; }[];
}

export interface AdvancedSettings {
  outlineDepth: 'Concise' | 'Standard' | 'Detailed';
  learningGoals: string;
  studyPace: 'Casual' | 'Moderate' | 'Intensive';
  subjectEmphasis: string;
  intention: 'Default' | 'Exam Prep' | 'Revision' | 'Knowledge Expansion';
}

export interface KanbanColumnData {
  id: string;
  title: string;
  topicIds: string[];
}

export interface KanbanState {
  [key: string]: KanbanColumnData;
}

export interface ExamAnalysis {
  mainFocus: string[];
  questionTypes: string[];
  futurePredictions: string[];
  practiceSources: string[];
}

export type AppStatus = 'idle' | 'loading' | 'success' | 'error';
export type AppView = 'create' | 'curriculum' | 'outlines' | 'study' | 'tracker';

export type RevisionSection = 'focus' | 'questions' | 'definitions' | 'quick-facts';

// Types for Curriculum Data
export interface CurriculumUnit {
  unit: string;
  grade: string;
}

export interface CurriculumTheme {
  theme: string;
  class?: string; // For SAT structure
  units: CurriculumUnit[];
}

export interface CurriculumSubject {
  title: string;
  themes: CurriculumTheme[];
}

export interface CurriculumData {
  [key: string]: CurriculumSubject;
}

export interface AppSettings {
  advSettings: AdvancedSettings;
  customAiConfig: {
    provider: 'gemini' | 'deepseek' | 'custom';
    customModelName: string;
    customApiKey: string;
  };
  notionApiKey: string;
  notionExportFormat: 'Normal' | 'Kanban' | 'Database';
  customAlarmSound?: string; // Base64 data URI of the sound file
  customAlarmSoundName?: string; // The name of the sound file
}

}



export interface DailyHabitLog {

  date: string;

  tasksCompleted: number;

  tasksTotal: number;

  procrastinationLogged: boolean;

  performanceScore: number;

  aiInsight: string;

}

}



export interface PastExamResult {

  id: string;

  subject: string;

  yearEC: number; // Ethiopian Calendar

  score: number; // out of 100

  dateLogged: string;

}



export interface UnitCompletionLog {

  unitId: string;

  subject: string;

  startTime: string;

  finishTime: string;

  totalTimeSpentMinutes: number;

}


export interface ChatMessage {

    role: 'user' | 'model';

    text: string;

}



export interface DailyTaskDetail {

  task: string;

  rationale: string;

  impact: string;

}




export interface TeachedMaterial {

  name: string;

  content: string;

  dateAdded: string;

}



export interface TrackerState {

  habitHistory: DailyHabitLog[];

  examResults: PastExamResult[];

  completionLogs: UnitCompletionLog[];

  teachedMaterials: TeachedMaterial[];

  currentStreak: number;


  lastUpdated: string;

  lastDirectives?: string[]; 

  chatHistory: ChatMessage[];

  cachedAnalysis?: TrackerAIAnalysis & { cacheDate: string };


  isSchoolDay: boolean;

}

export interface TrackerAIAnalysis {


  dailyTasks: DailyTaskDetail[];

  prediction: string;


  growthCatalyst: string; 

  encouragement: string;


  masteryPercentage: number;

  status: 'on-track' | 'at-risk' | 'behind';


  pathDeviation: string; 

  directivesFollowed: boolean;

  isHoliday?: boolean;

}
