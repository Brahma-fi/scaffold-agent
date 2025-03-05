import { z } from "zod";
import { Address, ConsoleKit } from "brahma-console-kit";
import { ConsoleKitConfig } from "../config";
import { Tool } from "../types";

const SLIPPAGE = 1;

const swapperSchema = z.object({
  chainId: z.number(),
  account: z.string(),
  tokenIn: z.string(),
  tokenOut: z.string(),
  inputTokenAmount: z.string(),
});

export type SwapperParams = z.infer<typeof swapperSchema>;

export async function swapperTool(params: SwapperParams): Promise<string> {
  const { chainId, tokenIn, tokenOut, inputTokenAmount, account } = params;

  const accountAddress = account as Address;
  const consoleKit = new ConsoleKit(
    ConsoleKitConfig.apiKey,
    ConsoleKitConfig.baseUrl
  );

  try {
    const { data: swapRouteData } = await consoleKit.coreActions.getSwapRoutes(
      tokenIn as Address,
      tokenOut as Address,
      accountAddress,
      inputTokenAmount,
      `${SLIPPAGE}`,
      chainId
    );
    const [swapRoute] = swapRouteData;

    const { data } = await consoleKit.coreActions.swap(
      chainId,
      accountAddress,
      {
        amountIn: inputTokenAmount,
        chainId,
        route: swapRoute,
        slippage: SLIPPAGE,
        tokenIn: tokenIn as Address,
        tokenOut: tokenOut as Address,
      }
    );

    return `The following transactions must be executed to perform the requested swap-\n${JSON.stringify(
      data.transactions,
      null,
      2
    )}`;
  } catch (e) {
    console.error(e);
    return "An error occurred while processing the swap request";
  }
}

export const swapperToolMetadata = {
  name: "swapper",
  description: "Generates calldata for swapping tokens on a specific chain",
  parameters: swapperSchema,
};

// This is a simplified example - in a real implementation, you would integrate with a DEX
export const swapper: Tool = {
  name: "swapper",
  description: "Swap tokens on a decentralized exchange",
  schema: z.object({
    chain: z.string().describe("The chain to perform the swap on"),
    tokenIn: z.string().describe("The address of the token to swap from"),
    tokenOut: z.string().describe("The address of the token to swap to"),
    amountIn: z.string().describe("The amount of tokenIn to swap"),
    slippage: z
      .string()
      .optional()
      .describe("The maximum slippage percentage (default: 0.5)"),
  }),
  execute: async ({
    chainId,
    tokenIn,
    tokenOut,
    amountIn,
    slippage = 0.5,
  }: {
    chainId: number;
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    slippage: number;
  }) => {
    try {
      // Use the existing ConsoleKit implementation
      const consoleKit = new ConsoleKit(
        ConsoleKitConfig.apiKey,
        ConsoleKitConfig.baseUrl
      );

      // Get the wallet address (in a real implementation, this would be the user's wallet)
      const accountAddress = "0x..." as Address; // This should be replaced with actual wallet address

      const { data: swapRouteData } =
        await consoleKit.coreActions.getSwapRoutes(
          tokenIn as Address,
          tokenOut as Address,
          accountAddress,
          amountIn,
          `${slippage}`,
          chainId
        );
      const [swapRoute] = swapRouteData;

      const { data } = await consoleKit.coreActions.swap(
        chainId,
        accountAddress,
        {
          amountIn: amountIn,
          chainId,
          route: swapRoute,
          slippage: slippage,
          tokenIn: tokenIn as Address,
          tokenOut: tokenOut as Address,
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
