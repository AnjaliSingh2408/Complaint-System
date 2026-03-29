import axios from "axios"
import { ApiError } from "../utils/ApiError.js";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const classifyComplaint = async (title, description) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const prompt = `
You are an AI system for a complaint management platform.

Classify the complaint into:
Category: (Water, Electricity, Road, Garbage, Other)
Priority: (Low, Medium, High)

Return ONLY JSON like:
{
  "category": "Water",
  "priority": "High"
}

Complaint:
Title: ${title}
Description: ${description}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // extract JSON safely
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    return {
      category: parsed?.category || "General",
      priority: parsed?.priority || "Medium"
    };

  } catch (error) {
    console.error("Gemini Error:", error.message);

    return {
      category: "General",
      priority: "Medium"
    };
  }
};

// export const classifyComplaint = async (title, description) => {

//   try{
//       const response = await axios.post(
//       process.env.AI_SERVICE_URL,
//       { title, description },
//       { timeout: 10000 }
//     )

//     const data = response.data;
//     if(!data || !data.category || !data.priority){
//       throw new ApiError(500,"Failed to classify complaint using AI!!")
//     }
//   } catch(error){
//     throw new ApiError(500,"Failed to classify complaint using AI!!")
//   }

//   return response.data
// }