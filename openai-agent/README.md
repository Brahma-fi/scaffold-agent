# OpenAI Agent

This is an OpenAI-based implementation of the agent-server, using OpenAI's native function calling format instead of LangChain.

## Setup

1. Install dependencies:

```bash
yarn install
```

2. Set up environment variables:

```bash
export OPENAI_API_KEY="your-openai-api-key"
export CONSOLE_API_KEY="your-console-kit-api-key"
export CONSOLE_BASE_URL="your-console-kit-base-url"
```

## Usage

### Running the Local Test Agent

```bash
yarn agent
```

This will start an interactive session where you can chat with the agent. The agent can:

- Add numbers
- Send tokens
- Bridge tokens between chains
- Check bridge status
- Swap tokens

### Example Commands

1. Adding numbers:

```
> Add 5 and 3
```

2. Sending tokens:

```
> Send 100 USDC from 0x123... to 0x456... on chain 1
```

3. Bridging tokens:

```
> Bridge 100 USDC from Ethereum to Polygon
```

4. Checking bridge status:

```
> Check bridge status for transaction 0x789... with pid 1
```

5. Swapping tokens:

```
> Swap 100 USDC for ETH on Ethereum
```

## Architecture

The agent uses OpenAI's function calling format to define and execute tools. The main components are:

- `src/tools/definitions.ts`: Tool definitions in OpenAI's format
- `src/tools/implementations.ts`: Actual tool implementations
- `src/agent/init.ts`: Agent initialization and message processing
- `src/config.ts`: Configuration for OpenAI and ConsoleKit

## Development

1. Build the project:

```bash
yarn build
```

2. Run tests:

```bash
yarn test
```
