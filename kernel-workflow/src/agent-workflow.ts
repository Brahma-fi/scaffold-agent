import {
  Address,
  ConsoleKit,
  WorkflowExecutionStatus,
  WorkflowStateResponse
} from "brahma-console-kit";
import { ethers, JsonRpcProvider, Wallet } from "ethers";
import { erc20Abi } from "viem";
import { poll } from "./utils";
import { encodeMulti } from "ethers-multisend";

const ExecutorEoaPK = process.env.EXECUTOR_EOA_PRIVATE_KEY!;
const ExecutorRegistryId = process.env.EXECUTOR_REGISTRY_ID!;
const JsonRpcUrl = process.env.JSON_RPC_URL!;
const ConsoleApiKey = process.env.CONSOLE_API_KEY!;
const ConsoleBaseUrl = process.env.CONSOLE_BASE_URL!;

const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const POLLING_WAIT_INTERVAL = 10000;

let PollCount = 0;

const pollTasksAndSubmit = async (
  _consoleKit: ConsoleKit,
  _provider: JsonRpcProvider,
  _chainId: number,
  _executorWallet: Wallet,
  _registryId: string,
  _executor: Address,
  _usdc: Address,
  _executorPlugin: Address,
  _multiSend: Address
) => {
  try {
    const tasks = await _consoleKit.automationContext.fetchTasks(
      _registryId,
      0,
      10
    ); // add pagination if required

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
        console.error(
          "[skipping] inconsistent task params",
          id,
          "\n======================="
        );
        continue;
      }

      const usdcBalance = await usdcContract.balanceOf(
        taskParams.subAccountAddress
      );
      if (
        BigInt(usdcBalance) <
        BigInt(taskParams.subscription.metadata.transferAmount)
      ) {
        console.log(
          `[skipping] insufficient balance/automation already completed for ${taskParams.subAccountAddress}`,
          "\n======================="
        );
        continue;
      }

      console.log("[executing] id:", id);

      const {
        data: { transactions }
      } = await _consoleKit.coreActions.send(
        _chainId,
        taskParams.subAccountAddress,
        {
          amount: taskParams.subscription.metadata.transferAmount,
          to: taskParams.subscription.metadata.receiver,
          tokenAddress: (await usdcContract.getAddress()) as Address
        }
      );
      let transferTx = encodeMulti(transactions, _multiSend);
      transferTx = {
        ...transferTx,
        value: BigInt(transferTx.value).toString()
      };
      console.log("[transfer-txn]", { transferTx });

      const executorNonce =
        await _consoleKit.automationContext.fetchExecutorNonce(
          taskParams.subAccountAddress,
          _executor,
          _chainId
        );

      const { domain, message, types } =
        await _consoleKit.automationContext.generateExecutableDigest712Message({
          account: taskParams.subAccountAddress,
          chainId: taskParams.chainID,
          data: transferTx.data,
          executor: _executor,
          nonce: executorNonce,
          operation: transferTx.operation!,
          pluginAddress: _executorPlugin,
          to: transferTx.to as Address,
          value: transferTx.value
        });
      const executionDigestSignature = await _executorWallet.signTypedData(
        domain,
        types,
        message
      );

      await _consoleKit.automationContext.submitTask({
        id,
        payload: {
          task: {
            executable: {
              callType: transferTx.operation!,
              data: transferTx.data,
              to: transferTx.to,
              value: transferTx.value
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

      const getWorkflowState = async () => {
        const workflowState =
          await _consoleKit.automationContext.fetchWorkflowState(id);
        if (!workflowState) {
          console.error("[error] fetching working state fail");
          return;
        }

        console.log("[workflow-status]", id, workflowState.status);
        return workflowState;
      };
      const isWorkflowComplete = (workflowState: WorkflowStateResponse) =>
        workflowState?.status === WorkflowExecutionStatus.RUNNING;

      const workflowState = await poll<WorkflowStateResponse>(
        getWorkflowState,
        isWorkflowComplete,
        5000
      );

      console.log(
        "[complete] workflow state:",
        workflowState.out,
        "\n======================="
      );
    }
  } catch (e) {
    console.log("an error occurred", e);
  }
  console.log("[polling] cycle:", ++PollCount, "\n=======================");
  return true;
};

(async () => {
  const consoleKit = new ConsoleKit(ConsoleApiKey, ConsoleBaseUrl);

  const provider = new ethers.JsonRpcProvider(JsonRpcUrl);
  const executorWallet = new ethers.Wallet(ExecutorEoaPK, provider);

  const executorAddress = ethers.computeAddress(ExecutorEoaPK) as Address;
  const { chainId: chainIdBig } = await provider.getNetwork();
  const chainId = parseInt(chainIdBig.toString(), 10);

  const pollForever = async () =>
    await pollTasksAndSubmit(
      consoleKit,
      provider,
      chainId,
      executorWallet,
      ExecutorRegistryId,
      executorAddress,
      BASE_USDC,
      consoleKit.getContractAddress("EXECUTOR_PLUGIN"),
      consoleKit.getContractAddress("MULTI_SEND") // this is the only supported MultiSend contract (https://github.com/safe-global/safe-deployments/blob/main/src/assets/v1.3.0/multi_send_call_only.json)
    );
  await poll(pollForever, (res: true) => res === true, POLLING_WAIT_INTERVAL);
})();
