import { z } from "zod";
import { Address, ConsoleKit } from "brahma-console-kit";
import { ConsoleKitConfig } from "../config";

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
    const [swapRoute] = await consoleKit.coreActions.fetchSwapRoutes({
      amountIn: inputTokenAmount,
      amountOut: "0",
      chainId,
      ownerAddress: accountAddress,
      recipient: accountAddress,
      slippage: SLIPPAGE,
      tokenIn,
      tokenOut,
    });

    const { data } = await consoleKit.coreActions.swap(
      chainId,
      accountAddress,
      {
        amountIn: inputTokenAmount,
        amountOut: "0",
        chainId,
        ownerAddress: accountAddress,
        recipient: accountAddress,
        route: swapRoute,
        tokenIn: tokenIn as Address,
        tokenOut: tokenOut as Address,
        slippage: SLIPPAGE,
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
