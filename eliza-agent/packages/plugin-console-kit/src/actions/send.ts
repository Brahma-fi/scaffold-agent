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

export const sendAction: Action = {
  name: "SEND_TOKEN",
  description: "Send tokens to an address",
  similes: [
    "transfer token",
    "send tokens",
    "transfer to address",
    "send to wallet",
    "send crypto",
    "transfer cryptocurrency",
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
        receiverAddress: options.receiverAddress as string,
        transferAmount: options.transferAmount as string,
        accountAddress: options.accountAddress as string,
        tokenAddress: options.tokenAddress as string,
      };

      const service = runtime.services.get(ConsoleKitService.serviceType);
      if (!(service instanceof ConsoleKitService)) {
        throw new Error("ConsoleKit service not found or invalid");
      }

      const result = await service.send(params);

      callback({
        text: `✅ Transaction prepared successfully!\nTransactions to execute:\n${JSON.stringify(
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
      elizaLogger.error("Send token failed:", errorMessage);
      callback({
        text: `❌ Failed to send tokens: ${errorMessage}`,
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
          text: "Send 100 USDC to 0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll help you send 100 USDC. Let me prepare the transaction.",
          action: "SEND_TOKEN",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Transfer 5 ETH to 0x742d35Cc6634C0532925a3b844Bc454e4438f44e on Ethereum mainnet",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll help you transfer 5 ETH on Ethereum mainnet. Let me prepare the transaction.",
          action: "SEND_TOKEN",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Send 1000 DAI to 0x742d35Cc6634C0532925a3b844Bc454e4438f44e on Polygon",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "I'll help you send 1000 DAI on Polygon. Let me prepare the transaction.",
          action: "SEND_TOKEN",
        },
      },
    ],
  ],
};
