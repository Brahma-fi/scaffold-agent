import { Service, ServiceType, IAgentRuntime } from "@elizaos/core";
import { ConsoleKit, Address } from "brahma-console-kit";

export interface ConsoleKitConfig {
  apiKey: string;
  baseUrl: string;
}

export class ConsoleKitService extends Service {
  static readonly serviceType: ServiceType = "console-kit" as ServiceType;
  private client: ConsoleKit | null = null;

  constructor(private config: ConsoleKitConfig) {
    super();
  }

  get serviceType(): ServiceType {
    return ConsoleKitService.serviceType;
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    this.client = new ConsoleKit(this.config.apiKey, this.config.baseUrl);
  }

  async send(params: {
    chainId: number;
    receiverAddress: string;
    transferAmount: string;
    accountAddress: string;
    tokenAddress: string;
  }) {
    if (!this.client) {
      throw new Error("ConsoleKit service not initialized");
    }

    return this.client.coreActions.send(
      params.chainId,
      params.accountAddress as Address,
      {
        amount: params.transferAmount,
        to: params.receiverAddress as Address,
        tokenAddress: params.tokenAddress as Address,
      }
    );
  }

  async bridge(params: {
    chainIdIn: number;
    chainIdOut: number;
    account: string;
    tokenIn: string;
    tokenOut: string;
    inputTokenAmount: string;
  }) {
    if (!this.client) {
      throw new Error("ConsoleKit service not initialized");
    }

    const accountAddress = params.account as Address;
    const [bridgeRoute] = await this.client.coreActions.fetchBridgingRoutes({
      amountIn: params.inputTokenAmount,
      amountOut: "0",
      chainIdIn: params.chainIdIn,
      chainIdOut: params.chainIdOut,
      ownerAddress: accountAddress,
      recipient: accountAddress,
      slippage: 1,
      tokenIn: params.tokenIn,
      tokenOut: params.tokenOut,
    });

    return this.client.coreActions.bridge(params.chainIdIn, accountAddress, {
      amountIn: params.inputTokenAmount,
      amountOut: "0",
      chainIdIn: params.chainIdIn,
      chainIdOut: params.chainIdOut,
      ownerAddress: accountAddress,
      recipient: accountAddress,
      route: bridgeRoute,
      tokenIn: params.tokenIn as Address,
      tokenOut: params.tokenOut as Address,
      slippage: 1,
    });
  }

  async getBridgeStatus(params: {
    chainIdIn: number;
    chainIdOut: number;
    txnHash: string;
    pid: number;
  }) {
    if (!this.client) {
      throw new Error("ConsoleKit service not initialized");
    }

    return this.client.coreActions.fetchBridgingStatus(
      params.txnHash as `0x${string}`,
      params.pid,
      params.chainIdIn,
      params.chainIdOut
    );
  }

  async swap(params: {
    chainId: number;
    account: string;
    tokenIn: string;
    tokenOut: string;
    inputTokenAmount: string;
  }) {
    if (!this.client) {
      throw new Error("ConsoleKit service not initialized");
    }

    const accountAddress = params.account as Address;
    const { data: swapRouteData } = await this.client.coreActions.getSwapRoutes(
      params.tokenIn as Address,
      params.tokenOut as Address,
      accountAddress,
      params.inputTokenAmount,
      "1",
      params.chainId
    );
    const [swapRoute] = swapRouteData;

    return this.client.coreActions.swap(params.chainId, accountAddress, {
      amountIn: params.inputTokenAmount,
      chainId: params.chainId,
      route: swapRoute,
      slippage: 1,
      tokenIn: params.tokenIn as Address,
      tokenOut: params.tokenOut as Address,
    });
  }
}
