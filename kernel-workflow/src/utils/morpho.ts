import { UserPosition, VaultInfo } from "../entity";

const DEFAULT_TOP_VAULTS_LENGTH = 10;

export class MorphoClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getVaults(
    assetAddress: string,
    chainId: number,
    preferredVaults: string[] = []
  ): Promise<VaultInfo[]> {
    const query = `
      query GetVaults($asset: [String!], $chainId: [Int!], $first: Int!, $vaults: [String!]) {
        vaults(where: { assetAddress_in: $asset, chainId_in: $chainId, whitelisted: true, address_in: $vaults }, orderBy: NetApy, orderDirection: Desc, first: $first) {
          items {
            id
            address
            symbol
            state {
              apy
              netApy
            }
          }
        }
      }
    `;

    const variables = {
      asset: [assetAddress],
      chainId: [chainId],
      first: preferredVaults.length || DEFAULT_TOP_VAULTS_LENGTH,
      vaults: preferredVaults
    };

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables })
    });

    const data = await response.json();
    return data.data.vaults.items.map((vault: any) => ({
      id: vault.id,
      address: vault.address,
      symbol: vault.symbol,
      netApy: vault.state.netApy
    }));
  }

  async getUserPositions(address: string): Promise<UserPosition[]> {
    const query = `
      query GetUserInfo($address: [String!]) {
        users(where: { address_in: $address }) {
          items {
            vaultPositions {
              id
              vault {
                address
                symbol
              }
              shares
            }
          }
        }
      }
    `;

    const variables = {
      address: [address]
    };

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables })
    });

    const data = await response.json();
    if (!data.data.users.items.length) {
      return [];
    }

    return data.data.users.items[0].vaultPositions.map((pos: any) => ({
      id: pos.id,
      vaultAddress: pos.vault.address,
      vaultSymbol: pos.vault.symbol,
      shares: pos.shares
    }));
  }
}
