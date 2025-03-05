import { z } from "zod";
import { Address, ConsoleKit } from "brahma-console-kit";
import { ConsoleKitConfig } from "../config";
import { Tool } from "../types";

const SLIPPAGE = 1;

const bridgerSchema = z.object({
  chainIdIn: z.number(),
  chainIdOut: z.number(),
  account: z.string(),
  tokenIn: z.string(),
  tokenOut: z.string(),
  inputTokenAmount: z.string(),
});

export type BridgerParams = z.infer<typeof bridgerSchema>;

export async function bridgerTool(params: BridgerParams): Promise<string> {
  const {
    chainIdIn,
    chainIdOut,
    tokenIn,
    tokenOut,
    inputTokenAmount,
    account,
  } = params;

  const accountAddress = account as Address;
  const consoleKit = new ConsoleKit(
    ConsoleKitConfig.apiKey,
    ConsoleKitConfig.baseUrl
  );

  try {
    const [bridgeRoute] = await consoleKit.coreActions.fetchBridgingRoutes({
      amountIn: inputTokenAmount,
      amountOut: "0",
      chainIdIn,
      chainIdOut,
      ownerAddress: accountAddress,
      recipient: accountAddress,
      slippage: SLIPPAGE,
      tokenIn,
      tokenOut,
    });

    const { data } = await consoleKit.coreActions.bridge(
      chainIdIn,
      accountAddress,
      {
        amountIn: inputTokenAmount,
        amountOut: "0",
        chainIdIn,
        chainIdOut,
        ownerAddress: accountAddress,
        recipient: accountAddress,
        route: bridgeRoute,
        tokenIn: tokenIn as Address,
        tokenOut: tokenOut as Address,
        slippage: SLIPPAGE,
      }
    );

    return `The following transactions must be executed to perform the requested bridging-\n${JSON.stringify(
      data.transactions,
      null,
      2
    )}`;
  } catch (e) {
    console.error(e);
    return "An error occurred while processing the bridging request";
  }
}

export const bridgerToolMetadata = {
  name: "bridger",
  description:
    "Generates calldata for bridging ERC20 tokens from one chain to another",
  parameters: bridgerSchema,
};

export const bridger: Tool = {
  name: "bridger",
  description: "Bridge tokens from one chain to another",
  schema: z.object({
    sourceChain: z.string().describe("The source chain to bridge from"),
    destinationChain: z.string().describe("The destination chain to bridge to"),
    token: z
      .string()
      .describe('The token address to bridge (use "native" for native tokens)'),
    amount: z.string().describe("The amount to bridge"),
    recipient: z
      .string()
      .optional()
      .describe("The recipient address (defaults to sender)"),
  }),
  execute: async ({
    sourceChainId,
    destinationChainId,
    token,
    amount,
    recipient,
  }: {
    sourceChainId: number;
    destinationChainId: number;
    token: string;
    amount: string;
    recipient?: string;
  }) => {
    try {
      // Convert chain strings to chainId numbers

      // Use the existing ConsoleKit implementation
      const consoleKit = new ConsoleKit(
        ConsoleKitConfig.apiKey,
        ConsoleKitConfig.baseUrl
      );

      // Get the wallet address (in a real implementation, this would be the user's wallet)
      const accountAddress = "0x..." as Address; // This should be replaced with actual wallet address

      // If recipient is not provided, use the account address
      const recipientAddress = recipient
        ? (recipient as Address)
        : accountAddress;

      try {
        const [bridgeRoute] = await consoleKit.coreActions.fetchBridgingRoutes({
          amountIn: amount,
          amountOut: "0",
          chainIdIn: sourceChainId,
          chainIdOut: destinationChainId,
          ownerAddress: accountAddress,
          recipient: recipientAddress,
          slippage: SLIPPAGE,
          tokenIn: token,
          tokenOut: token, // In a real implementation, this might be different
        });

        const { data } = await consoleKit.coreActions.bridge(
          sourceChainId,
          accountAddress,
          {
            amountIn: amount,
            amountOut: "0",
            chainIdIn: sourceChainId,
            chainIdOut: destinationChainId,
            ownerAddress: accountAddress,
            recipient: recipientAddress,
            route: bridgeRoute,
            tokenIn: token as Address,
            tokenOut: token as Address, // In a real implementation, this might be different
            slippage: SLIPPAGE,
          }
        );

        return {
          success: true,
          data: {
            transactions: data.transactions,
            sourceChain: sourceChainId,
            destinationChain: destinationChainId,
            token,
            amount,
            recipient: recipientAddress,
            estimatedTime: "10-30 minutes",
          },
        };
      } catch (e) {
        console.error(e);
        return {
          success: false,
          error: "An error occurred while processing the bridging request",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};
