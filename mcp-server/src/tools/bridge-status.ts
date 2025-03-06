import { z } from "zod";
import { ConsoleKit } from "brahma-console-kit";
import { ConsoleKitConfig } from "../config";

const bridgeStatusSchema = z.object({
  chainIdIn: z.number(),
  chainIdOut: z.number(),
  transactionHash: z.string(),
  pid: z.number(),
});

export type BridgeStatusParams = z.infer<typeof bridgeStatusSchema>;

export async function bridgeStatusTool(
  params: BridgeStatusParams
): Promise<string> {
  const { chainIdIn, chainIdOut, transactionHash, pid } = params;

  const consoleKit = new ConsoleKit(
    ConsoleKitConfig.apiKey,
    ConsoleKitConfig.baseUrl
  );

  try {
    const bridgingStatus = await consoleKit.coreActions.fetchBridgingStatus(
      transactionHash as `0x${string}`,
      pid,
      chainIdIn,
      chainIdOut
    );

    return `Bridge status for transaction ${transactionHash} on chain ${chainIdIn} to ${chainIdOut}:\n${JSON.stringify(
      bridgingStatus,
      null,
      2
    )}`;
  } catch (e) {
    console.error(e);
    return "An error occurred while fetching the bridge status";
  }
}

export const bridgeStatusToolMetadata = {
  name: "bridgeStatus",
  description: "Fetches the status of a bridge transaction",
  parameters: bridgeStatusSchema,
};
