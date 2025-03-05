import { createServer } from "@modelcontextprotocol/sdk";
import { ServerConfig } from "./config";
import {
  senderTool,
  senderToolMetadata,
  bridgerTool,
  bridgerToolMetadata,
  swapperTool,
  swapperToolMetadata,
  bridgeStatusTool,
  bridgeStatusToolMetadata,
} from "./tools";

async function main() {
  const server = await createServer({
    name: "consolekit-mcp-server",
    description: "MCP server for ConsoleKit blockchain operations",
    tools: [
      {
        name: senderToolMetadata.name,
        description: senderToolMetadata.description,
        parameters: senderToolMetadata.parameters,
        function: senderTool,
      },
      {
        name: bridgerToolMetadata.name,
        description: bridgerToolMetadata.description,
        parameters: bridgerToolMetadata.parameters,
        function: bridgerTool,
      },
      {
        name: swapperToolMetadata.name,
        description: swapperToolMetadata.description,
        parameters: swapperToolMetadata.parameters,
        function: swapperTool,
      },
      {
        name: bridgeStatusToolMetadata.name,
        description: bridgeStatusToolMetadata.description,
        parameters: bridgeStatusToolMetadata.parameters,
        function: bridgeStatusTool,
      },
    ],
    resources: [],
    prompts: [
      {
        name: "token-transfer",
        description: "Transfer tokens between addresses",
        content: `You can use the sender tool to transfer tokens between addresses.
Example:
- To transfer 0.1 ETH on Ethereum mainnet (chainId: 1) from address 0x123... to 0x456..., use the sender tool with the following parameters:
  - chainId: 1
  - receiverAddress: "0x456..."
  - transferAmount: "0.1"
  - accountAddress: "0x123..."
  - tokenAddress: "0x0000000000000000000000000000000000000000" (for native ETH)
  
For ERC20 tokens, provide the token contract address instead of the zero address.`,
      },
      {
        name: "token-bridge",
        description: "Bridge tokens between different chains",
        content: `You can use the bridger tool to bridge tokens between different chains.
Example:
- To bridge 10 USDC from Ethereum (chainId: 1) to Polygon (chainId: 137), use the bridger tool with the following parameters:
  - chainIdIn: 1
  - chainIdOut: 137
  - account: "0x123..."
  - tokenIn: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" (USDC on Ethereum)
  - tokenOut: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" (USDC on Polygon)
  - inputTokenAmount: "10"
  
You can check the status of a bridge transaction using the bridgeStatus tool.`,
      },
      {
        name: "token-swap",
        description: "Swap tokens on a specific chain",
        content: `You can use the swapper tool to swap tokens on a specific chain.
Example:
- To swap 0.1 ETH for USDC on Ethereum (chainId: 1), use the swapper tool with the following parameters:
  - chainId: 1
  - account: "0x123..."
  - tokenIn: "0x0000000000000000000000000000000000000000" (native ETH)
  - tokenOut: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" (USDC)
  - inputTokenAmount: "0.1"
  
The tool will return the transactions needed to perform the swap.`,
      },
    ],
  });

  const port = Number(ServerConfig.port);
  await server.listen(port);
  console.log(`ConsoleKit MCP server running on port ${port}`);
}

main().catch((error) => {
  console.error("Error starting MCP server:", error);
  process.exit(1);
});
