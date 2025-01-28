import { tool } from "@langchain/core/tools";
import { ConsoleKit } from "brahma-console-kit";
import { z } from "zod";
import { ConsoleKitConfig } from "../config";

const bridgeStatusSchema = z.object({
  chainIdIn: z.number(),
  chainIdOut: z.number(),
  txnHash: z.string(),
  pid: z.number()
});

const bridgeStatusTool = tool(
  async ({ chainIdIn, chainIdOut, pid, txnHash }): Promise<string> => {
    const consoleKit = new ConsoleKit(
      ConsoleKitConfig.apiKey,
      ConsoleKitConfig.baseUrl
    );

    try {
      const bridgingStatus = await consoleKit.coreActions.fetchBridgingStatus(
        txnHash as `0x${string}`,
        pid,
        chainIdIn,
        chainIdOut
      );
      return `Current bridging statuses-\nsource: ${
        bridgingStatus?.sourceStatus || "pending"
      }\ndestination: ${bridgingStatus?.destinationStatus || "pending"}`;
    } catch (e) {
      console.error(e);
      return "an error occurred";
    }
  },
  {
    name: "bridge-status",
    description:
      "Checks if the status of a bridging transaction on both source and destination chains",
    schema: bridgeStatusSchema
  }
);

export default bridgeStatusTool;
