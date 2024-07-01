import sendTX from "./util/sendTx.ts";
import fetcher from "./util/signFetch.ts";
import { loadEnv } from "./util/env.ts";
import { privateKeyToAccount } from "npm:viem/accounts";

const env = await loadEnv();
const triggerPrivateKey = env("TRIGGER_ADDRESS_PRIVATE_KEY");
const triggerAddress = env("TRIGGER_ADDRESS");
const triggerAccount = privateKeyToAccount(triggerPrivateKey as `0x${string}`);

export async function swap(
  fromToken: string,
  toToken: string,
  amount: number,
  slippageBps: number
): Promise<string | undefined> {
  const { approve } = await getApproval(
    fromToken,
    toToken,
    amount,
    slippageBps
  );
  if (!approve.isApproved) {
    const { request } = await createApproveTx(
      fromToken,
      approve.target,
      amount
    );
    const maxPriorityFeePerGas = BigInt(request.maxPriorityFeePerGas);
    const maxFeePerGas = BigInt(request.maxFeePerGas);
    const gas = BigInt(request.gas);
    let prepare_tx_request = {
      ...request,
      gas,
      maxPriorityFeePerGas,
      maxFeePerGas,
    };
    await execute(prepare_tx_request);
  }
  const { request } = await createSwapTx(
    fromToken,
    toToken,
    amount,
    slippageBps
  );
  const value = BigInt(request.value);
  const gasPrice = BigInt(request.gasPrice);
  const gasLimit = BigInt(request.gasLimit);
  const gas = BigInt(request.gas);
  let prepare_tx_request = { ...request, value, gasPrice, gasLimit, gas };
  return execute(prepare_tx_request);
}

async function createSwapTx(
  fromToken: string,
  toToken: string,
  amount: number,
  slippageBps: number
): Promise<{ approve: any; request: any }> {
  const url = `${env("API_URL")}/autonomy-sdk-api/base/tx/swap`;
  const { success, request, approve } = await fetcher<{
    success: boolean;
    request: any;
    approve: any;
  }>(url, {
    body: JSON.stringify({
      fromToken,
      toToken,
      amount,
      slippageBps,
      triggerAddress,
    }),
  });

  if (!success) throw new Error("Failed to fetch tx swap");

  return { approve, request };
}

async function getApproval(
  fromToken: string,
  toToken: string,
  amount: number,
  slippageBps: number
): Promise<{ approve: any }> {
  const url = `${env("API_URL")}/autonomy-sdk-api/base/tx/getApproval`;
  const { success, approve } = await fetcher<{
    success: boolean;
    approve: any;
  }>(url, {
    body: JSON.stringify({
      fromToken,
      toToken,
      amount,
      slippageBps,
      triggerAddress,
    }),
  });

  if (!success) throw new Error("Failed to fetch getApproval tx");

  return { approve };
}

async function createApproveTx(
  token: string,
  spender: string,
  amount: number
): Promise<{ approve_tx_request: any; request: any }> {
  const url = `${env("API_URL")}/autonomy-sdk-api/base/tx/approve`;
  const { success, request, approve_tx_request } = await fetcher<{
    success: boolean;
    request: any;
    approve_tx_request: any;
  }>(url, {
    body: JSON.stringify({
      token,
      triggerAddress,
      spender,
      amount,
    }),
  });

  if (!success) throw new Error("Failed to fetch tx approve");

  return { approve_tx_request, request };
}

export async function sendToken(
  to: string,
  token: string,
  amount: number
): Promise<string | undefined> {
  const request = await createSendTokenTx(to, token, amount);
  const maxPriorityFeePerGas = BigInt(request.maxPriorityFeePerGas);
  const maxFeePerGas = BigInt(request.maxFeePerGas);
  const gas = BigInt(request.gas);
  let prepare_tx_request = {
    ...request,
    maxFeePerGas,
    maxPriorityFeePerGas,
    gas,
  };
  return execute(prepare_tx_request);
}

async function createSendTokenTx(
  to: string,
  token: string,
  amount: number
): Promise<any> {
  const url = `${env("API_URL")}/autonomy-sdk-api/base/tx/sendToken`;

  const { success, request } = await fetcher<{
    success: boolean;
    request: any;
  }>(url, {
    body: JSON.stringify({
      to,
      token,
      amount,
      triggerAddress,
    }),
  });

  if (!success) throw new Error("Failed to fetch tx sendToken");

  return request;
}

export async function sendEth(
  to: string,
  amount: number
): Promise<string | undefined> {
  const request = await createSendEthTx(to, amount);
  const value = BigInt(request.value);
  const maxPriorityFeePerGas = BigInt(request.maxPriorityFeePerGas);
  const maxFeePerGas = BigInt(request.maxFeePerGas);
  const gas = BigInt(request.gas);
  let prepare_tx_request = {
    ...request,
    value,
    maxFeePerGas,
    maxPriorityFeePerGas,
    gas,
  };
  return execute(prepare_tx_request);
}

async function createSendEthTx(to: string, amount: number): Promise<any> {
  const url = `${env("API_URL")}/autonomy-sdk-api/base/tx/sendEth`;
  const { request, success } = await fetcher<{
    request: any;
    success: boolean;
  }>(url, {
    body: JSON.stringify({
      to,
      amount,
      triggerAddress,
    }),
  });

  if (!success) throw new Error("Failed to fetch tx sendEth");

  return request;
}

async function execute(request: any) {
  const signTx = await triggerAccount.signTransaction(request);
  const sent = await sendTX(signTx);
  if (sent.success) {
    console.log("Sent transaction", sent.signature);
    return sent.signature;
  } else throw new Error("Failed to send transaction");
}
