

import { GoogleGenAI, Type } from "@google/genai";
import { AdvancedSettings, StudyOutline, SubTopic, MCQ, LearningObjective, ExamAnalysis, MainTopic, UnitOutline, CurriculumSource } from '../types';

const SETTINGS_STORAGE_KEY = 'app-settings';

const getAiClient = (): GoogleGenAI => {
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    const apiKey = savedSettings ? JSON.parse(savedSettings).apiKey : null;

    if (!apiKey) {
        throw new Error("API Key not found. Please set your Gemini API key in the settings panel.");
    }
    return new GoogleGenAI({ apiKey });
};

const mainTopicSchema = {
    type: Type.OBJECT,
    required: ["title", "subtopics"],
    properties: {
      title: { type: Type.STRING, description: "The concise title of the main topic." },
      subtopics: {
        type: Type.ARRAY,
        description: "A list of detailed subtopics. Each subtopic is a focused learning unit.",
        items: {
            type: Type.OBJECT,
            required: ["title", "learningObjectives"],
            properties: {
                title: { type: Type.STRING, description: "The title of this specific subtopic." },
                learningObjectives: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "A list of clear, actionable learning objectives for this specific subtopic."
                }
            }
        }
      }
    }
};

const revisionAssistantSchema = {
    type: Type.OBJECT,
    description: "A section to help with revision.",
    required: ["focusAreas", "examQuestions", "keyDefinitions", "quickFacts"],
    properties: {
      focusAreas: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "A bulleted list of key areas to focus on for revision."
      },
      examQuestions: {
        type: Type.ARRAY,
        description: "A list of 3-5 potential multiple-choice exam questions.",
        items: {
          type: Type.OBJECT,
          required: ["question", "options", "correctAnswerIndex", "explanation"],
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of exactly 4 string options for the answer." },
            correctAnswerIndex: { type: Type.INTEGER, description: "The 0-based index of the correct answer in the options array." },
            explanation: { type: Type.STRING, description: "A brief explanation of why the correct answer is right." }
          }
        }
      },
      keyDefinitions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          required: ["term", "definition"],
          properties: {
            term: { type: Type.STRING },
            definition: { type: Type.STRING }
          }
        },
        description: "A list of important keywords and their definitions."
      },
      quickFacts: {
          type: Type.ARRAY,
          description: "A list of interesting quick facts, each with a term/context and the fact itself.",
          items: {
              type: Type.OBJECT,
              required: ["term", "fact"],
              properties: {
                  term: { type: Type.STRING, description: "The concept or topic the fact is about." },
                  fact: { type: Type.STRING, description: "The interesting fact." }
              }
          }
      }
    }
};

const responseSchema = {
  type: Type.OBJECT,
  required: ["subject", "mainTopics", "revisionAssistant"],
  properties: {
    subject: {
      type: Type.STRING,
      description: "The primary subject of the material (e.g., Biology, Mathematics, Physics)."
    },
    mainTopics: {
      type: Type.ARRAY,
      description: "An array of the main topics. Each main topic must contain a list of more granular subtopics.",
      items: mainTopicSchema
    },
    revisionAssistant: revisionAssistantSchema
  }
};

const themeResponseSchema = {
    type: Type.OBJECT,
    required: ["subject", "themeTitle", "units", "revisionAssistant"],
    properties: {
        subject: { type: Type.STRING, description: "The primary subject of the material (e.g., Biology, Mathematics)." },
        themeTitle: { type: Type.STRING, description: "The title of the overall theme."},
        units: {
            type: Type.ARRAY,
            description: "An array of units within the theme. Each unit must have its own detailed breakdown of main topics and subtopics.",
            items: {
                type: Type.OBJECT,
                required: ["unitTitle", "mainTopics", "revisionAssistant"],
                properties: {
                    unitTitle: { type: Type.STRING, description: "The title of the unit (e.g., 'Cell Biology', 'Kinematics')." },
                    mainTopics: {
                        type: Type.ARRAY,
                        description: "An array of the main topics for this specific unit.",
                        items: mainTopicSchema
                    },
                    revisionAssistant: revisionAssistantSchema,
                }
            }
        },
        revisionAssistant: revisionAssistantSchema
    }
};

export const generateStudyOutline = async (
  generationInput: string,
  settings: AdvancedSettings,
  isTheme: boolean = false
): Promise<Omit<StudyOutline, 'id' | 'title' | 'createdAt' | 'curriculumSource'>> => {
  const model = "gemini-2.5-flash";

  const settingsText = `Here are the user's preferences:
- Outline Depth: ${settings.outlineDepth}
- Learning Goals: ${settings.learningGoals || 'Generate clear, achievable learning goals.'}
- Study Pace: ${settings.studyPace} (This should influence the granularity of topics)
- Subject Emphasis: ${settings.subjectEmphasis || 'Provide a balanced overview.'}`;

  const standardSystemInstruction = `You are an expert curriculum designer. Your task is to generate a highly structured study outline based on the user's request.
- If the user provides a detailed document, base the outline on that content.
- If the user provides just a topic name (e.g., "Linear Algebra"), generate a comprehensive curriculum for that topic from scratch.
- In ALL cases, you MUST supplement the outline with any essential subtopics that are crucial for a complete understanding, even if they are not in the provided text. Your goal is to create a complete and logical learning path.
- Break the content into high-level main topics. Crucially, each main topic must be further divided into granular, single-concept subtopics.
- Each subtopic must have its own specific learning objectives.
- Generate a 'Revision Assistant' section with focus areas, interactive multiple-choice questions, key definitions, and interesting quick facts.
- Adhere strictly to the provided JSON schema for your response.\n${settingsText}`;
  
  const themeSystemInstruction = `You are an expert curriculum designer. Your task is to generate a comprehensive, theme-based study outline based on the user's request, which specifies a theme and its constituent units. Follow these steps precisely:

1.  **Analyze User-Provided Content (If Any):** If the user has uploaded a file (its content will be in the prompt), this content is the highest priority. It may contain detailed information, specific examples, or a curated selection of topics related to the units. First, thoroughly analyze this document. The generated outline for each unit MUST reflect and incorporate the details from this document.

2.  **Generate Detailed Individual Unit Outlines:** For EACH unit listed in the user's prompt, you must generate a complete, standalone, and detailed study outline. Treat each unit as if it were the sole subject of the request. This means for every single unit, you must:
    - Create a full structure of "mainTopics".
    - Break down each "mainTopic" into granular, single-concept "subtopics".
    - Assign specific, actionable "learningObjectives" to each "subtopic".
    - Create a dedicated and comprehensive "revisionAssistant" (with focus areas, MCQs, definitions, and quick facts) specifically tailored to THAT unit's content.

3.  **Synthesize a Top-Level Theme Revision Assistant:** After creating the detailed breakdowns for all individual units, generate ONE final, top-level "revisionAssistant" for the entire theme. This should be a high-level summary that synthesizes the most critical concepts and connections from across all the units.

4.  **Final Structure:** Your final output MUST be a single JSON object that adheres strictly to the provided schema. It must contain an array of "units", where each object in the array is the complete, detailed outline you generated for that unit (including its own \`unitTitle\`, \`mainTopics\`, and \`revisionAssistant\`). The object also contains the single, top-level \`revisionAssistant\` for the whole theme. Do not add, omit, or change the list of units provided by the user.
${settingsText}`;

  const systemInstruction = isTheme ? themeSystemInstruction : standardSystemInstruction;
  const schema = isTheme ? themeResponseSchema : responseSchema;
  
  const prompt = `Please create a study outline for the following request:\n\n---\n\n${generationInput}`;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    const jsonText = response.text.trim();

    if (!jsonText) {
        const finishReason = response.candidates?.[0]?.finishReason;
        const safetyRatings = response.candidates?.[0]?.safetyRatings;
        let reasonMessage = `The AI returned an empty response. Finish Reason: ${finishReason || 'Unknown'}.`;
        if (finishReason === 'SAFETY') {
            reasonMessage += ` This can happen if the input or output is flagged as unsafe. Ratings: ${JSON.stringify(safetyRatings)}`;
        }
        throw new Error(reasonMessage);
    }
    
    let parsedJson;
    try {
        parsedJson = JSON.parse(jsonText);
    } catch(e) {
        console.error("Failed to parse JSON from AI response:", jsonText);
        throw new Error("The AI returned an invalid data format. Please try again.");
    }
    
    const sanitizeRevisionAssistant = (assistant: any) => ({
        focusAreas: assistant?.focusAreas || [],
        examQuestions: (assistant?.examQuestions || []).map((q: any, qIndex: number): MCQ => ({
            id: `mcq-${Date.now()}-${qIndex}`,
            question: q.question || 'No question provided',
            options: q.options && q.options.length === 4 ? q.options : ['A', 'B', 'C', 'D'],
            correctAnswerIndex: typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : 0,
            explanation: q.explanation || 'No explanation provided.'
        })),
        keyDefinitions: assistant?.keyDefinitions || [],
        quickFacts: assistant?.quickFacts || []
    });

    const sanitizeMainTopics = (topics: any[], baseId: string): MainTopic[] => {
        return (topics || []).map((topic: any, topicIndex: number): MainTopic => ({
            id: `${baseId}-main-${topicIndex}`,
            title: topic.title || 'Untitled Topic',
            subtopics: (topic.subtopics || []).map((sub: any, subIndex: number): SubTopic => ({
                id: `${baseId}-main-${topicIndex}-sub-${subIndex}`,
                title: sub.title || 'Untitled Subtopic',
                learningObjectives: (sub.learningObjectives || []).map((objText: any, objIndex: number): LearningObjective => ({
                    id: `${baseId}-main-${topicIndex}-sub-${subIndex}-obj-${objIndex}`,
                    text: typeof objText === 'string' ? objText : 'Invalid Objective',
                })),
            }))
        }));
    };

    if (isTheme) {
        if (!parsedJson.units || !Array.isArray(parsedJson.units)) {
            throw new Error("AI response for theme is missing the required 'units' array.");
        }
        return {
            isThemeOutline: true,
            subject: parsedJson.subject || 'General',
            units: (parsedJson.units || []).map((unit: any, unitIndex: number): UnitOutline => ({
                id: `unit-${Date.now()}-${unitIndex}`,
                unitTitle: unit.unitTitle || 'Untitled Unit',
                mainTopics: sanitizeMainTopics(unit.mainTopics, `unit-${Date.now()}-${unitIndex}`),
                revisionAssistant: sanitizeRevisionAssistant(unit.revisionAssistant),
            })),
            revisionAssistant: sanitizeRevisionAssistant(parsedJson.revisionAssistant),
            completedObjectives: [],
        };
    } else {
        if (!parsedJson.mainTopics || !Array.isArray(parsedJson.mainTopics)) {
            throw new Error("AI response is missing the required 'mainTopics' array.");
        }
        return {
            isThemeOutline: false,
            subject: parsedJson.subject || 'General',
            mainTopics: sanitizeMainTopics(parsedJson.mainTopics, `outline-${Date.now()}`),
            revisionAssistant: sanitizeRevisionAssistant(parsedJson.revisionAssistant),
            completedObjectives: [],
        };
    }

  } catch (error) {
    console.error("Error generating content from Gemini:", error);
    if (error instanceof Error) {
        if (error.message.includes("API Key not found")) {
            throw error;
        }
        if (error.message.includes("API key not valid")) {
            throw new Error("Your API Key appears to be invalid. Please check it in the settings panel.");
        }
        if (error.message.includes("429")) {
            throw new Error("API rate limit exceeded. Please wait and try again.");
        }
    }
    throw new Error("Failed to generate study outline. The AI model may be unavailable, your API key could be invalid, or the input is unsupported.");
  }
};

export const generateCompletionMentoring = async (outline: StudyOutline): Promise<string> => {
    const model = "gemini-2.5-flash";
    const allObjectives = outline.isThemeOutline 
        ? outline.units?.flatMap(u => u.mainTopics.flatMap(t => t.subtopics.flatMap(st => st.learningObjectives))) || []
        : outline.mainTopics?.flatMap(t => t.subtopics.flatMap(st => st.learningObjectives)) || [];
    
    const totalObjectives = allObjectives.length;
    const completedCount = outline.completedObjectives.length;
    const progress = totalObjectives > 0 ? Math.round((completedCount / totalObjectives) * 100) : 0;

    const systemInstruction = `You are an encouraging AI study mentor. The user has just finished studying an outline. Provide a short, positive, and personalized message (2-3 sentences). Congratulate them on their effort and suggest a next step, like reviewing tough topics or taking a break.`;
    const prompt = `The user finished studying their outline titled "${outline.title}" for the subject "${outline.subject}". They completed ${completedCount} out of ${totalObjectives} learning objectives (${progress}%). Please provide an encouraging message for them.`;

    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({ model, contents: prompt, config: { systemInstruction } });
        return response.text;
    } catch (error) {
        console.error("Error generating mentor feedback:", error);
        // Don't block user flow for this non-critical feature
        if (error instanceof Error && error.message.includes("API Key")) {
            return "Congratulations on completing your study session!";
        }
        return "Great job completing your study session! Keep up the fantastic work.";
    }
};

const examAnalysisSchema = {
    type: Type.OBJECT,
    required: ["mainFocus", "questionTypes", "futurePredictions", "practiceSources"],
    properties: {
        mainFocus: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of the main topics or concepts the exam focuses on." },
        questionTypes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list describing the common types of questions (e.g., 'Multiple-choice definition questions', 'Problem-solving questions requiring formula application')." },
        futurePredictions: { type: Type.ARRAY, items: { type: 'STRING' }, description: "A list of predictions on how future questions might be structured or what topics might be combined." },
        practiceSources: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of recommended sources for practice questions, such as textbook chapters, specific websites, or problem sets." }
    }
};


export const analyzeExamPaper = async (fileContent: string, topic: string): Promise<ExamAnalysis> => {
    const model = "gemini-2.5-flash";
    const systemInstruction = `You are an expert academic analyst. Your task is to analyze the provided text from a past exam paper and extract key insights. The user is studying the topic of "${topic}". Provide a detailed analysis based on the provided JSON schema.`;
    const prompt = `Here is the content from a past exam paper. Please analyze it:\n\n---\n\n${fileContent}`;

    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: examAnalysisSchema,
            }
        });

        const jsonText = response.text.trim();
        if (!jsonText) {
            throw new Error("The AI returned an empty analysis.");
        }

        const parsedJson = JSON.parse(jsonText);
        return {
            mainFocus: parsedJson.mainFocus || [],
            questionTypes: parsedJson.questionTypes || [],
            futurePredictions: parsedJson.futurePredictions || [],
            practiceSources: parsedJson.practiceSources || [],
        };

    } catch (error) {
        console.error("Error analyzing exam paper:", error);
        if (error instanceof Error) {
            if (error.message.includes("API Key not found")) {
                throw error;
            }
            if (error.message.includes("API key not valid")) {
                throw new Error("Your API Key appears to be invalid. Please check it in the settings panel.");
            }
        }
        throw new Error("Failed to analyze the exam paper. The model may be unavailable or the content is invalid.");
    }
};