import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { Request, Response } from "express";
import { ChatRequestBody } from "../entity";
import httpStatus from "http-status";

const chatHistory: { [x: number]: Array<HumanMessage | AIMessage> } = {};

export const chatWithAgent = (
  req: Request<{}, {}, ChatRequestBody>,
  res: Response
): any => {
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

    chatHistory[userId] = [
      messageReq as any,
      ...(!chatHistory[userId]?.length ? [] : chatHistory[userId])
    ];

    return res.status(httpStatus.OK).json({
      data: { chatHistory: chatHistory[userId], userId }
    });
  } catch (e) {
    console.log(e);
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: "an error occurred" });
  }
};

// export const chatWithAgent = (req: Request, res: Response) => {
//   res.send("Express + TypeScript Server");
// };
