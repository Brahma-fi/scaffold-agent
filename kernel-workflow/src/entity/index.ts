export type ExecutorMetadata = {
  logo: string;
  name: string;
  metadata: Object;
};

export interface TaskParams {
  subAccountAddress: string;
  chainID: number;
  subscription: {
    id: string;
    metadata: {
      baseToken: string;
      preferredVaults?: string[];
    };
  };
}

export * from "./morpho";
