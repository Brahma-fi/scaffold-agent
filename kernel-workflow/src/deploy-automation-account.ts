import {
  ConsoleKit,
  PreComputedAddressData,
  TaskStatusData,
  Address
} from "brahma-console-kit";
import { ethers, JsonRpcProvider, Wallet } from "ethers";
import { erc20Abi, fromHex } from "viem";
import { poll } from "./utils";
import { PreferredMorphoVaults } from "./config";

const UserEoaPK = process.env.USER_EOA_PRIVATE_KEY!; /// This user must have enough tokens to fund deployments & automation subscription deposits
const ExecutorRegistryId = process.env.EXECUTOR_REGISTRY_ID!;
const JsonRpcUrl = process.env.JSON_RPC_URL!;
const ConsoleApiKey = process.env.CONSOLE_API_KEY!;
const ConsoleBaseUrl = process.env.CONSOLE_BASE_URL!;

/// configure according to required subscription
const AutomationSubscriptionParams = {
  inputToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as Address, // base usdc
  inputAmount: BigInt(10000000), // 10 usdc
  inputTokenPerIterationLimit: BigInt(2000000), // 2 usdc,
  duration: 0,
  metadata: {
    every: "86400s", // configure to required automation interval,
    baseToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as Address, // base usdc,
    preferredVaults: PreferredMorphoVaults
  }
};

const setupPrecomputeBalances = async (
  _consoleKit: ConsoleKit,
  _provider: JsonRpcProvider,
  _userWallet: Wallet,
  _userEoa: Address,
  _chainId: number,
  _inputToken: Address,
  _inputAmount: bigint
) => {
  const precomputedData = await _consoleKit.publicDeployer.fetchPreComputeData(
    _userEoa,
    _chainId,
    _inputToken
  );
  if (!precomputedData) throw new Error("precompute call fail");

  const totalDepositAmount = BigInt(precomputedData.feeEstimate) + _inputAmount;

  try {
    const inputTokenContract = new ethers.Contract(
      _inputToken,
      erc20Abi,
      _userWallet
    );

    const tx = await _userWallet.sendTransaction({
      to: await inputTokenContract.getAddress(),
      value: 0,
      data: inputTokenContract.interface.encodeFunctionData("transfer", [
        precomputedData.precomputedAddress,
        totalDepositAmount
      ])
    });
    await tx.wait(2);
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
  _userWallet: Wallet,
  _userEoa: Address,
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
    _userWallet
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
      _userEoa,
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

  const deploymentSignature = await _userWallet.signTypedData(
    {
      verifyingContract: domain.verifyingContract,
      chainId: fromHex(domain.chainId as any, "number")
    },
    types,
    message
  );
  console.log("[dep-signature]", deploymentSignature);

  const deployData = await _consoleKit.publicDeployer.deployBrahmaAccount(
    _userEoa,
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
    await _consoleKit.coreActions.indexTransaction(
      taskStatus.outputTransactionHash,
      _chainId
    );

  return taskStatus;
};

(async () => {
  const consoleKit = new ConsoleKit(ConsoleApiKey, ConsoleBaseUrl);

  const provider = new ethers.JsonRpcProvider(JsonRpcUrl);
  const userWallet = new ethers.Wallet(UserEoaPK, provider);

  const userEoaAddress = ethers.computeAddress(UserEoaPK) as Address;
  const { chainId: chainIdBig } = await provider.getNetwork();
  const chainId = parseInt(chainIdBig.toString(), 10);

  const precomputeData = await setupPrecomputeBalances(
    consoleKit,
    provider,
    userWallet,
    userEoaAddress,
    chainId,
    AutomationSubscriptionParams.inputToken,
    AutomationSubscriptionParams.inputAmount
  );

  const { taskId } = await signAndDeployAutomationAccount(
    consoleKit,
    provider,
    userWallet,
    userEoaAddress,
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
