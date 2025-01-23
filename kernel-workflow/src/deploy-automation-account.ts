import {
  ConsoleKit,
  PreComputedAddressData,
  TaskStatusData
} from "brahma-templates-sdk";
import { ethers } from "ethers";
import { erc20Abi, fromHex } from "viem";
import { poll } from "./utils";

type Address = `0x${string}`;

const ownerEoaPK = process.env.OWNER_EOA_PRIVATE_KEY!;
const chainId = parseInt(process.env.CHAIN_ID!, 10);
const executorRegistryId = process.env.EXECUTOR_REGISTRY_ID!;
const jsonRpcUrl = process.env.JSON_RPC_URL!;

const setupPrecomputeBalances = async (
  _consoleKit: ConsoleKit,
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
    const provider = new ethers.JsonRpcProvider(jsonRpcUrl);
    const wallet = new ethers.Wallet(_ownerEoaPK, provider);
    const inputTokenContract = new ethers.Contract(
      _inputToken,
      erc20Abi,
      wallet
    );

    await inputTokenContract.transfer(
      precomputedData.precomputedAddress,
      totalDepositAmount
    );
  } catch (e) {
    console.log(e);
    throw new Error("precompute setup balance fail");
  }

  return precomputedData;
};

const signAndDeployAutomationAccount = async (
  _consoleKit: ConsoleKit,
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
  const provider = new ethers.JsonRpcProvider(jsonRpcUrl);
  const wallet = new ethers.Wallet(_ownerEoaPK, provider);
  const inputTokenContract = new ethers.Contract(_inputToken, erc20Abi, wallet);

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
      // TODO:
      {}
    );
  if (!accountGenerationData)
    throw new Error("automation account generation data fetch fail");

  const {
    signaturePayload: { domain, message, types, primaryType },
    subAccountPolicyCommit,
    subscriptionDraftID
  } = accountGenerationData;

  const deploymentSignature = await wallet.signTypedData(
    {
      verifyingContract: domain.verifyingContract,
      chainId: fromHex(domain.chainId as Address, "number")
    },
    types,
    message
  );

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

  return deployData;
};

const pollDeploymentStatus = async (
  _consoleKit: ConsoleKit,
  _deploymentTaskId: string
) => {
  const isTaskComplete = (taskStatus: TaskStatusData) =>
    taskStatus.status === "successful" ||
    taskStatus.status === "cancelled" ||
    taskStatus.status === "failed";
  const getTaskStatus = async () => {
    const taskStatus =
      _consoleKit.publicDeployer.fetchDeploymentStatus(_deploymentTaskId);
    console.log({ taskStatus });

    return taskStatus;
  };

  const taskStatus = await poll<TaskStatusData>(
    getTaskStatus,
    isTaskComplete,
    5000
  );
  return taskStatus;
};
