import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { readFileSync } from "fs";
import { join } from "path";
import { tools } from "../tools";

let agentExecutorInstance: AgentExecutor | null = null;

function loadSystemPrompt(): string {
  // Read the markdown file
  const promptPath = join(__dirname, "prompt.md");
  const content = readFileSync(promptPath, "utf-8");

  return content;
}

export const initializeAgent = async () => {
  if (agentExecutorInstance) {
    return { agentExecutor: agentExecutorInstance };
  }

  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    streaming: true,
  });

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", loadSystemPrompt()],
    new MessagesPlaceholder("chat_history"),
    ["human", "{input}"],
    new MessagesPlaceholder("agent_scratchpad"),
  ]);

  const agent = await createOpenAIFunctionsAgent({
    llm,
    tools,
    prompt,
  });

  agentExecutorInstance = AgentExecutor.fromAgentAndTools({
    agent,
    tools,
  });

  return { agentExecutor: agentExecutorInstance };
};
