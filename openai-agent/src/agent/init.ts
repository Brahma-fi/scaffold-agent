import OpenAI from "openai";
import { tools } from "../tools/definitions";
import { toolImplementations } from "../tools/implementations";
import { OpenAIConfig } from "../config";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

let openai: OpenAI | null = null;

export const initializeAgent = async () => {
  if (!openai) {
    openai = new OpenAI({
      apiKey: OpenAIConfig.apiKey,
    });
  }

  return {
    async processMessage(
      input: string,
      chatHistory: ChatCompletionMessageParam[] = []
    ) {
      const messages: ChatCompletionMessageParam[] = [
        {
          role: "system",
        content:
            "You are a helpful assistant that can perform various blockchain operations.",
        },
        ...chatHistory,
        { role: "user", content: input },
      ];

      const response = await openai!.chat.completions.create({
        model: OpenAIConfig.model,
        messages,
        tools,
        tool_choice: "auto",
      });

      const responseMessage = response.choices[0].message;

      if (responseMessage.tool_calls) {
        const toolResults = await Promise.all(
          responseMessage.tool_calls.map(async (toolCall) => {
            const functionName = toolCall.function.name;
            const functionArgs = JSON.parse(toolCall.function.arguments);

            if (functionName in toolImplementations) {
              const implementation =
                toolImplementations[
                  functionName as keyof typeof toolImplementations
                ];
              return await implementation(functionArgs);
            }
            return `Tool ${functionName} not found`;
          })
        );

        // Add tool results to the conversation
        messages.push(responseMessage);
        messages.push({
          role: "tool",
          content: toolResults.join("\n"),
          tool_call_id: responseMessage.tool_calls[0].id,
        });

        // Get a final response from the model
        const finalResponse = await openai!.chat.completions.create({
          model: OpenAIConfig.model,
          messages,
        });

        return {
          response: finalResponse.choices[0].message.content,
          toolResults,
        };
      }

      return {
        response: responseMessage.content,
        toolResults: [],
      };
    },
  };
};
