import { ChatCompletionTool } from "openai/resources/chat/completions";

export const tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "sender",
      description:
        "Generates calldata for transferring native or ERC20 tokens to a recipient",
      parameters: {
        type: "object",
        properties: {
          chainId: {
            type: "number",
            description: "The chain ID where the transfer will occur",
          },
          receiverAddress: {
            type: "string",
            description: "The address that will receive the tokens",
          },
          transferAmount: {
            type: "string",
            description: "The amount of tokens to transfer",
          },
          accountAddress: {
            type: "string",
            description: "The address sending the tokens",
          },
          tokenAddress: {
            type: "string",
            description: "The address of the token contract",
          },
        },
        required: [
          "chainId",
          "receiverAddress",
          "transferAmount",
          "accountAddress",
          "tokenAddress",
        ],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "bridger",
      description:
        "Generates calldata for bridging ERC20 tokens from one chain to another",
      parameters: {
        type: "object",
        properties: {
          chainIdIn: {
            type: "number",
            description: "The source chain ID",
          },
          chainIdOut: {
            type: "number",
            description: "The destination chain ID",
          },
          account: {
            type: "string",
            description: "The account address performing the bridge",
          },
          tokenIn: {
            type: "string",
            description: "The token address on the source chain",
          },
          tokenOut: {
            type: "string",
            description: "The token address on the destination chain",
          },
          inputTokenAmount: {
            type: "string",
            description: "The amount of tokens to bridge",
          },
        },
        required: [
          "chainIdIn",
          "chainIdOut",
          "account",
          "tokenIn",
          "tokenOut",
          "inputTokenAmount",
        ],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "bridge_status",
      description:
        "Checks if the status of a bridging transaction on both source and destination chains",
      parameters: {
        type: "object",
        properties: {
          chainIdIn: {
            type: "number",
            description: "The source chain ID",
          },
          chainIdOut: {
            type: "number",
            description: "The destination chain ID",
          },
          txnHash: {
            type: "string",
            description: "The transaction hash to check",
          },
          pid: {
            type: "number",
            description: "The process ID of the bridge transaction",
          },
        },
        required: ["chainIdIn", "chainIdOut", "txnHash", "pid"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "swapper",
      description:
        "Generates calldata for swapping an ERC20 token into another ERC20 token",
      parameters: {
        type: "object",
        properties: {
          chainId: {
            type: "number",
            description: "The chain ID where the swap will occur",
          },
          account: {
            type: "string",
            description: "The account address performing the swap",
          },
          tokenIn: {
            type: "string",
            description: "The address of the token to swap from",
          },
          tokenOut: {
            type: "string",
            description: "The address of the token to swap to",
          },
          inputTokenAmount: {
            type: "string",
            description: "The amount of input tokens to swap",
          },
        },
        required: [
          "chainId",
          "account",
          "tokenIn",
          "tokenOut",
          "inputTokenAmount",
        ],
      },
    },
  },
];
