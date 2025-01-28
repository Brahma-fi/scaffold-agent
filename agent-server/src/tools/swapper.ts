import { tool } from "@langchain/core/tools";
import { Address, ConsoleKit } from "brahma-console-kit";
import { z } from "zod";
import { ConsoleKitConfig } from "../config";

const SLIPPAGE = 1;

const swapperSchema = z.object({
  chainId: z.number(),
  account: z.string(),
  tokenIn: z.string(),
  tokenOut: z.string(),
  inputTokenAmount: z.string()
});

const swapperTool = tool(
  async ({
    chainId,
    tokenIn,
    tokenOut,
    inputTokenAmount,
    account
  }): Promise<string> => {
    const accountAddress = account as Address;
    const consoleKit = new ConsoleKit(
      ConsoleKitConfig.apiKey,
      ConsoleKitConfig.baseUrl
    );

    try {
      const { data: swapRouteData } =
        await consoleKit.coreActions.getSwapRoutes(
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
          tokenOut: tokenOut as Address
        }
      );
      return `The following transactions must be executed to perform the requested swap-\n${JSON.stringify(
        data.transactions,
        null,
        2
      )}`;
    } catch (e) {
      console.error(e);
      return "an error occurred";
    }
  },
  {
    name: "swapper",
    description:
      "Generates calldata for swapping an ERC20 token into another ERC20 token",
    schema: swapperSchema
  }
);

export default swapperTool;
