import { Address, ConsoleKit } from "brahma-console-kit";
import { ConsoleKitConfig } from "../config";

const SLIPPAGE = 1;

export const toolImplementations = {
  sender: async (args: {
    chainId: number;
    receiverAddress: string;
    transferAmount: string;
    accountAddress: string;
    tokenAddress: string;
  }): Promise<string> => {
    const consoleKit = new ConsoleKit(
      ConsoleKitConfig.apiKey,
      ConsoleKitConfig.baseUrl
    );
    try {
      const { data } = await consoleKit.coreActions.send(
        args.chainId,
        args.accountAddress as Address,
        {
          amount: args.transferAmount,
          to: args.receiverAddress as Address,
          tokenAddress: args.tokenAddress as Address,
        }
      );
      return `The following transactions must be executed to perform the requested transfer-\n${JSON.stringify(
        data.transactions,
        null,
        2
      )}`;
    } catch (e) {
      console.error(e);
      return "an error occurred";
    }
  },

  bridger: async (args: {
    chainIdIn: number;
    chainIdOut: number;
    account: string;
    tokenIn: string;
    tokenOut: string;
    inputTokenAmount: string;
  }): Promise<string> => {
    const accountAddress = args.account as Address;
    const consoleKit = new ConsoleKit(
      ConsoleKitConfig.apiKey,
      ConsoleKitConfig.baseUrl
    );

    try {
      const [bridgeRoute] = await consoleKit.coreActions.fetchBridgingRoutes({
        amountIn: args.inputTokenAmount,
        amountOut: "0",
        chainIdIn: args.chainIdIn,
        chainIdOut: args.chainIdOut,
        ownerAddress: accountAddress,
        recipient: accountAddress,
        slippage: SLIPPAGE,
        tokenIn: args.tokenIn,
        tokenOut: args.tokenOut,
      });
      const { data } = await consoleKit.coreActions.bridge(
        args.chainIdIn,
        accountAddress,
        {
          amountIn: args.inputTokenAmount,
          amountOut: "0",
          chainIdIn: args.chainIdIn,
          chainIdOut: args.chainIdOut,
          ownerAddress: accountAddress,
          recipient: accountAddress,
          route: bridgeRoute,
          tokenIn: args.tokenIn as Address,
          tokenOut: args.tokenOut as Address,
          slippage: SLIPPAGE,
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

  bridge_status: async (args: {
    chainIdIn: number;
    chainIdOut: number;
    txnHash: string;
    pid: number;
  }): Promise<string> => {
    const consoleKit = new ConsoleKit(
      ConsoleKitConfig.apiKey,
      ConsoleKitConfig.baseUrl
    );

    try {
      const bridgingStatus = await consoleKit.coreActions.fetchBridgingStatus(
        args.txnHash as `0x${string}`,
        args.pid,
        args.chainIdIn,
        args.chainIdOut
      );
      return `Current bridging statuses-\nsource: ${
        bridgingStatus?.sourceStatus || "pending"
      }\ndestination: ${bridgingStatus?.destinationStatus || "pending"}`;
    } catch (e) {
      console.error(e);
      return "an error occurred";
    }
  },

  swapper: async (args: {
    chainId: number;
    account: string;
    tokenIn: string;
    tokenOut: string;
    inputTokenAmount: string;
  }): Promise<string> => {
    const accountAddress = args.account as Address;
    const consoleKit = new ConsoleKit(
      ConsoleKitConfig.apiKey,
      ConsoleKitConfig.baseUrl
    );

    try {
      const { data: swapRouteData } =
        await consoleKit.coreActions.getSwapRoutes(
          args.tokenIn as Address,
          args.tokenOut as Address,
          accountAddress,
          args.inputTokenAmount,
          `${SLIPPAGE}`,
          args.chainId
        );
      const [swapRoute] = swapRouteData;

      const { data } = await consoleKit.coreActions.swap(
        args.chainId,
        accountAddress,
        {
          amountIn: args.inputTokenAmount,
          chainId: args.chainId,
          route: swapRoute,
          slippage: SLIPPAGE,
          tokenIn: args.tokenIn as Address,
          tokenOut: args.tokenOut as Address,
        }
      );
      return `The following transactions must be executed to perform the requested swap-\n${JSON.stringify(
        data.transactions,
        null,
        2
      )}`;
    } catch (e) {
      console.error(e);
      return "an error occurred";
    }
  },
};
