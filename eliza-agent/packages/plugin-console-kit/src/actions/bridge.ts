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

export const bridgeAction: Action = {
  name: "BRIDGE_TOKEN",
  description: "Bridge tokens between chains",
  similes: [
    "bridge tokens",
    "transfer across chains",
    "move tokens between chains",
    "cross-chain transfer",
    "bridge crypto",
    "send tokens across chains",
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
        account: options.account as string,
        tokenIn: options.tokenIn as string,
        tokenOut: options.tokenOut as string,
        inputTokenAmount: options.inputTokenAmount as string,
      };

      const service = runtime.services.get(ConsoleKitService.serviceType);
      if (!(service instanceof ConsoleKitService)) {
        throw new Error("ConsoleKit service not found or invalid");
      }

      const result = await service.bridge(params);

      callback({
        text: `✅ Bridge transaction prepared successfully!\nTransactions to execute:\n${JSON.stringify(
          result.data.transactions,
          null,
          2
        )}`,
        content: { transactions: result.data.transactions },
      });
      return true;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      elizaLogger.error("Bridge token failed:", errorMessage);
      callback({
        text: `❌ Failed to bridge tokens: ${errorMessage}`,
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
          text: "Bridge 100 USDC from Ethereum to Polygon",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll help you bridge 100 USDC from Ethereum to Polygon. Let me prepare the transaction.",
          action: "BRIDGE_TOKEN",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Transfer 50 USDT from Arbitrum to Optimism",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll help you bridge 50 USDT from Arbitrum to Optimism. Let me prepare the transaction.",
          action: "BRIDGE_TOKEN",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Move 25 WETH from Base to Ethereum",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll help you bridge 25 WETH from Base to Ethereum mainnet. Let me prepare the transaction.",
          action: "BRIDGE_TOKEN",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Bridge 1000 DAI from Polygon to Arbitrum",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll help you bridge 1000 DAI from Polygon to Arbitrum. Let me prepare the transaction.",
          action: "BRIDGE_TOKEN",
        },
      },
    ],
  ],
};
