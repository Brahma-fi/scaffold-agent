import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { Request, Response } from "express";
import { ChatRequestBody } from "../entity";
import httpStatus from "http-status";
import { initializeAgent } from "../agent";
import { StreamingCallbackHandler } from "./callbacks";

const chatHistory: {
  [x: number]: Array<HumanMessage | AIMessage>;
} = {};

export const chatWithAgent = async (
  req: Request<{}, {}, ChatRequestBody>,
  res: Response
): Promise<any> => {
  const { userId, messageReq } = req.body;

  try {
    // Input validation
    if (typeof userId !== "number")
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ error: "invalid userId" });

    if (typeof messageReq !== "string")
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ error: "invalid messageReq" });

    // Get global agent
    const { agentExecutor } = await initializeAgent();

    // Initialize chat history for new users
    if (!chatHistory[userId]) {
      chatHistory[userId] = [];
    }

    // Create streaming callbacks
    const callbacks = [new StreamingCallbackHandler(res)];

    // Invoke agent with streaming
    const response = await agentExecutor.invoke(
      {
        input: messageReq,
        chat_history: chatHistory[userId]
      },
      { callbacks }
    );

    // Update chat history with complete response
    chatHistory[userId].push(new HumanMessage(messageReq));
    chatHistory[userId].push(new AIMessage(response.output));
    console.log("User chat history:", userId, chatHistory[userId]);

    return res.status(httpStatus.OK).json({
      data: {
        agentResponse: response.output,
        userId
      }
    });
  } catch (e) {
    console.error(e);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      error: "An error occurred"
    });
  }
};
