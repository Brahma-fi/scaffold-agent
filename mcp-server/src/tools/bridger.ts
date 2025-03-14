import { z } from "zod";
import { Address, ConsoleKit } from "brahma-console-kit";
import { ConsoleKitConfig } from "../config";
import { sendSafeTransaction } from "../utils";

const SLIPPAGE = 1;

const bridgerSchema = z.object({
  chainIdIn: z.number(),
  chainIdOut: z.number(),
  account: z.string(),
  tokenIn: z.string(),
  tokenOut: z.string(),
  inputTokenAmount: z.string()
});

export type BridgerParams = z.infer<typeof bridgerSchema>;

export async function bridgerTool(params: BridgerParams): Promise<string> {
  const {
    chainIdIn,
    chainIdOut,
    tokenIn,
    tokenOut,
    inputTokenAmount,
    account
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

    const txHash = await sendSafeTransaction(consoleKit, data.transactions);

    return `The transaction for your configured console is executed: ${txHash}`;
  } catch (e) {
    console.error(e);
    return "An error occurred while processing the bridging request";
  }
}

export const bridgerToolMetadata = {
  name: "bridger",
  description:
    "Generates calldata for bridging ERC20 tokens from one chain to another",
  parameters: bridgerSchema
};
