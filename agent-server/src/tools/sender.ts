import { tool } from "@langchain/core/tools";
import { Address, ConsoleKit } from "brahma-templates-sdk";
import { z } from "zod";
import { ConsoleKitConfig } from "../config";

const senderSchema = z.object({
  chainId: z.number(),
  receiverAddress: z.string(),
  transferAmount: z.string(),
  accountAddress: z.string(),
  tokenAddress: z.string()
});

const senderTool = tool(
  async ({
    chainId,
    receiverAddress,
    transferAmount,
    accountAddress,
    tokenAddress
  }): Promise<string> => {
    const consoleKit = new ConsoleKit(
      ConsoleKitConfig.apiKey,
      ConsoleKitConfig.baseUrl
    );
    try {
      const { data } = await consoleKit.vendorCaller.send(
        chainId,
        accountAddress as Address,
        {
          amount: transferAmount,
          to: receiverAddress as Address,
          tokenAddress: tokenAddress as Address
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
  {
    name: "sender",
    description:
      "Generates calldata for transferring native or ERC20 tokens to a recipient",
    schema: senderSchema
  }
);

export default senderTool;
