import { ethers } from "npm:ethers";
import { loadEnv } from "./env.ts";

const env = await loadEnv();
const triggerAddress = env("TRIGGER_ADDRESS");
const triggerPrivateKey = env("TRIGGER_ADDRESS_PRIVATE_KEY");

const wallet = new ethers.Wallet(triggerPrivateKey as string);

async function signData(data: Object): Promise<string> {
  const message = JSON.stringify(data);
  return wallet.signMessage(message);
}

export default async function fetcher<T>(
  input: RequestInfo,
  init: RequestInit
): Promise<T & { reqSuccess: boolean }> {
  try {
    const body = init?.body ? init.body : "{}";
    const pathname_and_query = new URL(input as string).pathname +
      (new URL(input as string).search || "");
    
    const toSign = {
      body,
      method: init?.method || "POST",
      url: pathname_and_query,
      date: new Date().toISOString(),
      nonce: ethers.hexlify(ethers.randomBytes(32)),
    };
    
    const signature = await signData(toSign);
    
    const response = await fetch(input, {
      ...init,
      method: init?.method || "POST",
      body: init?.body ? init.body : (
        init?.method === "GET" ? undefined : JSON.stringify({})
      ),
      headers: {
        ...init?.headers,
        "Content-Type": "application/json",
        "x-signature": signature,
        "x-date": toSign.date,
        "x-nonce": toSign.nonce,
        "x-trigger-address": triggerAddress as string,
        "x-chain-id": "evm-base-mainnet",
      },
    });
    
    const json = await response.json();
    return {
      ...json,
      reqSuccess: true,
    } as T & { reqSuccess: boolean };
  } catch (e) {
    console.error(e);
    return { reqSuccess: false } as T & { reqSuccess: boolean };
  }
}