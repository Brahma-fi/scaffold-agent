export interface VaultInfo {
  id: string;
  address: string;
  symbol: string;
  netApy: number;
}

export interface UserPosition {
  id: string;
  vaultAddress: string;
  vaultSymbol: string;
  shares: string;
}
