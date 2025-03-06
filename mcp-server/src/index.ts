import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
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
import { z } from "zod";

async function main() {
  const server = new McpServer({
    name: "consolekit-mcp-server",
    version: "1.0.0",
    description: "MCP server for ConsoleKit blockchain operations",
  });

  // Register tools
  server.tool(
    senderToolMetadata.name,
    senderToolMetadata.description,
    senderToolMetadata.parameters.shape,
    async (args) => ({
      content: [{ type: "text", text: await senderTool(args) }],
    })
  );
  server.tool(
    bridgerToolMetadata.name,
    bridgerToolMetadata.description,
    bridgerToolMetadata.parameters.shape,
    async (args) => ({
      content: [{ type: "text", text: await bridgerTool(args) }],
    })
  );
  server.tool(
    swapperToolMetadata.name,
    swapperToolMetadata.description,
    swapperToolMetadata.parameters.shape,
    async (args) => ({
      content: [{ type: "text", text: await swapperTool(args) }],
    })
  );
  server.tool(
    bridgeStatusToolMetadata.name,
    bridgeStatusToolMetadata.description,
    bridgeStatusToolMetadata.parameters.shape,
    async (args) => ({
      content: [{ type: "text", text: await bridgeStatusTool(args) }],
    })
  );

  //TODO: add prompts for better tool usage

  // Start server with stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.log(`ConsoleKit MCP server running on stdio transport`);
}

main().catch((error) => {
  console.error("Error starting MCP server:", error);
  process.exit(1);
});
