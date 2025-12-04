import { GoogleGenAI, Type, Schema } from "@google/genai";
import { QuestionType, Survey } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Survey Generation ---

const surveySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A creative, engaging title for the survey." },
    description: { type: Type.STRING, description: "A brief, welcoming description of what the survey is about." },
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "The question text. For Matrix, this is the main prompt (e.g. 'Rate the following aspects')." },
          type: { 
            type: Type.STRING, 
            enum: [
              QuestionType.MultipleChoice, 
              QuestionType.Scale, 
              QuestionType.ShortText, 
              QuestionType.LongText,
              QuestionType.YesNo,
              QuestionType.Matrix
            ] 
          },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Options for MultipleChoice, or the Column headers for a Matrix (e.g., Satisfied, Neutral, Dissatisfied)."
          },
          rows: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Only for Matrix type. The rows/items to be rated using the options."
          },
          minLabel: { type: Type.STRING, description: "Label for the lowest value in a scale (e.g., 'Strongly Disagree')." },
          maxLabel: { type: Type.STRING, description: "Label for the highest value in a scale (e.g., 'Strongly Agree')." }
        },
        required: ["text", "type"]
      }
    }
  },
  required: ["title", "description", "questions"]
};

export const generateSurveyFromGoal = async (goal: string): Promise<Survey> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a comprehensive survey based on this research goal: "${goal}". 
      Ensure the questions are unbiased, clear, and follow best practices for survey design.
      
      - Use "MATRIX" type when grouping similar questions with the same answer options.
      - Use "SCALE" for linear ratings (1-5).
      - Use "MULTIPLE_CHOICE" for selecting from a list.
      
      Mix qualitative (text) and quantitative (scale/choice/matrix) questions appropriately.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: surveySchema,
        systemInstruction: "You are an expert survey methodologist named Delphi."
      }
    });

    const data = JSON.parse(response.text || "{}");
    
    // Add IDs to questions since the LLM might not generate unique IDs reliably
    const questionsWithIds = data.questions.map((q: any) => ({
      ...q,
      id: crypto.randomUUID()
    }));

    return {
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description,
      questions: questionsWithIds
    };
  } catch (error) {
    console.error("Error generating survey:", error);
    throw new Error("Failed to generate survey. Please try a different prompt.");
  }
};

// --- Interviewer Chat Logic ---

export const createInterviewSession = (survey: Survey) => {
  const systemPrompt = `
    You are Delphi, an intelligent and empathetic interviewer. 
    Your goal is to conduct this survey: "${survey.title}"
    Description: "${survey.description}"

    Here are the specific questions you need to get answers for:
    ${JSON.stringify(survey.questions.map(q => ({
      id: q.id,
      text: q.text,
      type: q.type,
      options: q.options,
      rows: q.rows
    })), null, 2)}

    RULES:
    1. Ask questions one by one.
    2. CRITICAL: When you ask a question from the survey, you MUST append "[[QID:${survey.questions[0].id}]]" (replace ID with actual question ID) at the very end of your message.
    3. This tag [[QID:...]] tells the interface to show the user the buttons, sliders, or matrix grid to answer.
    4. For ShortText or LongText questions, still append the tag so the UI knows which question is active.
    5. Maintain a conversational tone. Acknowledge answers briefly before asking the next one.
    6. If the user answers via the UI, their message will come back as the selected value.
    7. When all questions are answered, thank the user and type "[[END_OF_SURVEY]]".
  `;

  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemPrompt,
    }
  });
};