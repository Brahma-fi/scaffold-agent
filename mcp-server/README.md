# ConsoleKit MCP Server

A Model Context Protocol (MCP) server implementation for ConsoleKit blockchain operations.

## Features

This MCP server provides the following tools:

- **sender**: Transfer native or ERC20 tokens to a recipient
- **bridger**: Bridge tokens between different chains
- **swapper**: Swap tokens on a specific chain
- **bridgeStatus**: Check the status of a bridge transaction

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- ConsoleKit API key

### Installation

1. Clone this repository
2. Install dependencies:

```bash
cd mcp-server
npm install
```

3. Create a `.env` file with the following variables:

```
CONSOLE_API_KEY=your_consolekit_api_key
CONSOLE_BASE_URL=https://api.consolekit.example.com
PORT=3000
```

### Running the Server

Build and start the server:

```bash
npm run build
npm start
```

For development with hot-reloading:

```bash
npm run dev
```

## Usage with Claude

Once the server is running, you can connect to it from Claude Desktop or any other MCP client. The server exposes tools for blockchain operations through the Model Context Protocol.

### Example Prompts

The server includes several example prompts to help you get started:

- **token-transfer**: Transfer tokens between addresses
- **token-bridge**: Bridge tokens between different chains
- **token-swap**: Swap tokens on a specific chain

## License

MIT
