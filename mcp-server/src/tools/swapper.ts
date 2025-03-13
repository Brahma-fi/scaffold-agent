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
    const { data: swapRouteData } = await consoleKit.coreActions.getSwapRoutes(
      tokenIn as Address,
      tokenOut as Address,
      accountAddress,
      inputTokenAmount,
      `${SLIPPAGE}`,
      chainId
    );

    const [swapRoute] = (swapRouteData as any).data;

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
