import { z } from "zod";
import { Address, ConsoleKit } from "brahma-console-kit";
import { ConsoleKitConfig } from "../config";
import { Tool } from "../types";

const senderSchema = z.object({
  chainId: z.number(),
  receiverAddress: z.string(),
  transferAmount: z.string(),
  accountAddress: z.string(),
  tokenAddress: z.string(),
});

export type SenderParams = z.infer<typeof senderSchema>;

export async function senderTool(params: SenderParams): Promise<string> {
  const {
    chainId,
    receiverAddress,
    transferAmount,
    accountAddress,
    tokenAddress,
  } = params;

  const consoleKit = new ConsoleKit(
    ConsoleKitConfig.apiKey,
    ConsoleKitConfig.baseUrl
  );

  try {
    const { data } = await consoleKit.coreActions.send(
      chainId,
      accountAddress as Address,
      {
        amount: transferAmount,
        to: receiverAddress as Address,
        tokenAddress: tokenAddress as Address,
      }
    );

    return `The following transactions must be executed to perform the requested transfer-\n${JSON.stringify(
      data.transactions,
      null,
      2
    )}`;
  } catch (e) {
    console.error(e);
    return "An error occurred while processing the transfer request";
  }
}

export const senderToolMetadata = {
  name: "sender",
  description:
    "Generates calldata for transferring native or ERC20 tokens to a recipient",
  parameters: senderSchema,
};

export const sender: Tool = {
  name: "sender",
  description: "Send native tokens to a recipient",
  schema: z.object({
    chain: z.string().describe("The chain to send tokens on"),
    recipient: z.string().describe("The recipient address"),
    amount: z.string().describe("The amount to send for the transfer"),
    token: z.string().describe("The token address to send"),
    accountAddress: z.string().describe("The account address to send from"),
  }),
  execute: async ({
    chainId,
    recipient,
    amount,
    token,
    accountAddress,
  }: {
    chainId: number;
    recipient: string;
    amount: string;
    token: string;
    accountAddress: string;
  }) => {
    try {
      const consoleKit = new ConsoleKit(
        ConsoleKitConfig.apiKey,
        ConsoleKitConfig.baseUrl
      );

      const { data } = await consoleKit.coreActions.send(
        chainId,
        accountAddress,
        {
          amount: amount,
          to: recipient as Address,
          tokenAddress: token as Address,
        }
      );

      return {
        success: true,
        data: {
          transactions: data.transactions,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};
