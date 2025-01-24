import { Address, ConsoleKit, Task } from "brahma-templates-sdk";
import { ethers, JsonRpcProvider, Wallet } from "ethers";
import { erc20Abi } from "viem";
import { poll } from "./utils";

const ExecutorEoaPK = process.env.OWNER_EOA_PRIVATE_KEY!;
const ExecutorRegistryId = process.env.EXECUTOR_REGISTRY_ID!;
const JsonRpcUrl = process.env.JSON_RPC_URL!;
const ConsoleApiKey = process.env.CONSOLE_API_KEY!;
const ConsoleBaseUrl = process.env.CONSOLE_BASE_URL!;

const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const EXECUTOR_PLUGIN = "0xb92929d03768a4F8D69552e15a8071EAf8E684ed";
const POLLING_WAIT_INTERVAL = 10000;

let PollCount = 0;

const pollTasksAndSubmit = async (
  _consoleKit: ConsoleKit,
  _provider: JsonRpcProvider,
  _wallet: Wallet,
  _registryId: string,
  _executor: Address,
  _usdc: Address,
  _executorPlugin: Address
) => {
  try {
    const tasks = await _consoleKit.vendorCaller.fetchTasks(_registryId, 0, 10); // add pagination if required

    const usdcContract = new ethers.Contract(_usdc, erc20Abi, _provider);

    for (const {
      id,
      payload: { params: taskParams }
    } of tasks) {
      if (
        !taskParams.subscription?.metadata?.every ||
        !taskParams.subscription?.metadata?.receiver ||
        !taskParams.subscription?.metadata?.transferAmount
      ) {
        console.error("[inconsistent-task]", taskParams, "skipping...");
        continue;
      }
      console.log("[executing] id:", id);

      const transferCalldata = usdcContract.interface.encodeFunctionData(
        "transfer",
        [
          taskParams.subscription.metadata.receiver,
          taskParams.subscription.metadata.transferAmount
        ]
      );
      console.log("[transfer-calldata]", { transferCalldata });

      const executorNonce = await _consoleKit.vendorCaller.getExecutorNonce(
        _provider,
        taskParams.subAccountAddress,
        _executor,
        _executorPlugin
      );

      const { domain, message, types } =
        await _consoleKit.vendorCaller.generateExecutableDigest712Message({
          account: taskParams.subAccountAddress,
          chainId: taskParams.chainID,
          data: transferCalldata,
          executor: _executor,
          nonce: executorNonce,
          operation: 0,
          pluginAddress: _executorPlugin,
          to: _usdc,
          value: "0"
        });
      const executionDigestSignature = await _wallet.signTypedData(
        domain,
        types,
        message
      );

      await _consoleKit.vendorCaller.submitTask({
        id,
        payload: {
          task: {
            executable: {
              callType: 0,
              data: transferCalldata,
              to: _usdc,
              value: "0"
            },
            executorSignature: executionDigestSignature,
            executor: _executor,
            skip: false, // true to skip execution
            skipReason: "", // reason for skipping execution
            subaccount: taskParams.subAccountAddress
          }
        },
        registryId: _registryId
      });
      console.log("[complete] id:", id);
    }
  } catch (e) {
    console.log("an error occurred", e);
  }
  console.log("[polling] cycle:", ++PollCount);
  return true;
};

(async () => {
  const consoleKit = new ConsoleKit(ConsoleApiKey, ConsoleBaseUrl);

  const provider = new ethers.JsonRpcProvider(JsonRpcUrl);
  const wallet = new ethers.Wallet(ExecutorEoaPK, provider);

  const executorAddress = ethers.computeAddress(ExecutorEoaPK) as Address;

  const pollForever = async () =>
    await pollTasksAndSubmit(
      consoleKit,
      provider,
      wallet,
      ExecutorRegistryId,
      executorAddress,
      BASE_USDC,
      EXECUTOR_PLUGIN
    );
  await poll(pollForever, (res: true) => res === true, POLLING_WAIT_INTERVAL);
})();
