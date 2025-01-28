import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { Request, Response } from "express";
import { ChatRequestBody } from "../entity";
import httpStatus from "http-status";
import { initializeAgent } from "../agent";
import { StreamingCallbackHandler } from "./callbacks";

// Only store chat histories, not agent instances
const chatHistory: {
  [x: number]: {
    history: Array<HumanMessage | AIMessage>;
  };
} = {};

// Initialize the agent once
let globalAgent: Awaited<ReturnType<typeof initializeAgent>>["agentExecutor"];

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

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Initialize global agent if not exists
    if (!globalAgent) {
      const { agentExecutor } = await initializeAgent();
      globalAgent = agentExecutor;
    }

    // Initialize chat history for new users
    if (!chatHistory[userId]) {
      chatHistory[userId] = {
        history: [],
      };
    }

    let responseText = "";

    // Create streaming callbacks
    const callbacks = [new StreamingCallbackHandler(res)];

    // Invoke agent with streaming
    const response = await globalAgent.invoke(
      {
        input: messageReq,
        chat_history: chatHistory[userId].history,
      },
      { callbacks }
    );

    // Update chat history with complete response
    chatHistory[userId].history.push(new HumanMessage(messageReq));
    chatHistory[userId].history.push(new AIMessage(response.output));
    console.log("User chat history:", userId, chatHistory);

    // Send end message
    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (e) {
    console.error(e);
    res.write(`data: ${JSON.stringify({ error: "An error occurred" })}\n\n`);
    res.end();
  }
};
