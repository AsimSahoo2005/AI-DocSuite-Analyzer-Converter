
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisType, Quiz } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getPromptAndConfig = (content: string, type: AnalysisType) => {
  const truncatedContent = content.length > 100000 ? content.substring(0, 100000) : content;

  switch (type) {
    case AnalysisType.Summarize:
      return {
        prompt: `Summarize the following document concisely. Use Markdown for formatting, including bullet points for key takeaways and bold text for important terms. Structure the summary with a main title and sections if applicable.\n\nDocument:\n"""\n${truncatedContent}\n"""`,
        config: {}
      };
    case AnalysisType.Strategy:
      return {
        prompt: `Based on the following document, create a detailed 4-week actionable strategy. Format the output using Markdown. Use a main heading for the strategy. For each week, use a sub-heading (e.g., "## Week 1: Foundation") and then use bulleted or numbered lists for goals, tasks, and milestones. Use bold text to emphasize key actions.\n\nDocument:\n"""\n${truncatedContent}\n"""`,
        config: {}
      };
    case AnalysisType.Quiz:
        const quizSchema = {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "A creative title for the quiz based on the document content." },
                questions: {
                    type: Type.ARRAY,
                    description: "An array of quiz questions.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            question: { type: Type.STRING, description: "The quiz question." },
                            options: {
                                type: Type.ARRAY,
                                description: "An array of 4 possible answers (strings). One of them must be the correct answer.",
                                items: { type: Type.STRING }
                            },
                            correctAnswer: { type: Type.STRING, description: "The correct answer, which must exactly match one of the strings in the 'options' array." }
                        },
                        required: ["question", "options", "correctAnswer"]
                    }
                }
            },
            required: ["title", "questions"]
        };
      return {
        prompt: `Generate a multiple-choice quiz with at least 5 questions based on the key information in the following document. For each question, provide 4 options and clearly indicate the correct answer. The questions should test understanding of the main concepts.\n\nDocument:\n"""\n${truncatedContent}\n"""`,
        config: {
          responseMimeType: "application/json",
          responseSchema: quizSchema,
        }
      };
    default:
      throw new Error("Invalid analysis type");
  }
};

export const analyzeDocument = async (content: string, type: AnalysisType): Promise<string | Quiz> => {
  const { prompt, config } = getPromptAndConfig(content, type);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: config,
    });
    
    const textResponse = response.text.trim();
    
    if (type === AnalysisType.Quiz) {
        try {
            // The response should be a JSON string, parse it.
            return JSON.parse(textResponse) as Quiz;
        } catch (e) {
            console.error("Failed to parse quiz JSON:", textResponse);
            throw new Error("The AI returned an invalid format for the quiz. Please try again.");
        }
    }

    return textResponse;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get a response from the AI. The content might be too complex or there could be an issue with the service.");
  }
};