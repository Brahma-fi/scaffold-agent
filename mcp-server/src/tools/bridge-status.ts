import { z } from "zod";
import { ConsoleKit } from "brahma-console-kit";
import { ConsoleKitConfig } from "../config";

const bridgeStatusSchema = z.object({
  chainId: z.number(),
  transactionHash: z.string(),
});

export type BridgeStatusParams = z.infer<typeof bridgeStatusSchema>;

export async function bridgeStatusTool(
  params: BridgeStatusParams
): Promise<string> {
  const { chainId, transactionHash } = params;

  const consoleKit = new ConsoleKit(
    ConsoleKitConfig.apiKey,
    ConsoleKitConfig.baseUrl
  );

  try {
    const { data } = await consoleKit.coreActions.getBridgeStatus(
      chainId,
      transactionHash
    );

    return `Bridge status for transaction ${transactionHash} on chain ${chainId}:\n${JSON.stringify(
      data,
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
