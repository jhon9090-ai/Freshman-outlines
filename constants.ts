
import { CurriculumData } from './types';

export const SUBJECT_CATEGORIES = [
  'Biology', 'Chemistry', 'Mathematics', 'Physics', 'SAT', 'English', 'History', 'Computer Science'
];

export const SUBJECT_ORDER = ['Mathematics', 'Biology', 'Physics', 'Chemistry', 'SAT', 'English'];

export const KANBAN_COLUMNS = {
  todo: {
    id: 'todo',
    title: 'To Study',
  },
  inProgress: {
    id: 'inProgress',
    title: 'Studying',
  },
  done: {
    id: 'done',
    title: 'Completed',
  },
};

export const KANBAN_COLUMNS_ORDER = ['todo', 'inProgress', 'done'];

export const curriculumData: CurriculumData = {
  "Biology": {
    "title": "Grade 9-12 Biology",
    "themes": [
      { "theme": "Introductory Biology", "units": [
        { "unit": "Biology and Technology", "grade": "G9" },
        { "unit": "Subfields of Biology", "grade": "G10" },
        { "unit": "Biology and Technology", "grade": "G11" },
        { "unit": "Application of Biology", "grade": "G12" }
      ]},
      { "theme": "Foundational Biology", "units": [
        { "unit": "Cell Biology", "grade": "G9" },
        { "unit": "Cell Reproduction", "grade": "G10 and G11" },
        { "unit": "Cell Respiration", "grade": "G9 and G12" },
        { "unit": "Biochemical Molecules", "grade": "G10" },
        { "unit": "Enzymes", "grade": "G11" }
      ]},
      { "theme": "Microorganisms", "units": [
        { "unit": "Micro-organisms and Diseases", "grade": "G9" },
        { "unit": "Micro-organisms", "grade": "G12" }
      ]},
      { "theme": "Human Biology", "units": [
        { "unit": "Human Biology and Health", "grade": "G10 and G9" },
        { "unit": "Human Musculoskeletal System", "grade": "G11" },
        { "unit": "Human Body System", "grade": "G12" }
      ]},
      { "theme": "Evolution and Genetics", "units": [
        { "unit": "Genetics", "grade": "G11" },
        { "unit": "Evolution", "grade": "G12" },
        { "unit": "Classification", "grade": "G9" }
      ]},
      { "theme": "Animals and Plants", "units": [
        { "unit": "Plants", "grade": "G10 and G12" },
        { "unit": "Animals", "grade": "G11" }
      ]},
      { "theme": "Ecology", "units": [
        { "unit": "Environment", "grade": "G9" },
        { "unit": "Ecological Interaction", "grade": "G10" },
        { "unit": "Population and Natural Resources", "grade": "G11" },
        { "unit": "Climate Change", "grade": "G12" }
      ]}
    ]
  },
  "Mathematics": {
    "title": "Grade 9-12 Mathematics",
    "themes": [
      { "theme": "Foundational Mathematics", "units": [
        { "unit": "The number system", "grade": "G9" },
        { "unit": "Solutions of equations", "grade": "G9" },
        { "unit": "Further on sets", "grade": "G9" }
      ]},
      { "theme": "Relations and Functions", "units": [
        { "unit": "Relation and function", "grade": "G9 and G10" },
        { "unit": "Relations and functions", "grade": "G11" },
        { "unit": "Polynomial functions", "grade": "G10" },
        { "unit": "Rational Expressions and functions", "grade": "G11" },
        { "unit": "Exponential and Log functions", "grade": "G10" },
        { "unit": "Trigonometric functions", "grade": "G10" }
      ]},
      { "theme": "Geometry and Measurement", "units": [
        { "unit": "Geometry and measurement", "grade": "G9" },
        { "unit": "Circles", "grade": "G10" },
        { "unit": "Solid figures", "grade": "G10" },
        { "unit": "Coordinate geometry", "grade": "G10" }
      ]},
      { "theme": "Linear Algebra", "units": [
        { "unit": "Vectors in two dimensions", "grade": "G9" },
        { "unit": "Vectors", "grade": "G11" },
        { "unit": "Matrix", "grade": "G11" },
        { "unit": "Determinants and their properties", "grade": "G11" },
        { "unit": "Transformation of the plane", "grade": "G11" }
      ]},
      { "theme": "Statistics and Probability", "units": [
        { "unit": "Statistics and probability", "grade": "G9" },
        { "unit": "Statistics", "grade": "G11 and G12" },
        { "unit": "Probability", "grade": "G11" }
      ]},
      { "theme": "Calculus I", "units": [
        { "unit": "Sequence and series", "grade": "G12" },
        { "unit": "Intro to Calculus", "grade": "G12" },
        { "unit": "Intro to linear programming", "grade": "G12" },
        { "unit": "Mathematical applications in business", "grade": "G12" }
      ]}
    ]
  },
  "Physics": {
    "title": "Grade 9-12 Physics",
    "themes": [
      { "theme": "Introductory Physics", "units": [
        { "unit": "Physics and Human Society", "grade": "G11" },
        { "unit": "Application of Physics", "grade": "G12" }
      ]},
      { "theme": "Vectors", "units": [
        { "unit": "Vectors", "grade": "G10 and G9" },
        { "unit": "Vectors Advanced", "grade": "G11" }
      ]},
      { "theme": "Kinematics", "units": [
        { "unit": "Motion in Straight Line", "grade": "G9" },
        { "unit": "Uniformly Accelerated Motion", "grade": "G10" },
        { "unit": "Motion in 1D and 2D", "grade": "G11" },
        { "unit": "2D Motion", "grade": "G12" }
      ]},
      { "theme": "Dynamics", "units": [
        { "unit": "Dynamics", "grade": "G9" },
        { "unit": "Elasticity and Plasticity of Rigid Bodies", "grade": "G10" },
        { "unit": "Dynamics Advanced", "grade": "G11" },
        { "unit": "Simple Machines", "grade": "G9" },
        { "unit": "Fluid Statics and Mechanics", "grade": "G9 and G12" }
      ]},
      { "theme": "Waves and Oscillations", "units": [
        { "unit": "Wave Motion and Sound", "grade": "G9" },
        { "unit": "Electromagnetic Waves and Geometrical Optics", "grade": "G10" }
      ]},
      { "theme": "Electricity and Magnetism", "units": [
        { "unit": "Static and Current Electricity", "grade": "G10" },
        { "unit": "Electrostatics and Electric Circuits", "grade": "G11" },
        { "unit": "Basics of Electronics", "grade": "G12" },
        { "unit": "Magnetism", "grade": "G10" },
        { "unit": "Electromagnetism", "grade": "G12" }
      ]},
      { "theme": "Thermodynamics and Nuclear Physics", "units": [
        { "unit": "Temperature and Heat", "grade": "G9" },
        { "unit": "Heat Conduction and Calorimetry", "grade": "G11" },
        { "unit": "Nuclear Physics", "grade": "G11" }
      ]}
    ]
  },
  "Chemistry": {
    "title": "Grade 9-12 Chemistry",
    "themes": [
      { "theme": "Foundational Chemistry", "units": [
        { "unit": "Structures of atoms", "grade": "G9" },
        { "unit": "Periodic classification", "grade": "G9" },
        { "unit": "Atomic structure and periodic properties", "grade": "G11" },
        { "unit": "Chemical bonding", "grade": "G9 and G11" },
        { "unit": "Physical states of matter", "grade": "G9 and G11" }
      ]},
      { "theme": "Chemical Reactions and solutions", "units": [
        { "unit": "Chemical Reactions and Stoichiometry", "grade": "G9 and G10" },
        { "unit": "Solutions", "grade": "G10" },
        { "unit": "Chemical kinetics", "grade": "G9 and G11" },
        { "unit": "Chemical equilibrium", "grade": "G9 and G11" }
      ]},
      { "theme": "Energy Changes and Electrochemistry", "units": [
        { "unit": "Energy changes and Electrochemistry", "grade": "G10 and G12" }
      ]},
      { "theme": "Inorganic Compounds", "units": [
        { "unit": "Importance of some inorganic compounds", "grade": "G10" },
        { "unit": "Acid-base equilibria", "grade": "G12" },
        { "unit": "Metals and non-metals", "grade": "G10" }
      ]},
      { "theme": "Organic Compounds", "units": [
        { "unit": "Hydrocarbons and their natural resources", "grade": "G10" },
        { "unit": "Some important oxygen-containing compounds", "grade": "G11" },
        { "unit": "Polymers", "grade": "G12" }
      ]},
      { "theme": "Environmental and Industrial Chemistry", "units": [
        { "unit": "Industrial Chemistry", "grade": "G12" },
        { "unit": "Environmental Chemistry", "grade": "G12" }
      ]}
    ]
  },
  "SAT": {
    "title": "Scholastic Aptitude Test (SAT)",
    "themes": [
      { "theme": "Grammar", "class": "Verbal Reasoning", "units": [
        { "unit": "Subject-verb agreement", "grade": "" },
        { "unit": "Verb tenses", "grade": "" },
        { "unit": "Pronoun-antecedent agreement", "grade": "" },
        { "unit": "Prepositions and idiomatic usages", "grade": "" },
        { "unit": "Parallel structuring and modifiers", "grade": "" },
        { "unit": "Articles and determiners", "grade": "" }
      ]},
      { "theme": "Vocabulary", "class": "Verbal Reasoning", "units": [
        { "unit": "Sentence structure", "grade": "" },
        { "unit": "Synonyms", "grade": "" },
        { "unit": "Antonyms", "grade": "" },
        { "unit": "Contextual vocabularies", "grade": "" },
        { "unit": "Word substitution", "grade": "" },
        { "unit": "Sentence completion", "grade": "" },
        { "unit": "Phrasal verbs", "grade": "" }
      ]},
      { "theme": "Reading Comprehension", "class": "Verbal Reasoning", "units": [
        { "unit": "Main idea and purpose analysis", "grade": "" },
        { "unit": "Detail retrieval and paraphrasing", "grade": "" },
        { "unit": "Inference and implied meaning", "grade": "" },
        { "unit": "In-context vocabularies", "grade": "" },
        { "unit": "Passage structure and organization", "grade": "" },
        { "unit": "Author's intent and tone", "grade": "" }
      ]},
      { "theme": "Logical and Analytical Reasoning", "class": "Verbal Reasoning", "units": [
        { "unit": "Deductive and inductive logics", "grade": "" },
        { "unit": "Puzzles and relationship mapping", "grade": "" },
        { "unit": "Analogies", "grade": "" },
        { "unit": "Classifications", "grade": "" }
      ]},
      { "theme": "Arithmetic Operations", "class": "Quantitative Reasoning", "units": [
        { "unit": "Fractions and decimals", "grade": "" },
        { "unit": "Ratio and proportions", "grade": "" },
        { "unit": "Number theory", "grade": "" },
        { "unit": "Exponents and Roots", "grade": "" },
        { "unit": "GCF and LCF", "grade": "" }
      ]},
      { "theme": "Algebra and Functions", "class": "Quantitative Reasoning", "units": [
        { "unit": "Linear equations and inequities", "grade": "" },
        { "unit": "Quadratic equations and polynomials", "grade": "" },
        { "unit": "Exponential and logarithmic functions", "grade": "" },
        { "unit": "Functions and graphs", "grade": "" }
      ]},
      { "theme": "Statistics and Data analysis", "class": "Quantitative Reasoning", "units": [
        { "unit": "Statistics", "grade": "" },
        { "unit": "Data interpretation and analysis", "grade": "" },
        { "unit": "Quantitative comparison", "grade": "" },
        { "unit": "Probability", "grade": "" },
        { "unit": "Permutations and combinations", "grade": "" }
      ]},
      { "theme": "Word problems and real word applications", "class": "Quantitative Reasoning", "units": [
        { "unit": "age problems", "grade": "" },
        { "unit": "Calendar problems", "grade": "" },
        { "unit": "Interest and profits", "grade": "" },
        { "unit": "Time, speed and distance", "grade": "" },
        { "unit": "Work-rate problem", "grade": "" },
        { "unit": "Aligations and mixtures", "grade": "" }
      ]},
      { "theme": "Geometry", "class": "Quantitative Reasoning", "units": [
        { "unit": "plane Geometry", "grade": "" },
        { "unit": "coordinate Geometry", "grade": "" },
        { "unit": "Solid Geometry", "grade": "" },
        { "unit": "Trigonometry", "grade": "" }
      ]},
      { "theme": "Advanced mathematics", "class": "Quantitative Reasoning", "units": [
        { "unit": "sequence and series", "grade": "" },
        { "unit": "Linear programming", "grade": "" }
      ]}
    ]
  },
  "English": {
    "title": "English",
    "themes": [
      { "theme": "Language Focus", "units": [
        { "unit": "Parts of speech", "grade": "" },
        { "unit": "Sentence strcture", "grade": "" },
        { "unit": "Tenses", "grade": "" },
        { "unit": "Subject-verb agreement", "grade": "" },
        { "unit": "Question formation", "grade": "" },
        { "unit": "Modal verbs", "grade": "" },
        { "unit": "conditionals", "grade": "" },
        { "unit": "active and passive voices", "grade": "" },
        { "unit": "direct and indirect speechs", "grade": "" },
        { "unit": "comparisons", "grade": "" },
        { "unit": "Gerunds and Infinitives", "grade": "" },
        { "unit": "articles and Determiners", "grade": "" },
        { "unit": "Relative clauses", "grade": "" },
        { "unit": "Adjectives and adverbal clauses", "grade": "" }
      ]},
      { "theme": "Comprehension", "units": [
        { "unit": "vocabulary comprehensions", "grade": "" },
        { "unit": "sentence comprehension", "grade": "" },
        { "unit": "Reading comprehensions", "grade": "" }
      ]},
      { "theme": "Communicative activties", "units": [
        { "unit": "Asking for and Giving Directions/Locations", "grade": "" },
        { "unit": "Asking for and Stating Opinions, Beliefs, and Ideas", "grade": "" },
        { "unit": "Seeking Clarification and Explanations", "grade": "" },
        { "unit": "Inquiring about Reasons and Causes", "grade": "" },
        { "unit": "Expressing Agreement and Disagreement", "grade": "" },
        { "unit": "Making Suggestions and Giving Advice", "grade": "" },
        { "unit": "Expressing Certainty and Doubt", "grade": "" },
        { "unit": "Offering and Requesting Assistance", "grade": "" },
        { "unit": "Expressing Sympathy, Apology, and Gratitude", "grade": "" }
      ]},
      { "theme": "Writing", "units": [
        { "unit": "Word spelling", "grade": "" },
        { "unit": "Punctuations and Capitalizations", "grade": "" },
        { "unit": "Jumbled words", "grade": "" },
        { "unit": "Paragraph coherence", "grade": "" },
        { "unit": "Letter Writing", "grade": "" }
      ]}
    ]
  }
};