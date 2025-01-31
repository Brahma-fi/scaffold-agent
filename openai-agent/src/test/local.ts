import { initializeAgent } from "../agent/init";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  const agent = await initializeAgent();
  let chatHistory: any[] = [];

  console.log("Agent initialized. Type 'exit' to quit.");

  const askQuestion = () => {
    rl.question("> ", async (input) => {
      if (input.toLowerCase() === "exit") {
        rl.close();
        return;
      }

      try {
        const result = await agent.processMessage(input, chatHistory);
        console.log("\nResponse:", result.response);

        if (result.toolResults.length > 0) {
          console.log("\nTool Results:");
          result.toolResults.forEach((toolResult: string, index: number) => {
            console.log(`\nTool ${index + 1}:`, toolResult);
          });
        }

        // Update chat history
        chatHistory.push({ role: "user", content: input });
        chatHistory.push({ role: "assistant", content: result.response });
      } catch (error) {
        console.error("Error:", error);
      }

      console.log("\n-------------------\n");
      askQuestion();
    });
  };

  askQuestion();
}

main().catch(console.error);
