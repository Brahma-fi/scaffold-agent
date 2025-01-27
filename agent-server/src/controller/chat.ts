import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { Request, Response } from "express";
import { ChatRequestBody } from "../entity";
import httpStatus from "http-status";
import { initializeAgent } from "../agent";

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
    if (typeof userId !== "number")
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ error: "invalid userId" });
    if (typeof messageReq !== "string")
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ error: "invalid messageReq" });

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

    const response = await globalAgent.invoke({
      input: messageReq,
      chat_history: chatHistory[userId].history,
    });
    console.log("Agent res: ", response.output);

    chatHistory[userId].history.push(new HumanMessage(messageReq));
    chatHistory[userId].history.push(new AIMessage(response.output));
    console.log("User chat history:", userId, chatHistory);

    return res.status(httpStatus.OK).json({
      data: { agentResponse: response.output, userId },
    });
  } catch (e) {
    console.log(e);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: "an error occurred" });
  }
};
