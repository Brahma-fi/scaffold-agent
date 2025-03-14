import { z } from "zod";
import { Address, ConsoleKit } from "brahma-console-kit";
import { ConsoleKitConfig } from "../config";
import { sendSafeTransaction } from "../utils";

const senderSchema = z.object({
  chainId: z.number(),
  receiverAddress: z.string(),
  transferAmount: z.string(),
  tokenAddress: z.string(),
});

export type SenderParams = z.infer<typeof senderSchema>;

export async function senderTool(params: SenderParams): Promise<string> {
  const { chainId, receiverAddress, transferAmount, tokenAddress } = params;

  const consoleKit = new ConsoleKit(
    ConsoleKitConfig.apiKey,
    ConsoleKitConfig.baseUrl
  );

  try {
    const { data } = await consoleKit.coreActions.send(
      chainId,
      process.env.USER_CONSOLE_ADDRESS as Address,
      {
        amount: transferAmount,
        to: receiverAddress as Address,
        tokenAddress: tokenAddress as Address,
      }
    );

    const txHash = await sendSafeTransaction(consoleKit, data.transactions);

    return `The transaction for your configured console is executed: ${txHash}`;
  } catch (e) {
    console.error(e);
    return "An error occurred while processing the transfer request";
  }
}

export const senderToolMetadata = {
  name: "sender",
  description:
    "Generates calldata for transferring native or ERC20 tokens to a recipient",
  parameters: senderSchema,
};
