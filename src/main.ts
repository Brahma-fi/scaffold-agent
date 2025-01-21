import readline from "readline";

import { HumanMessage, AIMessage } from "@langchain/core/messages";

import { AgentExecutor } from "langchain/agents";
import { initializeAgent } from "./agent";

const chat_history: any[] = [];

const askQuestion = async (
  agentExecutor: AgentExecutor,
  rl: readline.Interface
) => {
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

    askQuestion(agentExecutor, rl);
  });
};

(async () => {
  const { agentExecutor } = await initializeAgent();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  await askQuestion(agentExecutor, rl);
})();
