import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { Request, Response } from "express";
import { ChatRequestBody } from "../entity";
import httpStatus from "http-status";
import { initializeAgent } from "../agent";
import { AgentExecutor } from "langchain/agents";

const chatHistory: {
  [x: number]: {
    agent: AgentExecutor;
    history: Array<HumanMessage | AIMessage>;
  };
} = {};

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

    if (!chatHistory[userId]) {
      const { agentExecutor } = await initializeAgent();
      chatHistory[userId] = {
        agent: agentExecutor,
        history: []
      };
    }

    const response = await chatHistory[userId].agent.invoke({
      input: messageReq,
      chat_history: chatHistory[userId].history
    });
    console.log("Agent res: ", response.output);

    chatHistory[userId].history.push(new HumanMessage(messageReq));
    chatHistory[userId].history.push(new AIMessage(response.output));
    console.log("User chat history:", userId, chatHistory);

    return res.status(httpStatus.OK).json({
      data: { agentResponse: response.output, userId }
    });
  } catch (e) {
    console.log(e);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: "an error occurred" });
  }
};
