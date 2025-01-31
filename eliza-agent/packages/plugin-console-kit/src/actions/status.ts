import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  elizaLogger,
  Handler,
} from "@elizaos/core";
import { ConsoleKitService } from "../services/console";

export const bridgeStatusAction: Action = {
  name: "BRIDGE_STATUS",
  description: "Check the status of a bridge transaction",
  similes: [
    "check bridge status",
    "bridge transaction status",
    "check transfer status",
    "bridge progress",
    "bridge transaction progress",
    "check bridge progress",
  ],
  suppressInitialMessage: true,
  validate: async (runtime: IAgentRuntime) => {
    return !!runtime.getSetting("CONSOLE_KIT_API_KEY");
  },
  handler: (async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State | undefined,
    options: Record<string, unknown> | undefined,
    callback: HandlerCallback
  ) => {
    try {
      if (!options) {
        throw new Error("No options provided");
      }

      const params = {
        chainIdIn: options.chainIdIn as number,
        chainIdOut: options.chainIdOut as number,
        txnHash: options.txnHash as string,
        pid: options.pid as number,
      };

      const service = runtime.services.get(ConsoleKitService.serviceType);
      if (!(service instanceof ConsoleKitService)) {
        throw new Error("ConsoleKit service not found or invalid");
      }

      const status = await service.getBridgeStatus(params);

      callback({
        text: `Bridge Status:\nSource Chain: ${
          status?.sourceStatus || "pending"
        }\nDestination Chain: ${status?.destinationStatus || "pending"}`,
        content: {
          sourceStatus: status?.sourceStatus || "pending",
          destinationStatus: status?.destinationStatus || "pending",
        },
      });
      return true;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      elizaLogger.error("Bridge status check failed:", errorMessage);
      callback({
        text: `❌ Failed to check bridge status: ${errorMessage}`,
        content: { error: errorMessage },
      });
      return false;
    }
  }) as Handler,
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "Check bridge status for transaction 0x1234... with pid 1",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll check the status of your bridge transaction.",
          action: "BRIDGE_STATUS",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "What's the status of my bridge transaction 0xabcd... pid 2?",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "Let me check the status of your bridge transaction.",
          action: "BRIDGE_STATUS",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Has my bridge completed? Transaction: 0x9876... pid: 3",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll check if your bridge transaction has completed.",
          action: "BRIDGE_STATUS",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Show progress of bridge tx 0xefgh... pid 4",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll show you the progress of your bridge transaction.",
          action: "BRIDGE_STATUS",
        },
      },
    ],
  ],
};
