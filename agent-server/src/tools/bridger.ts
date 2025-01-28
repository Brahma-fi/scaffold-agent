import { tool } from "@langchain/core/tools";
import { Address, ConsoleKit } from "brahma-templates-sdk";
import { z } from "zod";
import { ConsoleKitConfig } from "../config";

const SLIPPAGE = 1;

const bridgerSchema = z.object({
  chainIdIn: z.number(),
  chainIdOut: z.number(),
  account: z.string(),
  tokenIn: z.string(),
  tokenOut: z.string(),
  inputTokenAmount: z.string()
});

const bridgerTool = tool(
  async ({
    chainIdIn,
    chainIdOut,
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
      const [bridgeRoute] = await consoleKit.coreActions.fetchBridgingRoutes({
        amountIn: inputTokenAmount,
        amountOut: "0",
        chainIdIn,
        chainIdOut,
        ownerAddress: accountAddress,
        recipient: accountAddress,
        slippage: SLIPPAGE,
        tokenIn,
        tokenOut
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
          slippage: SLIPPAGE
        }
      );
      return `The following transactions must be executed to perform the requested bridging-\n${JSON.stringify(
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
    name: "bridger",
    description:
      "Generates calldata for bridging ERC20 tokens from one chain to another",
    schema: bridgerSchema
  }
);

export default bridgerTool;
