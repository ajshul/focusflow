import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { UserProfile } from "../../models/types";

const llm = new ChatOpenAI({
  openAIApiKey: process.env.REACT_APP_OPENAI_API_KEY,
  modelName: "gpt-4o",
  temperature: 0.3,
});

export const draftEmail = async (
  subject: string,
  context: string,
  recipients: string,
  userProfile: UserProfile
) => {
  const emailPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are an email drafting assistant for someone with ADHD.

USER INFORMATION:
Name: {name}
Occupation: {occupation}
Communication Style: {communicationStyle}

TASK:
Draft an email that matches the user's communication style perfectly.
- Subject: {subject}
- Recipients: {recipients}
- Context: {context}

Guidelines:
1. Keep paragraphs short and scannable
2. Use bullet points for lists
3. Include a clear call-to-action
4. Format with Subject and Body sections
5. Match the user's typical tone and style
6. Be professional but authentic to the user's voice`,
    ],
  ]);

  const prompt = await emailPrompt.invoke({
    name: userProfile.name,
    occupation: userProfile.occupation,
    communicationStyle: userProfile.communicationStyle,
    subject,
    recipients,
    context,
  });

  const response = await llm.invoke(prompt);
  return response.content as string;
};
