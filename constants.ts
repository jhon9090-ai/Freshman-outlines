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
  Mathematics: { title: 'MATHEMATICS', themes: units([
    'Chapter 1: Propositional Logic and Set Theory',
    'Chapter 2: The Real and Complex Number Systems',
    'Chapter 3: Functions',
    'Chapter 4: Analytic Geometry',
  ]) },
  Physics: { title: 'PHYSICS', themes: units([
    'Chapter 1: Preliminaries',
    'Chapter 2: Kinematics in One Dimension',
    'Chapter 3: Kinematics in Two Dimensions',
    'Chapter 4: Dynamics',
    'Chapter 5: Gravitation and Kepler’s Laws of Motion',
    'Chapter 6: Work and Energy',
    'Chapter 7: Linear Momentum',
    'Chapter 8: Fluid Mechanics',
    'Chapter 9: Heat and Thermodynamics',
    'Chapter 10: Oscillations and Waves',
    'Chapter 11: Electromagnetism and Electronics',
    'Chapter 12: Geometrical Optics',
    'Chapter 13: Cross-Cutting Application of Physics',
  ]) },
  Psychology: { title: 'PSYCHOLOGY', themes: units([
    'Chapter One: Essence of Psychology',
    'Chapter Two: Sensation and Perception',
    'Chapter Three: Learning and Theories of Learning',
    'Chapter Four: Memory and Forgetting',
    'Chapter Five: Motivation and Emotions',
    'Chapter Six: Personality',
    'Chapter Seven: Psychological Disorders and Treatment Techniques',
    'Chapter Eight: Introduction to Life Skills',
    'Chapter Nine: Intra-Personal and Interpersonal Skills',
    'Chapter Ten: Academic Skills',
    'Chapter Eleven: Social Skills',
  ]) },
  Geography: { title: 'GEOGRAPHY', themes: units([
    'Chapter One: Introduction',
    'Chapter Two: The Geology of Ethiopia and the Horn',
    'Chapter Three: The Topography of Ethiopia and the Horn',
    'Chapter Four: Drainage Systems and Water Resource of Ethiopia and the Horn',
    'Chapter Five: The Climate of Ethiopia and the Horn',
    'Chapter Six: Soils, Natural Vegetation and Wildlife Resources of Ethiopia and the Horn',
    'Chapter Seven: Population of Ethiopia and the Horn',
    'Chapter Eight: Economic Activities in Ethiopia',
  ]) },
  History: { title: 'HISTORY', themes: units(['Historical Foundations', 'Peoples & Cultures', 'Ancient/Medieval States', '13th–16th C.', '16th–18th C.', '1800–1941', '1941–1995']) },
  Logic: { title: 'LOGIC', themes: units([
    'Chapter One: Introducing Philosophy',
    'Chapter Two: Arguments',
    'Chapter Three: Language',
    'Chapter Four: Critical Thinking',
    'Chapter Five: Fallacies',
    'Chapter Six: Categorical Logic',
  ]) },
  English: { title: 'ENGLISH', themes: units(['Study Skills', 'Health & Fitness', 'Cultural Values', 'Wild Animals', 'Population']) },
  'Physical Fitness': { title: 'PHYSICAL FITNESS', themes: units(['Fitness Concepts', 'Health Benefits', 'Nutrition', 'Exercise Prescription', 'Fitness Assessment']) },
};
