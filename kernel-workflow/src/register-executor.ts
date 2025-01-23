import {
  Address,
  ConsoleExecutorConfig,
  ConsoleKit,
  KernelExecutorConfig
} from "brahma-templates-sdk";
import { ethers, Wallet } from "ethers";
import { ExecutorMetadata } from "./entity";

const OwnerEoaPK = process.env.OWNER_EOA_PRIVATE_KEY!;
const JsonRpcUrl = process.env.JSON_RPC_URL!;
const ConsoleApiKey = process.env.CONSOLE_API_KEY!;
const ConsoleBaseUrl = process.env.CONSOLE_BASE_URL!;
const ExecutorClientID = process.env.EXECUTOR_CLIENT_ID!;

/// configure according to required executor config for console registration
const ExecutorConfigConsole: ConsoleExecutorConfig = {
  clientId: ExecutorClientID,
  executor: ethers.computeAddress(OwnerEoaPK),
  feeReceiver: ethers.computeAddress(OwnerEoaPK) as Address,
  hopAddresses: ["0xAE75B29ADe678372D77A8B41225654138a7E6ff1"], // addresses that tokens will be moved through during execution
  inputTokens: ["0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"], // base usdc
  limitPerExecution: true,
  timestamp: new Date().getTime()
};

/// configure according to required executor metadata
const ExecutorMetadata: ExecutorMetadata = {
  name: "scaffold-agent-executor",
  logo: "",
  metadata: {}
};

/// configure according to required executor config for kernel registration
const ExecutorConfigKernel: KernelExecutorConfig = {
  defaultEvery: "30s",
  executionTTL: "30s",
  type: "INTERVAL"
};

const registerExecutor = async (
  _consoleKit: ConsoleKit,
  _chainId: number,
  _wallet: Wallet,
  _executorConfig: ConsoleExecutorConfig,
  _executorMetadata: ExecutorMetadata
) => {
  const { domain, message, types } =
    await _consoleKit.vendorCaller.generateConsoleExecutorRegistration712Message(
      _chainId,
      _executorConfig
    );
  const executorRegistrationSignature = await _wallet.signTypedData(
    domain,
    types,
    message
  );

  try {
    // todo: return registryId
    await _consoleKit.vendorCaller.registerExecutorOnConsole(
      executorRegistrationSignature,
      _chainId,
      _executorConfig,
      _executorMetadata.name,
      _executorMetadata.logo,
      _executorMetadata.metadata
    );
  } catch (e) {
    console.log(e);
    throw new Error("register executor on console fail");
  }
};

const registerExecutorOnKernel = async (
  _consoleKit: ConsoleKit,
  _chainId: number,
  _wallet: Wallet,
  _registryId: string,
  _executorConfig: KernelExecutorConfig
) => {
  const { domain, message, types } =
    await _consoleKit.vendorCaller.generateKernelExecutorRegistration712Message(
      _chainId,
      _registryId,
      _executorConfig
    );
  const executorRegistrationSignature = await _wallet.signTypedData(
    domain,
    types,
    message
  );

  try {
    await _consoleKit.vendorCaller.registerExecutorOnKernel(
      _registryId,
      executorRegistrationSignature,
      _executorConfig
    );
  } catch (e) {
    console.log(e);
    throw new Error("register executor on kernel fail");
  }

  return await _consoleKit.vendorCaller.fetchExecutorDetails(_registryId);
};
