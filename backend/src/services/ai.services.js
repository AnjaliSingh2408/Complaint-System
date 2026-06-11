import dotenv from "dotenv";
dotenv.config();

import { HfInference } from "@huggingface/inference";

const hf = new HfInference(
  process.env.HF_API_KEY
);

// Stable free model
const HF_MODEL =
  "meta-llama/Llama-3.1-8B-Instruct";

export const classifyComplaint =
  async (title, description) => {
    try {
      const prompt = `
You are an AI complaint classification system.

Classify the complaint.

Allowed Categories:
- Infrastructure
- Sanitation
- Water
- Electricity
- Other

Allowed Priorities:
- Low
- Medium
- High

IMPORTANT:
Return ONLY valid JSON.
No explanation.
No markdown.

Complaint Title:
${title}

Complaint Description:
${description}

Example Output:
{
  "category": "Water",
  "priority": "High"
}
Example Output:
{
  "category": "Water",
  "priority": "Medium"
}
Example Output:
{
  "category": "Water",
  "priority": "Low"
}
`;

      const response =
        await hf.chatCompletion({
          model: HF_MODEL,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 100
        });

      const text =
        response.choices?.[0]
          ?.message?.content || "";

      console.log(
        "HF Classification Response:",
        text
      );

      let parsed = null;

      try {
        const jsonMatch =
          text.match(/\{[\s\S]*\}/);

        parsed = jsonMatch
          ? JSON.parse(
              jsonMatch[0]
            )
          : null;
      } catch (parseError) {
        console.error(
          "JSON Parse Error:",
          parseError.message
        );
      }

      const categoryMap = {
        Garbage: "Sanitation",
        Road: "Infrastructure",
        General: "Other"
      };

      const allowedCategories =
        [
          "Infrastructure",
          "Sanitation",
          "Water",
          "Electricity",
          "Other"
        ];

      const category =
        categoryMap[
          parsed?.category
        ] || parsed?.category;

      return {
        category:
          allowedCategories.includes(
            category
          )
            ? category
            : "Other",

        priority:
          parsed?.priority ||
          "Medium"
      };

    } catch (error) {
      console.error(
        "HF Classification Error:"
      );

      console.dir(error, {
        depth: null,
        colors: true
      });

      return {
        category: "Other",
        priority: "Medium"
      };
    }
};

export const generateReportAI =
  async (complaint, messages) => {
    try {
      let chatTranscript =
        "No chat log available.";

      if (
        messages &&
        messages.length > 0
      ) {
        // limit size to avoid timeout
        chatTranscript =
          messages
            .slice(-10)
            .map((m) => {
              const senderName =
                m.senderId
                  ?.fullName ||
                "Unknown";

              const senderRole =
                m.senderId
                  ?.role || "user";

              return `[${senderName} (${senderRole})]:
${m.text}`;
            })
            .join("\n");
      }

      const prompt = `
You are an AI assistant for a municipal complaint system.

Generate a professional resolution report.

Complaint Details:
Title: ${complaint.title}
Description:
${complaint.description}

Category:
${complaint.category}

Priority:
${complaint.priority}

Citizen:
${complaint
  .submittedBy?.fullName || "N/A"}

Assigned Staff:
${complaint
  .assignedTo?.fullName || "N/A"}

Status:
${complaint.status}

Recent Chat Transcript:
${chatTranscript}

Generate ONLY these sections:

1. Issue Summary
2. Actions Taken
3. Resolution Summary
4. Suggested Future Prevention

Keep the report concise and professional.
`;

      console.log(
        "REPORT PROMPT LENGTH:",
        prompt.length
      );

      const response =
        await hf.chatCompletion({
          model: HF_MODEL,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 300
        });

      const report =
        response.choices?.[0]
          ?.message?.content;

      return (
        report ||
        "Report generation failed."
      );

    } catch (error) {
      console.error(
        "HF Report Error:"
      );

      console.dir(error, {
        depth: null,
        colors: true
      });

      return `AI Report Generation Failed.

1. Issue Summary
The complaint titled "${complaint.title}" was filed.

Description:
${complaint.description}

2. Actions Taken
No transcript analysis
could be completed.

3. Resolution Summary
Complaint status:
${complaint.status}

4. Suggested Future Prevention
Routine inspection and
preventive maintenance
are recommended.`;
    }
};