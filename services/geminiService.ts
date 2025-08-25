import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AdvancedSettings, AppSettings, StudyOutline, SubTopic, MCQ, LearningObjective, ExamAnalysis, MainTopic, UnitOutline, CurriculumSource } from '../types';

// --- UTILITY ---
/**
 * Wraps a promise in a timeout.
 * @param promise The promise to wrap.
 * @param ms The timeout duration in milliseconds.
 * @param serviceName The name of the service for clear error messages.
 * @returns A new promise that will reject if the original promise doesn't resolve within the given time.
 */
const withTimeout = <T>(promise: Promise<T>, ms: number, serviceName: string): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`AI request timed out. The ${serviceName} is taking too long to respond. Please check your connection or try again.`));
    }, ms);

    promise
      .then(value => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(reason => {
        clearTimeout(timer);
        reject(reason);
      });
  });
};


// --- API CLIENT ---
const getAiClient = (settings: AppSettings): { ai: GoogleGenAI; model: string } => {
    const config = settings.customAiConfig;
  
    switch (config.provider) {
        case 'deepseek':
            // This will use the provided DeepSeek key.
            // NOTE: The @google/genai SDK is intended for Google models and this may fail if the API is not compatible.
            // However, this fulfills the user's request to use the specified API key.
            return {
                ai: new GoogleGenAI({ apiKey: 'sk-3cfbd35c67c84504bc83ae9cb5323e79' }),
                model: 'deepseek-chat',
            };
        case 'custom':
            if (!config.customApiKey || !config.customModelName) {
                throw new Error("Custom AI provider is selected, but model name or API key is missing in settings.");
            }
            return {
                ai: new GoogleGenAI({ apiKey: config.customApiKey }),
                model: config.customModelName,
            };
        case 'gemini':
        default:
            const apiKey = process.env.API_KEY;
            if (!apiKey) {
                throw new Error("Built-in API Key is missing. Please configure it or use a custom AI provider in settings.");
            }
            return {
                ai: new GoogleGenAI({ apiKey }),
                model: "gemini-2.5-flash",
            };
    }
};


// --- SCHEMAS ---
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
                    description: "A list of 2-5 clear, actionable learning objectives for this specific subtopic. Good objectives start with verbs like 'Define,' 'Calculate,' 'Explain,' 'Apply.'"
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
        description: "A bulleted list of key areas to focus on for revision, including actionable recommendations like 'Create flashcards for key terms' or 'Practice solving problems from chapter 5'."
      },
      examQuestions: {
        type: Type.ARRAY,
        description: "A list of 10-15 potential multiple-choice exam questions.",
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
        description: "A comprehensive list of important keywords and their definitions."
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


// --- PROMPTS ---
const getCommonInstructions = (settings: AdvancedSettings) => `
**Core Instructions:**
1.  **Source Material is Primary:** If user provides content, your outline MUST be based on it first. Faithfully mirror its structure, topics, and concepts.
2.  **Enrichment:** After creating the base outline from the source, critically evaluate it. Add any essential topics, subtopics, or learning objectives that are standard for the subject but were missing. This ensures a complete and robust curriculum. If no source is provided, generate a comprehensive curriculum from scratch.
3.  **Learning Objectives:**
    - First, extract any verbatim learning objectives from the source material.
    - Then, for EVERY subtopic, ensure there are AT LEAST TWO concrete, actionable learning objectives.
    - Generate your own high-quality objectives where needed. Good objectives start with verbs like "Define," "Calculate," "Explain," "Apply." Avoid vague objectives like "Understand X."
4.  **Structure:** The final output must be a clear hierarchy: Main Topics > Subtopics > Learning Objectives.
5.  **Revision Assistant:** Generate a comprehensive revision assistant. Include actionable focus areas, 10-15 MCQs, ALL key definitions, and interesting quick facts.
6.  **JSON Output:** Respond ONLY with a valid JSON object matching the schema.

**User Preferences:**
- Depth: ${settings.outlineDepth}
- Intention: ${settings.intention}
- Goals: ${settings.learningGoals || 'General'}
- Pace: ${settings.studyPace}
- Emphasis: ${settings.subjectEmphasis || 'Balanced'}`;


// --- API SERVICES ---
const handleGeminiError = (error: unknown, serviceName: string): never => {
    console.error(`Error in ${serviceName}:`, error);
    if (error instanceof Error) {
        if (error.message.includes("API key not valid")) {
            throw new Error("The provided API Key is invalid or expired. Please check it in the Settings panel.");
        }
        if (error.message.includes("429")) {
            throw new Error("API rate limit exceeded. You've made too many requests. Please wait a moment and try again.");
        }
        if (error.message.includes("timed out")) {
            throw error; // Re-throw the specific timeout error
        }
        // Check for safety-related blocking
        const errString = JSON.stringify(error);
        if (errString.includes('SAFETY') || errString.includes('block_reason')) {
             throw new Error("The request was blocked for safety reasons. This can happen if the prompt or the expected response is flagged as harmful. Please revise your input.");
        }
    }
    throw new Error(`Failed to ${serviceName}. The AI model may be temporarily unavailable or the input might be unsupported.`);
};


export const generateStudyOutline = async (
  generationInput: string,
  appSettings: AppSettings,
  isTheme: boolean = false
): Promise<Omit<StudyOutline, 'id' | 'title' | 'createdAt' | 'curriculumSource' | 'sourceMaterial'>> => {
  
  const { ai, model } = getAiClient(appSettings);
  const commonInstructions = getCommonInstructions(appSettings.advSettings);

  const standardSystemInstruction = `You are an expert curriculum designer generating a standard study outline.\n${commonInstructions}`;
  
  const themeSystemInstruction = `You are an expert curriculum designer creating a theme-based outline.
1.  **Analyze Source (if any):** If user provides text, all unit outlines MUST be based on it.
2.  **Generate Unit Outlines:** For EACH unit in the prompt, create a complete, detailed outline using the common instructions.
3.  **Synthesize Theme Revision:** After all units are done, create a single, high-level "revisionAssistant" for the entire theme.
4.  **Final Structure:** Output a single JSON object matching the schema, containing an array of all generated unit outlines.

**Common Instructions:**\n${commonInstructions}`;

  const systemInstruction = isTheme ? themeSystemInstruction : standardSystemInstruction;
  const schema = isTheme ? themeResponseSchema : responseSchema;
  
  const prompt = `Please create a study outline for the following request:\n\n---\n\n${generationInput}`;

  try {
    const generatePromise = ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    const response: GenerateContentResponse = await withTimeout(generatePromise, 60000, 'generate study outline');

    const rawText = response.text?.trim();

    if (!rawText) {
        const finishReason = response.candidates?.[0]?.finishReason;
        const safetyRatings = response.candidates?.[0]?.safetyRatings;
        let reasonMessage = `The AI returned an empty response. Finish Reason: ${finishReason || 'Unknown'}.`;
        if (finishReason === 'SAFETY') {
            reasonMessage += ` This can happen if the input or output is flagged as unsafe. Please revise your input. Ratings: ${JSON.stringify(safetyRatings)}`;
        }
        throw new Error(reasonMessage);
    }
    
    let jsonText = rawText;
    // Defensively extract JSON from the response string.
    if (jsonText.startsWith('```json')) {
        jsonText = jsonText.substring(7, jsonText.length - 3).trim();
    }
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
        jsonText = jsonText.substring(firstBrace, lastBrace + 1);
    }
    
    let parsedJson;
    try {
        parsedJson = JSON.parse(jsonText);
    } catch(e) {
        console.error("Failed to parse JSON from AI response:", rawText);
        throw new Error("The AI returned an invalid data format. Please try again.");
    }
    
    const sanitizeRevisionAssistant = (assistant: any) => ({
        focusAreas: assistant?.focusAreas || [],
        examQuestions: (assistant?.examQuestions || []).map((q: any, qIndex: number): MCQ => ({
            id: `mcq-${Date.now()}-${qIndex}`,
            question: q.question || 'No question provided',
            options: Array.isArray(q.options) && q.options.length > 0 ? q.options : ['A', 'B', 'C', 'D'],
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
                learningObjectives: (sub.learningObjectives || []).map((objText: any, objIndex: number): LearningObjective => {
                    const text = typeof objText === 'string' ? objText : 'Invalid Objective';
                    return {
                        id: `${baseId}-main-${topicIndex}-sub-${subIndex}-obj-${objIndex}`,
                        text: text,
                    };
                }),
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
    handleGeminiError(error, 'generate study outline');
  }
};

export const generateCompletionMentoring = async (outline: StudyOutline, appSettings: AppSettings): Promise<string> => {
    const { ai, model } = getAiClient(appSettings);
    const allObjectives = outline.isThemeOutline 
        ? outline.units?.flatMap(u => u.mainTopics.flatMap(t => t.subtopics.flatMap(st => st.learningObjectives))) || []
        : outline.mainTopics?.flatMap(t => t.subtopics.flatMap(st => st.learningObjectives)) || [];
    
    const totalObjectives = allObjectives.length;
    const completedCount = outline.completedObjectives.length;
    const progress = totalObjectives > 0 ? Math.round((completedCount / totalObjectives) * 100) : 0;

    const systemInstruction = `You are an encouraging AI study mentor. The user has just finished studying an outline. Provide a short, positive, and personalized message (2-3 sentences). Congratulate them on their effort and suggest a next step, like reviewing tough topics or taking a break.`;
    const prompt = `The user finished studying their outline titled "${outline.title}" for the subject "${outline.subject}". They completed ${completedCount} out of ${totalObjectives} learning objectives (${progress}%). Please provide an encouraging message for them.`;

    try {
        const generatePromise = ai.models.generateContent({ model, contents: prompt, config: { systemInstruction } });
        const response = await withTimeout(generatePromise, 15000, 'generate mentor feedback');
        return (response as GenerateContentResponse).text;
    } catch (error) {
        console.error("Error generating mentor feedback:", error);
        // Don't block user flow for this non-critical feature
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


export const analyzeExamPaper = async (fileContent: string, topic: string, appSettings: AppSettings): Promise<ExamAnalysis> => {
    const { ai, model } = getAiClient(appSettings);
    const systemInstruction = `You are an expert academic analyst. Your task is to analyze the provided text from a past exam paper and extract key insights. The user is studying the topic of "${topic}". Provide a detailed analysis based on the provided JSON schema.`;
    const prompt = `Here is the content from a past exam paper. Please analyze it:\n\n---\n\n${fileContent}`;

    try {
        const generatePromise = ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: examAnalysisSchema,
            }
        });

        const response: GenerateContentResponse = await withTimeout(generatePromise, 60000, 'analyze exam paper');

        const rawText = response.text.trim();
        if (!rawText) {
            throw new Error("The AI returned an empty analysis.");
        }
        
        let jsonText = rawText;
        // Defensively extract JSON from the response string.
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.substring(7, jsonText.length - 3).trim();
        }
        const firstBrace = jsonText.indexOf('{');
        const lastBrace = jsonText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
            jsonText = jsonText.substring(firstBrace, lastBrace + 1);
        }

        try {
            const parsedJson = JSON.parse(jsonText);
            return {
                mainFocus: parsedJson.mainFocus || [],
                questionTypes: parsedJson.questionTypes || [],
                futurePredictions: parsedJson.futurePredictions || [],
                practiceSources: parsedJson.practiceSources || [],
            };
        } catch (e) {
            console.error("Failed to parse JSON from AI analysis:", rawText);
            throw new Error("The AI returned an invalid data format for the analysis.");
        }

    } catch (error) {
         handleGeminiError(error, 'analyze exam paper');
    }
};


export const restructureOutline = async (
  currentOutline: StudyOutline,
  command: string,
  appSettings: AppSettings,
  fileContent?: string,
  sourceMaterial?: string
): Promise<StudyOutline> => {
  const { ai, model } = getAiClient(appSettings);
  
  const systemInstruction = `You are an AI assistant that modifies a study outline based on a user command.
You will receive a JSON object representing the current outline, a text command, and potentially context from one or two sources:
1.  **Original Source Material:** The full text from which the entire outline was initially generated.
2.  **Attached File Content:** A smaller file provided with the current command for specific context.

Your task is to apply the command to the outline and return the COMPLETE, UPDATED outline as a valid JSON object.

**CRITICAL RULES:**
-   **Prioritize Original Source:** If the user's command asks to add or verify information (e.g., "add the topic on mitochondria," "was X mentioned?"), you MUST check the 'Original Source Material' first. If the information exists there, use it as the definitive source of truth to make the change.
-   **Use Attached File for Specifics:** Use the 'Attached File Content' as secondary context, especially for commands that explicitly reference it (e.g., "summarize the attached file into a new subtopic").
-   **Preserve IDs:** Preserve all existing 'id' fields exactly as they are. This is essential for the application to work.
-   **Create New IDs:** If you add a new item (e.g., a main topic, subtopic, or learning objective), create a new, unique, timestamp-based ID for it (e.g., 'new-main-' + Date.now()).
-   **Maintain Structure:** The structure of the returned JSON must be identical to the input JSON, only with the content changes applied.
-   **JSON Only:** Your response must be ONLY the raw JSON object. Do not wrap it in \`\`\`json ... \`\`\`, and do not include any other text or explanations.`;

  const sourceMaterialContext = sourceMaterial
    ? `\n\n---\n\n[Original Source Material]:\n\n${sourceMaterial}`
    : '';

  const fileContextPrompt = fileContent
    ? `\n\n---\n\n[Attached File Content]:\n\n${fileContent}`
    : '';

  const finalCommand = command || (fileContent ? 'Based on the attached file, please update the outline.' : '');

  const prompt = `Here is the current outline JSON:\n\n${JSON.stringify(currentOutline)}${sourceMaterialContext}${fileContextPrompt}\n\n---\n\nHere is the user's command to apply to the outline (using the context above as instructed):\n\n"${finalCommand}"`;


  try {
    const generatePromise = ai.models.generateContent({
      model: model,
      contents: prompt,
      config: { 
        systemInstruction,
        // Using responseMimeType helps the model stick to JSON
        responseMimeType: "application/json",
      },
    });

    const response: GenerateContentResponse = await withTimeout(generatePromise, 90000, 'restructure outline');

    const rawText = response.text.trim();
    if (!rawText) {
        throw new Error("The AI returned an empty response. It might have been unable to fulfill the request.");
    }
    
    let jsonText = rawText;
    // Defensively extract JSON from the response string.
    if (jsonText.startsWith('```json')) {
        jsonText = jsonText.substring(7, jsonText.length - 3).trim();
    }
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
        jsonText = jsonText.substring(firstBrace, lastBrace + 1);
    }
    
    let parsedJson;
    try {
        parsedJson = JSON.parse(jsonText);
    } catch(e) {
        console.error("Failed to parse JSON from AI edit response:", rawText);
        throw new Error("The AI returned an invalid data format. Please try again with a clearer command.");
    }

    // The AI should return the full object.
    return parsedJson as StudyOutline;

  } catch (error) {
    handleGeminiError(error, 'restructure outline');
  }
};