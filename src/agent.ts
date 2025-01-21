import * as dotenv from "dotenv";
dotenv.config();

import readline from "readline";

import { ChatOpenAI } from "@langchain/openai";
import {
  ChatPromptTemplate,
  MessagesPlaceholder
} from "@langchain/core/prompts";

import { HumanMessage, AIMessage } from "@langchain/core/messages";

import { createOpenAIFunctionsAgent, AgentExecutor } from "langchain/agents";

import { z } from "zod";
import { StructuredTool, tool } from "@langchain/core/tools";

const initializeAgent = async () => {
  // Instantiate the model
  const model = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.7
  });

  // Prompt Template
  const prompt = ChatPromptTemplate.fromMessages([
    "system",
    "You are a helpful assistant.",
    new MessagesPlaceholder("chat_history"),
    "human",
    "{input}",
    new MessagesPlaceholder("agent_scratchpad")
  ]);

  const adderSchema = z.object({
    a: z.number(),
    b: z.number()
  });
  const adderTool = tool(
    async (input): Promise<string> => {
      const sum = input.a + input.b;
      return `The sum of ${input.a} and ${input.b} is ${sum}`;
    },
    {
      name: "adder",
      description: "Adds two numbers together",
      schema: adderSchema
    }
  );

  await adderTool.invoke({ a: 1, b: 2 });

  const tools = [adderTool];

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

  // User Input
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return { agentExecutor, rl };
};

const chat_history: any[] = [];

const askQuestion = async () => {
  const { agentExecutor, rl } = await initializeAgent();

  rl.question("User: ", async (input) => {
    if (input.toLowerCase() === "exit") {
      rl.close();
      return;
    }

    const response = await agentExecutor.invoke({
      input: input,
      chat_history: chat_history
    });

    console.log("Agent: ", response.output);

    chat_history.push(new HumanMessage(input));
    chat_history.push(new AIMessage(response.output));

    askQuestion();
  });
};

(async () => await askQuestion())();
