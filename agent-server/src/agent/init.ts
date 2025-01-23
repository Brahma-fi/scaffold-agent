import {
  ChatPromptTemplate,
  MessagesPlaceholder
} from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";

import { tools } from "../tools";

export const initializeAgent = async () => {
  // Instantiate the model
  const model = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.7
  });

  // Prompt Template
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a helpful assistant."],
    new MessagesPlaceholder("chat_history"),
    ["human", "{input}"],
    new MessagesPlaceholder("agent_scratchpad")
  ]);

  const agent = await createOpenAIFunctionsAgent({
    llm: model,
    prompt,
    tools
  });

  // Create the executor
  const agentExecutor = new AgentExecutor({
    agent,
    tools
  });

  return { agentExecutor };
};
