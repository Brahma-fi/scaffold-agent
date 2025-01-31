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

export const swapAction: Action = {
  name: "SWAP_TOKEN",
  description: "Swap tokens on a specific chain",
  similes: [
    "swap tokens",
    "exchange tokens",
    "convert tokens",
    "trade tokens",
    "swap crypto",
    "exchange cryptocurrency",
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
        chainId: options.chainId as number,
        account: options.account as string,
        tokenIn: options.tokenIn as string,
        tokenOut: options.tokenOut as string,
        inputTokenAmount: options.inputTokenAmount as string,
      };

      const service = runtime.services.get(ConsoleKitService.serviceType);
      if (!(service instanceof ConsoleKitService)) {
        throw new Error("ConsoleKit service not found or invalid");
      }

      const result = await service.swap(params);

      callback({
        text: `✅ Swap transaction prepared successfully!\nTransactions to execute:\n${JSON.stringify(
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
      elizaLogger.error("Swap token failed:", errorMessage);
      callback({
        text: `❌ Failed to swap tokens: ${errorMessage}`,
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
          text: "Swap 1 ETH for USDC on Ethereum",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll help you swap 1 ETH for USDC on Ethereum. Let me prepare the transaction.",
          action: "SWAP_TOKEN",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Exchange 1000 USDC for DAI on Polygon",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll help you swap 1000 USDC for DAI on Polygon. Let me prepare the transaction.",
          action: "SWAP_TOKEN",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Convert 500 USDT to WETH on Arbitrum",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll help you swap 500 USDT for WETH on Arbitrum. Let me prepare the transaction.",
          action: "SWAP_TOKEN",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Trade 100 WMATIC for USDC on Polygon",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll help you swap 100 WMATIC for USDC on Polygon. Let me prepare the transaction.",
          action: "SWAP_TOKEN",
        },
      },
    ],
  ],
};
