import {
  ConsoleKit,
  PreComputedAddressData,
  TaskStatusData,
  Address
} from "brahma-templates-sdk";
import { ethers, JsonRpcProvider, Wallet } from "ethers";
import { erc20Abi, fromHex } from "viem";
import { poll } from "./utils";

const OwnerEoaPK = process.env.OWNER_EOA_PRIVATE_KEY!;
const ExecutorRegistryId = process.env.EXECUTOR_REGISTRY_ID!;
const JsonRpcUrl = process.env.JSON_RPC_URL!;
const ConsoleApiKey = process.env.CONSOLE_API_KEY!;
const ConsoleBaseUrl = process.env.CONSOLE_BASE_URL!;

/// configure according to required subscription
const AutomationSubscriptionParams = {
  inputToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as Address, // base usdc
  inputAmount: BigInt(10000000), // 10 usdc
  inputTokenPerIterationLimit: BigInt(2000000), // 2 usdc,
  duration: 86400, // 1 day,
  metadata: {
    every: "60s", // configure to required automation interval
    receiver: "0xAE75B29ADe678372D77A8B41225654138a7E6ff1", // configure to required receiver address
    transferAmount: "200000" // configure to required transfer amount per iteration
  }
};

const setupPrecomputeBalances = async (
  _consoleKit: ConsoleKit,
  _provider: JsonRpcProvider,
  _wallet: Wallet,
  _ownerEoa: Address,
  _ownerEoaPK: string,
  _chainId: number,
  _inputToken: Address,
  _inputAmount: bigint
) => {
  const precomputedData =
    await _consoleKit.publicDeployer.fetchPreComputeAddress(
      _ownerEoa,
      _chainId,
      _inputToken
    );
  if (!precomputedData) throw new Error("precompute call fail");

  const totalDepositAmount = BigInt(precomputedData.feeEstimate) + _inputAmount;

  try {
    const inputTokenContract = new ethers.Contract(
      _inputToken,
      erc20Abi,
      _wallet
    );

    await inputTokenContract.transfer(
      precomputedData.precomputedAddress,
      totalDepositAmount
    );
  } catch (e) {
    console.log(e);
    throw new Error("precompute setup balance fail");
  }

  console.log("[precompute]", { precomputedData });
  return precomputedData;
};

const signAndDeployAutomationAccount = async (
  _consoleKit: ConsoleKit,
  _provider: JsonRpcProvider,
  _wallet: Wallet,
  _ownerEoa: Address,
  _ownerEoaPK: string,
  _chainId: number,
  _precomputeData: PreComputedAddressData,
  _executorRegistryId: string,
  _inputToken: Address,
  _inputAmount: bigint,
  _inputTokenPerIterationLimit: bigint,
  _automationDuration: number
) => {
  const inputTokenContract = new ethers.Contract(
    _inputToken,
    erc20Abi,
    _wallet
  );
  const inputTokenDecimals = await inputTokenContract.decimals();

  const tokens = [_inputToken];
  const amounts = [_inputAmount.toString()];

  const tokenInputs = {
    [_inputToken]: _inputAmount.toString()
  };
  const tokenLimits = {
    [_inputToken]: ethers.formatUnits(_inputAmount, inputTokenDecimals)
  };

  const automationDuration =
    _automationDuration > 3600
      ? _automationDuration - 3600
      : _automationDuration;

  const accountGenerationData =
    await _consoleKit.publicDeployer.generateAutomationSubAccount(
      _ownerEoa,
      _precomputeData.precomputedAddress,
      _chainId,
      _executorRegistryId,
      _inputToken,
      _precomputeData.feeEstimate,
      tokens,
      amounts,
      {
        duration: automationDuration,
        tokenInputs: tokenInputs,
        tokenLimits: tokenLimits
      },
      AutomationSubscriptionParams.metadata
    );
  if (!accountGenerationData)
    throw new Error("automation account generation data fetch fail");

  const {
    signaturePayload: { domain, message, types },
    subAccountPolicyCommit,
    subscriptionDraftID
  } = accountGenerationData;

  const deploymentSignature = await _wallet.signTypedData(
    {
      verifyingContract: domain.verifyingContract,
      chainId: fromHex(domain.chainId as Address, "number")
    },
    types,
    message
  );
  console.log("[dep-signature]", deploymentSignature);

  const deployData = await _consoleKit.publicDeployer.deployBrahmaAccount(
    _ownerEoa,
    _chainId,
    _executorRegistryId,
    subscriptionDraftID,
    subAccountPolicyCommit,
    _inputToken,
    tokens,
    amounts,
    deploymentSignature,
    _precomputeData.feeEstimateSignature,
    _precomputeData.feeEstimate,
    {}
  );
  if (!deployData) throw new Error("automation account deployment fail");

  console.log("[deploy-init]", deployData.taskId);
  return deployData;
};

const pollDeploymentStatus = async (
  _consoleKit: ConsoleKit,
  _deploymentTaskId: string,
  _chainId: number
) => {
  const isTaskComplete = (taskStatus: TaskStatusData) =>
    !(
      taskStatus.status === "successful" ||
      taskStatus.status === "cancelled" ||
      taskStatus.status === "failed"
    );
  const getTaskStatus = async () => {
    const taskStatus = await _consoleKit.publicDeployer.fetchDeploymentStatus(
      _deploymentTaskId
    );
    console.log({ taskStatus });

    return taskStatus;
  };

  const taskStatus = await poll<TaskStatusData>(
    getTaskStatus,
    isTaskComplete,
    5000
  );

  if (taskStatus.outputTransactionHash)
    await _consoleKit.vendorCaller.indexTransaction(
      taskStatus.outputTransactionHash,
      _chainId
    );

  return taskStatus;
};

(async () => {
  const consoleKit = new ConsoleKit(ConsoleApiKey, ConsoleBaseUrl);

  const provider = new ethers.JsonRpcProvider(JsonRpcUrl);
  const wallet = new ethers.Wallet(OwnerEoaPK, provider);

  const ownerEoaAddress = ethers.computeAddress(OwnerEoaPK) as Address;
  const { chainId: chainIdBig } = await provider.getNetwork();
  const chainId = parseInt(chainIdBig.toString(), 10);

  const precomputeData = await setupPrecomputeBalances(
    consoleKit,
    provider,
    wallet,
    ownerEoaAddress,
    OwnerEoaPK,
    chainId,
    AutomationSubscriptionParams.inputToken,
    AutomationSubscriptionParams.inputAmount
  );

  const { taskId } = await signAndDeployAutomationAccount(
    consoleKit,
    provider,
    wallet,
    ownerEoaAddress,
    OwnerEoaPK,
    chainId,
    precomputeData,
    ExecutorRegistryId,
    AutomationSubscriptionParams.inputToken,
    AutomationSubscriptionParams.inputAmount,
    AutomationSubscriptionParams.inputTokenPerIterationLimit,
    AutomationSubscriptionParams.duration
  );

  const taskData = await pollDeploymentStatus(consoleKit, taskId, chainId);
  console.log("[complete]", { taskData });
})();
