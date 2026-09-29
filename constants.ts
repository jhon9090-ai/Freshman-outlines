import { CurriculumData } from './types';

export const SUBJECT_CATEGORIES = [
  'Mathematics',
  'Physics',
  'Psychology',
  'Geography',
  'History',
  'Logic',
  'English',
  'Physical Fitness',
];

export const SUBJECT_ORDER = [...SUBJECT_CATEGORIES];
export const ADDITIONAL_SUBJECTS = ['English', 'Physical Fitness'];

export const KANBAN_COLUMNS = {
  todo: { id: 'todo', title: 'To Study' },
  inProgress: { id: 'inProgress', title: 'Studying' },
  done: { id: 'done', title: 'Completed' },
};

export const KANBAN_COLUMNS_ORDER = ['todo', 'inProgress', 'done'];

const units = (items: string[]) => [{
  theme: 'Units',
  units: items.map(unit => ({ unit, grade: '' })),
}];

export const curriculumData: CurriculumData = {
  Mathematics: { title: 'MATHEMATICS', themes: units(['Logic & Sets', 'Number Systems', 'Functions', 'Analytic Geometry']) },
  Physics: { title: 'PHYSICS', themes: units(['Measurement & Vectors', 'Kinematics', 'Dynamics', 'Gravitation', 'Energy & Momentum', 'Fluids', 'Thermodynamics', 'Waves', 'Electromagnetism', 'Optics', 'Applications']) },
  Psychology: { title: 'PSYCHOLOGY', themes: units(['Psychology', 'Sensation & Perception', 'Learning', 'Memory', 'Motivation & Emotion', 'Personality', 'Disorders', 'Life/Academic/Social Skills']) },
  Geography: { title: 'GEOGRAPHY', themes: units(['Introduction & Maps', 'Geology', 'Topography', 'Water', 'Climate', 'Soils/Vegetation/Wildlife', 'Population', 'Economy']) },
  History: { title: 'HISTORY', themes: units(['Historical Foundations', 'Peoples & Cultures', 'Ancient/Medieval States', '13th–16th C.', '16th–18th C.', '1800–1941', '1941–1995']) },
  Logic: { title: 'LOGIC', themes: units(['Philosophy', 'Arguments', 'Language', 'Critical Thinking', 'Fallacies', 'Categorical Logic']) },
  English: { title: 'ENGLISH', themes: units(['Study Skills', 'Health & Fitness', 'Cultural Values', 'Wild Animals', 'Population']) },
  'Physical Fitness': { title: 'PHYSICAL FITNESS', themes: units(['Fitness Concepts', 'Health Benefits', 'Nutrition', 'Exercise Prescription', 'Fitness Assessment']) },
};
