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
    'Propositional Logic and Set Theory',
    'The Real and Complex Number Systems',
    'Functions',
    'Analytic Geometry',
  ]) },
  Physics: { title: 'PHYSICS', themes: units([
    'Preliminaries',
    'Kinematics in One Dimension',
    'Kinematics in Two Dimensions',
    'Dynamics',
    'Gravitation and Kepler’s Laws of Motion',
    'Work and Energy',
    'Linear Momentum',
    'Fluid Mechanics',
    'Heat and Thermodynamics',
    'Oscillations and Waves',
    'Electromagnetism and Electronics',
    'Geometrical Optics',
    'Cross-Cutting Application of Physics',
  ]) },
  Psychology: { title: 'PSYCHOLOGY', themes: units([
    'Essence of Psychology',
    'Sensation and Perception',
    'Learning and Theories of Learning',
    'Memory and Forgetting',
    'Motivation and Emotions',
    'Personality',
    'Psychological Disorders and Treatment Techniques',
    'Introduction to Life Skills',
    'Intra-Personal and Interpersonal Skills',
    'Academic Skills',
    'Social Skills',
  ]) },
  Geography: { title: 'GEOGRAPHY', themes: units([
    'Introduction',
    'The Geology of Ethiopia and the Horn',
    'The Topography of Ethiopia and the Horn',
    'Drainage Systems and Water Resource of Ethiopia and the Horn',
    'The Climate of Ethiopia and the Horn',
    'Soils, Natural Vegetation and Wildlife Resources of Ethiopia and the Horn',
    'Population of Ethiopia and the Horn',
    'Economic Activities in Ethiopia',
  ]) },
  History: { title: 'HISTORY OF ETHIOPIA AND THE HORN', themes: units([
    'Unit One',
    'Unit Two',
    'Unit Three',
    'Unit Four',
    'Unit Five',
    'Unit Six',
    'Unit Seven',
  ]) },
  Logic: { title: 'LOGIC', themes: units([
    'Introducing Philosophy',
    'Arguments',
    'Language',
    'Critical Thinking',
    'Fallacies',
    'Categorical Logic',
  ]) },
  English: { title: 'ENGLISH', themes: units(['Study Skills', 'Health & Fitness', 'Cultural Values', 'Wild Animals', 'Population']) },
  'Physical Fitness': { title: 'PHYSICAL FITNESS', themes: units(['Fitness Concepts', 'Health Benefits', 'Nutrition', 'Exercise Prescription', 'Fitness Assessment']) },
};
