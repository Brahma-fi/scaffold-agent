import {
  ConsoleKit,
  WorkflowExecutionStatus,
  WorkflowStateResponse
} from "brahma-console-kit";
import { ethers, JsonRpcProvider, Wallet } from "ethers";
import { MorphoClient, poll } from "./utils";
import { encodeMulti } from "ethers-multisend";
import { TaskParams } from "./entity";

const ExecutorEoaPK = process.env.EXECUTOR_EOA_PRIVATE_KEY!;
const ExecutorRegistryId = process.env.EXECUTOR_REGISTRY_ID!;
const JsonRpcUrl = process.env.JSON_RPC_URL!;
const ConsoleApiKey = process.env.CONSOLE_API_KEY!;
const ConsoleBaseUrl = process.env.CONSOLE_BASE_URL!;
const MorphoGraphqlUrl = process.env.MORPHO_GRAPHQL_URL!;

const POLLING_WAIT_INTERVAL = 10000;
const SLIPPAGE = 2;
let pollCount = 0;

interface ExecutionResult {
  skip: boolean;
  message: string;
  transactions?: any[];
}

class RebalancingStrategy {
  private morphoClient: MorphoClient;
  private consoleKit: ConsoleKit;
  private provider: JsonRpcProvider;

  constructor(morphoClient: MorphoClient, consoleKit: ConsoleKit) {
    this.morphoClient = morphoClient;
    this.consoleKit = consoleKit;
    this.provider = new JsonRpcProvider(JsonRpcUrl);
  }

  async executeHandler(taskParams: TaskParams): Promise<ExecutionResult> {
    console.log(
      "Executing rebalancing strategy for:",
      taskParams.subAccountAddress
    );

    // Extract parameters
    const params = taskParams.subscription.metadata;
    const subaccount = taskParams.subAccountAddress;
    const baseToken = params.baseToken;
    const chainId = taskParams.chainID;
    const preferredVaults = params.preferredVaults || [];

    // Get all vaults sorted by APY
    const vaults = await this.morphoClient.getVaults(
      baseToken,
      chainId,
      preferredVaults
    );
    if (!vaults.length) {
      console.log("No vaults found");
      return { skip: true, message: "No vaults found" };
    }

    // Find the best vault by APY
    const bestVault = vaults[0];
    console.log("Best vault:", bestVault.address, "APY:", bestVault.netApy);

    // Get user's current vault positions
    const positions = await this.morphoClient.getUserPositions(subaccount);
    const currentPosition = positions.length > 0 ? positions[0] : null;

    // If user has no position, simply deposit into best vault
    if (!currentPosition) {
      console.log(
        "No current position. Depositing into best vault:",
        bestVault.address
      );
      return this.handleDeposit(
        subaccount,
        baseToken,
        bestVault.address,
        chainId
      );
    }

    // Find current vault in the vault list
    const currentVaultInfo = vaults.find(
      (v) =>
        v.address.toLowerCase() === currentPosition.vaultAddress.toLowerCase()
    );
    if (!currentVaultInfo) {
      console.log("Current vault not in list. Possible configuration issue.");
      return { skip: true, message: "Current vault not in allowlist" };
    }

    console.log(
      "Current vault:",
      currentPosition.vaultAddress,
      "APY:",
      currentVaultInfo.netApy
    );

    // If best vault is different from current vault, rebalance
    if (
      bestVault.address.toLowerCase() !==
      currentPosition.vaultAddress.toLowerCase()
    ) {
      console.log(
        "Rebalancing from",
        currentPosition.vaultAddress,
        "to",
        bestVault.address
      );
      return this.handleRebalance(
        subaccount,
        currentPosition.vaultAddress,
        currentPosition.shares,
        bestVault.address,
        chainId,
        taskParams.subscription.id
      );
    }

    console.log("Already in best vault. No action needed.");
    return { skip: true, message: "Already in best vault" };
  }

  private async handleDeposit(
    subaccount: string,
    tokenAddress: string,
    vaultAddress: string,
    chainId: number
  ): Promise<ExecutionResult> {
    console.log("Handling deposit to vault:", vaultAddress);

    try {
      // Get token balance
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ["function balanceOf(address) view returns (uint256)"],
        this.provider
      );

      const balance = await tokenContract.balanceOf(subaccount);
      console.log("Available balance:", balance.toString());

      if (balance === "0") {
        return { skip: true, message: "No balance available for deposit" };
      }

      // Prepare deposit parameters
      const depositParams = {
        inputToken: tokenAddress,
        inputAmount: [balance.toString()],
        vaults: [vaultAddress],
        slippage: SLIPPAGE
      };

      // Generate deposit calldata
      const {
        data: { transactions }
      } = await this.consoleKit.coreActions.morphoDeposit(
        chainId,
        subaccount,
        depositParams
      );

      return {
        skip: false,
        message: `Depositing into vault ${vaultAddress}`,
        transactions
      };
    } catch (error: any) {
      console.error("Error handling deposit:", error);
      return { skip: true, message: `Deposit error: ${error.message}` };
    }
  }

  private async handleRebalance(
    subaccount: string,
    fromVaultAddress: string,
    shares: string,
    toVaultAddress: string,
    chainId: number,
    subscriptionId: string
  ): Promise<ExecutionResult> {
    console.log(
      "Handling rebalance from",
      fromVaultAddress,
      "to",
      toVaultAddress
    );

    try {
      // Preview redemption to get expected amount
      const vaultContract = new ethers.Contract(
        fromVaultAddress,
        [
          "function previewRedeem(uint256 shares) view returns (uint256 assets)",
          "function asset() view returns (address)"
        ],
        this.provider
      );

      // Get the expected assets from redemption and underlying token
      const expectedAssets = await vaultContract.previewRedeem(shares);
      const baseToken = await vaultContract.asset();

      console.log(
        "Expected assets from redemption:",
        expectedAssets.toString()
      );
      console.log("Base token:", baseToken);

      const withdrawParams = {
        convertToOutputToken: false,
        shareAmounts: [shares],
        vaults: [fromVaultAddress],
        slippage: SLIPPAGE
      };

      const {
        data: { transactions: withdrawTransactions }
      } = await this.consoleKit.coreActions.morphoWithdraw(
        chainId,
        subaccount,
        withdrawParams
      );

      const depositParams = {
        inputToken: baseToken,
        inputAmount: [expectedAssets.toString()],
        vaults: [toVaultAddress],
        slippage: 2 // 2% slippage
      };

      const {
        data: { transactions: depositTransactions }
      } = await this.consoleKit.coreActions.morphoDeposit(
        chainId,
        subaccount,
        depositParams
      );

      return {
        skip: false,
        message: `Withdrawing from ${fromVaultAddress} (will deposit to ${toVaultAddress} after)`,
        transactions: [...withdrawTransactions, ...depositTransactions]
      };
    } catch (error: any) {
      console.error("Error handling rebalance:", error);
      return { skip: true, message: `Rebalance error: ${error.message}` };
    }
  }
}

async function pollTasksAndSubmit(
  consoleKit: ConsoleKit,
  chainId: number,
  executorWallet: Wallet,
  registryId: string,
  executorAddress: string
): Promise<boolean> {
  try {
    console.log("[polling] cycle:", ++pollCount);

    // Fetch pending tasks
    const tasks = await consoleKit.automationContext.fetchTasks(
      registryId,
      0,
      10
    );
    console.log(`[${registryId}] Found ${tasks.length} tasks`);

    const morphoClient = new MorphoClient(MorphoGraphqlUrl);
    const strategy = new RebalancingStrategy(morphoClient, consoleKit);

    // Process each task
    for (const {
      id,
      payload: { params: taskParams }
    } of tasks) {
      console.log(
        `Processing task ${id} for subaccount ${taskParams.subAccountAddress}`
      );

      try {
        // Execute strategy handler
        const result = await strategy.executeHandler(taskParams);

        if (result.skip) {
          console.log(`[skipping] ${result.message}`);
          continue;
        }

        // Get executor nonce
        const executorNonce =
          await consoleKit.automationContext.fetchExecutorNonce(
            taskParams.subAccountAddress,
            executorAddress,
            chainId
          );
        console.log({ executorNonce });

        // Execute transaction
        const success = await executeTransaction(
          consoleKit,
          executorWallet,
          registryId,
          id,
          taskParams,
          result.transactions!,
          executorNonce,
          executorAddress,
          result.message
        );

        if (success) {
          console.log("successful rebalance");
        }
      } catch (error: any) {
        console.error(`Error processing task ${id}:`, error);
      }
    }
  } catch (error: any) {
    console.error("Error polling tasks:", error);
  }

  return true;
}

async function executeTransaction(
  consoleKit: ConsoleKit,
  executorWallet: Wallet,
  registryId: string,
  taskId: string,
  taskParams: TaskParams,
  transactions: any[],
  executorNonce: string,
  executorAddress: string,
  successMessage: string
): Promise<boolean> {
  // For multiple transactions, use the encodeMulti function
  let transaction =
    transactions.length > 1
      ? encodeMulti(transactions, consoleKit.getContractAddress("MULTI_SEND"))
      : transactions[0];
  transaction = {
    ...transaction,
    value: BigInt(transaction.value).toString()
  };
  console.log({ transaction });

  // Generate executable digest
  const { domain, message, types } =
    await consoleKit.automationContext.generateExecutableDigest712Message({
      account: taskParams.subAccountAddress,
      chainId: taskParams.chainID,
      data: transaction.data,
      executor: executorAddress,
      nonce: executorNonce,
      operation: transaction.operation || 0,
      pluginAddress: consoleKit.getContractAddress("EXECUTOR_PLUGIN"),
      to: transaction.to,
      value: transaction.value || "0"
    });

  // Sign digest
  const executionDigestSignature = await executorWallet.signTypedData(
    domain,
    types,
    message
  );

  // Submit task
  console.log("submitting task");
  await consoleKit.automationContext.submitTask({
    id: taskId,
    payload: {
      task: {
        executable: {
          callType: transaction.operation || 0,
          data: transaction.data,
          to: transaction.to,
          value: transaction.value || "0"
        },
        executorSignature: executionDigestSignature,
        executor: executorAddress,
        skip: false,
        skipReason: "",
        subaccount: taskParams.subAccountAddress
      }
    },
    registryId
  });

  const getWorkflowState = async (): Promise<
    WorkflowStateResponse | undefined
  > => {
    return await consoleKit.automationContext.fetchWorkflowState(taskId);
  };

  const isWorkflowComplete = (workflowState?: WorkflowStateResponse): boolean =>
    workflowState?.status === WorkflowExecutionStatus.RUNNING;

  try {
    const workflowState = await poll<WorkflowStateResponse>(
      getWorkflowState,
      isWorkflowComplete,
      5000
    );
    console.log(
      `[complete] ${successMessage} - workflow state: ${workflowState?.status}; txHash: ${workflowState.out?.outputTxHash}`
    );
    return true;
  } catch (error) {
    console.error("Workflow monitoring failed:", error);
    return false;
  }
}

(async () => {
  const consoleKit = new ConsoleKit(ConsoleApiKey, ConsoleBaseUrl);

  const provider = new JsonRpcProvider(JsonRpcUrl);
  const executorWallet = new Wallet(ExecutorEoaPK, provider);
  const executorAddress = ethers.computeAddress(ExecutorEoaPK);

  const { chainId: chainIdBig } = await provider.getNetwork();
  const chainId = parseInt(chainIdBig.toString(), 10);

  const pollForever = async (): Promise<boolean> =>
    await pollTasksAndSubmit(
      consoleKit,
      chainId,
      executorWallet,
      ExecutorRegistryId,
      executorAddress
    );

  await poll(
    pollForever,
    (res: boolean) => res === true,
    POLLING_WAIT_INTERVAL
  );
})();
