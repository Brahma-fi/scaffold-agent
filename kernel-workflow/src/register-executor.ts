import {
  Address,
  ConsoleExecutorConfig,
  ConsoleKit,
  KernelExecutorConfig
} from "brahma-console-kit";
import { ethers, Wallet } from "ethers";
import { ExecutorMetadata } from "./entity";
import { PreferredMorphoVaults } from "./config";

const ExecutorEoaPK = process.env.EXECUTOR_EOA_PRIVATE_KEY!;
const JsonRpcUrl = process.env.JSON_RPC_URL!;
const ConsoleApiKey = process.env.CONSOLE_API_KEY!;
const ConsoleBaseUrl = process.env.CONSOLE_BASE_URL!;
const ExecutorClientID = process.env.EXECUTOR_CLIENT_ID!;

const CONSOLE_FEE_RECEIVER = "0xEf59f0AD1bE369189e7dD30Fb474263a87400C73";

/// configure according to required executor config for console registration
const ExecutorConfigConsole: ConsoleExecutorConfig = {
  clientId: ExecutorClientID,
  executor: ethers.computeAddress(ExecutorEoaPK),
  feeReceiver: ethers.ZeroAddress as Address,
  hopAddresses: [...PreferredMorphoVaults, CONSOLE_FEE_RECEIVER], // morpho preferred vault addresses to whitelist in policy
  // NOTE: console fee receiver must be whitelisted
  inputTokens: ["0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"], // base usdc
  limitPerExecution: true,
  timestamp: new Date().getTime()
};

/// configure according to required executor metadata
const ExecutorMetadata: ExecutorMetadata = {
  name: "morpho-agent-executor",
  logo: "",
  metadata: {}
};

/// configure according to required executor config for kernel registration
const ExecutorConfigKernel: KernelExecutorConfig = {
  defaultEvery: "120s",
  executionTTL: "120s",
  type: "INTERVAL"
};

const registerExecutor = async (
  _consoleKit: ConsoleKit,
  _chainId: number,
  _executorWallet: Wallet,
  _executorConfig: ConsoleExecutorConfig,
  _executorMetadata: ExecutorMetadata
) => {
  const { domain, message, types } =
    await _consoleKit.automationContext.generateConsoleExecutorRegistration712Message(
      _chainId,
      _executorConfig
    );
  const executorRegistrationSignature = await _executorWallet.signTypedData(
    domain,
    types,
    message
  );
  console.log("[executor-console-sig]", executorRegistrationSignature);

  try {
    const executorData =
      await _consoleKit.automationContext.registerExecutorOnConsole(
        executorRegistrationSignature,
        _chainId,
        _executorConfig,
        _executorMetadata.name,
        _executorMetadata.logo,
        _executorMetadata.metadata
      );

    if (!executorData) throw new Error("register executor on console fail");

    console.log("[executor-reg]", { executorData });
    return executorData;
  } catch (e) {
    console.log(e);
    throw new Error("register executor on console fail");
  }
};

const registerExecutorOnKernel = async (
  _consoleKit: ConsoleKit,
  _chainId: number,
  _executorWallet: Wallet,
  _registryId: string,
  _executorConfig: KernelExecutorConfig
) => {
  const { domain, message, types } =
    await _consoleKit.automationContext.generateKernelExecutorRegistration712Message(
      _chainId,
      _registryId,
      _executorConfig
    );
  const executorRegistrationSignature = await _executorWallet.signTypedData(
    domain,
    types,
    message
  );
  console.log("[executor-kernel-sig]", executorRegistrationSignature);

  try {
    await _consoleKit.automationContext.registerExecutorOnKernel(
      _registryId,
      executorRegistrationSignature,
      _executorConfig
    );
  } catch (e) {
    console.log(e);
    throw new Error("register executor on kernel fail");
  }

  return await _consoleKit.automationContext.fetchExecutorDetails(_registryId);
};

(async () => {
  const consoleKit = new ConsoleKit(ConsoleApiKey, ConsoleBaseUrl);

  const provider = new ethers.JsonRpcProvider(JsonRpcUrl);
  const executorWallet = new ethers.Wallet(ExecutorEoaPK, provider);

  const { chainId: chainIdBig } = await provider.getNetwork();
  const chainId = parseInt(chainIdBig.toString(), 10);

  const { id: registryId } = await registerExecutor(
    consoleKit,
    chainId,
    executorWallet,
    ExecutorConfigConsole,
    ExecutorMetadata
  );

  const registeredExecutorData = await registerExecutorOnKernel(
    consoleKit,
    chainId,
    executorWallet,
    registryId,
    ExecutorConfigKernel
  );
  console.log("[complete]", { registeredExecutorData });
})();
