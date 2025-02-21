import Safe from "@safe-global/protocol-kit";
import {
  Address,
  ConsoleKit,
  UpdateAutomationParams
} from "brahma-console-kit";
import { ethers, Wallet } from "ethers";
import { encodeMulti } from "ethers-multisend";
import { encodePacked } from "viem";
import { SafeABI } from "./entity/abi";

const OwnerEoaPK = process.env.USER_EOA_PRIVATE_KEY!; /// This user must have enough tokens to execute automation update
const ExecutorRegistryId = process.env.EXECUTOR_REGISTRY_ID!;
const JsonRpcUrl = process.env.JSON_RPC_URL!;
const ConsoleApiKey = process.env.CONSOLE_API_KEY!;
const ConsoleBaseUrl = process.env.CONSOLE_BASE_URL!;

const SUBACCOUNT_ADDRESS: Address = "0x"; // your automation subaccount address
const CONSOLE_ADDRESS: Address = "0x"; // your owner console address
const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

const AutomationUpdateData = {
  duration: 0, // new updated duration
  execViaSubAcc: [] /**
        array of arbitrary txns to execute via subAccount of type-
        {
          "to": "target Address",
          "value": "0",
          "data": "0xcallData"
        }[]
    */,
  metadata: {}, // required calldata update
  sweepTokens: [], // array of tokens to transfer out of subAccount
  tokenInputs: {
    [BASE_USDC]: "10000000" // mapping of token amounts to transfer to subAccount
  },
  tokenLimits: {
    [BASE_USDC]: "5000000" // mapping of new token limits
  }
};

const updateAutomation = async (
  _consoleKit: ConsoleKit,
  _rpcUrl: string,
  _automationUpdateParams: UpdateAutomationParams,
  _ownerEoa: Wallet,
  _consoleAddress: Address
) => {
  try {
    const {
      data: { transactions }
    } = await _consoleKit.automationContext.updateAutomation(
      _automationUpdateParams
    );
    console.log("[update-txns]", { transactions });

    const safe = await Safe.init({
      provider: _rpcUrl,
      safeAddress: _consoleAddress
    });
    const updateTx = await safe.createTransaction({
      transactions: transactions,
      onlyCalls: false
    }); // safe sdk can also alternatively be used to create & propose tx: https://docs.safe.global/reference-sdk-protocol-kit/transactions/createtransaction
    console.log("[safe-update-tx]", { updateTx });

    const {
      baseGas,
      data,
      gasPrice,
      gasToken,
      operation,
      refundReceiver,
      safeTxGas,
      to,
      value
    } = updateTx.data;
    const signature = encodePacked(
      ["bytes12", "address", "bytes32", "bytes1"],
      [
        "0x000000000000000000000000",
        _ownerEoa.address as Address,
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x01"
      ]
    );

    const safeContract = new ethers.Contract(
      _consoleAddress,
      SafeABI,
      _ownerEoa
    );
    const tx = await _ownerEoa.sendTransaction({
      to: await safeContract.getAddress(),
      value: 0,
      data: safeContract.interface.encodeFunctionData("execTransaction", [
        to,
        value,
        data,
        operation,
        safeTxGas,
        baseGas,
        gasPrice,
        gasToken,
        refundReceiver,
        signature
      ])
    });
    await tx.wait(2);

    console.log("[automation-updated]", tx.hash);
  } catch (e) {
    console.log("an error occured", e);
  }
};

(async () => {
  const consoleKit = new ConsoleKit(ConsoleApiKey, ConsoleBaseUrl);

  const provider = new ethers.JsonRpcProvider(JsonRpcUrl);
  const ownerWallet = new ethers.Wallet(OwnerEoaPK, provider);

  const { chainId: chainIdBig } = await provider.getNetwork();
  const chainId = parseInt(chainIdBig.toString(), 10);

  const automationUpdateData: UpdateAutomationParams = {
    chainId,
    data: {
      chainId,
      duration: AutomationUpdateData.duration,
      execViaSubAcc: AutomationUpdateData.execViaSubAcc,
      metadata: AutomationUpdateData.metadata,
      ownerAddress: CONSOLE_ADDRESS,
      registryID: ExecutorRegistryId,
      sweepTokens: AutomationUpdateData.sweepTokens,
      tokenInputs: AutomationUpdateData.tokenInputs,
      tokenLimits: AutomationUpdateData.tokenLimits
    },
    subAccountAddress: SUBACCOUNT_ADDRESS
  };

  await updateAutomation(
    consoleKit,
    JsonRpcUrl,
    automationUpdateData,
    ownerWallet,
    CONSOLE_ADDRESS
  );
})();
