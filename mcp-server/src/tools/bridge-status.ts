import { z } from "zod";
import { ConsoleKit } from "brahma-console-kit";
import { ConsoleKitConfig } from "../config";
import { Tool } from "../types";

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
    const { data } = await consoleKit.coreActions.fetchBridgingStatus(
      transactionHash as `0x${string}`,
      pid,
      chainIdIn,
      chainIdOut
    );

    return `Bridge status for transaction ${transactionHash} on chain ${chainIdIn} to ${chainIdOut}:\n${JSON.stringify(
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

export const bridgeStatus: Tool = {
  name: "bridge-status",
  description: "Check the status of a bridge transaction",
  schema: z.object({
    sourceChainId: z
      .number()
      .describe("The source chain of the bridge transaction"),
    destinationChainId: z
      .number()
      .describe("The destination chain of the bridge transaction"),
    txHash: z
      .string()
      .describe("The transaction hash of the bridge transaction"),
    pid: z.number().describe("The provider id of the bridge transaction"),
  }),
  execute: async ({
    sourceChainId,
    destinationChainId,
    txHash,
    pid,
  }: {
    sourceChainId: number;
    destinationChainId: number;
    txHash: string;
    pid: number;
  }) => {
    const consoleKit = new ConsoleKit(
      ConsoleKitConfig.apiKey,
      ConsoleKitConfig.baseUrl
    );

      try {
        const result = await consoleKit.coreActions.fetchBridgingStatus(
          txHash as `0x${string}`,
          pid,
          sourceChainId,
          destinationChainId
        );

        if (!result) {
          return {
            success: false,
            error: "Bridge transaction not found",
          };
        }

        return {
          success: true,
          data: {
            status: result.status,
            sourceChain: sourceChainId,
            destinationChain: destinationChainId,
            txHash,
            details: result,
          },
        };
      } catch (e) {
        console.error(e);
        return {
          success: false,
          error: "An error occurred while fetching the bridge status",
        };
    }
  },
};
