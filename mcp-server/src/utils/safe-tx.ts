import Safe from "@safe-global/protocol-kit";
import { ConsoleKit } from "brahma-console-kit";
import { ethers, Wallet } from "ethers";
import { Address, encodePacked } from "viem";
import { SafeABI } from "../entity";

export const sendSafeTransaction = async (
  _consoleKit: ConsoleKit,
  _transactions: {
    to: Address;
    data: string;
    value: string;
    operation: number;
  }[]
): Promise<string> => {
  const _ownerPK = process.env.USER_EOA_PRIVATE_KEY!;
  const _consoleAddress = process.env.USER_CONSOLE_ADDRESS!;
  const _rpcUrl = process.env.JSON_RPC_URL;
  console.log("[safe-tx]", { _ownerPK, _consoleAddress, _rpcUrl });
  if (!_ownerPK || !_consoleAddress || !_rpcUrl) throw new Error("invalid env");

  const _provider = new ethers.JsonRpcProvider(_rpcUrl);
  const _ownerEoa = new ethers.Wallet(_ownerPK, _provider);

  const safe = await Safe.init({
    provider: _rpcUrl,
    safeAddress: _consoleAddress,
  });
  const safeTx = await safe.createTransaction({
    transactions: _transactions,
    onlyCalls: false,
  });
  console.log("[safe-tx]", { safeTx });

  const {
    baseGas,
    data,
    gasPrice,
    gasToken,
    operation,
    refundReceiver,
    safeTxGas,
    to,
    value,
  } = safeTx.data;
  const signature = encodePacked(
    ["bytes12", "address", "bytes32", "bytes1"],
    [
      "0x000000000000000000000000",
      _ownerEoa.address as Address,
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      "0x01",
    ]
  );

  const safeContract = new ethers.Contract(_consoleAddress, SafeABI, _ownerEoa);
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
      signature,
    ]),
  });
  await tx.wait(2);

  return tx.hash;
};
