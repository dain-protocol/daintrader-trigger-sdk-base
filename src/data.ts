import { loadEnv } from "./util/env.ts";
import fetcher from "./util/signFetch.ts";
const env = await loadEnv();
const triggerAddress = env("TRIGGER_ADDRESS");

export async function price(token: string): Promise<number> {
  const url = `${env(
    "API_URL"
  )}/autonomy-sdk-api/base/price?token=${token}&triggerAddress=${triggerAddress}`;
  const response = await fetcher<{
    price: number;
    success: boolean;
  }>(url, {
    method: "GET",
  });

  if (!response.success) throw new Error("Failed to fetch price");
  return response.price;
}
export async function tokenStat(
  token: string,
  statistic: string
): Promise<number> {
  const url = `${env(
    "API_URL"
  )}/autonomy-sdk-api/base/token-stat?token=${token}&triggerAddress=${triggerAddress}&stat=${statistic}`;
  const response = await fetcher<{
    statistic: number;
    success: boolean;
  }>(url, {
    method: "GET",
  });

  if (!response.success) throw new Error("Failed to fetch statistic");
  return response.statistic;
}

export interface EVMWalletAssets {
  tokens: Array<{
    balance: string;
    balanceInUSD: number;
    price_per_token: number;
    name: string;
    symbol: string;
    token: {
      address: string;
      decimals: number;
      image: string;
    };
  }>;
  nfts: Array<{
    name: string;
    symbol: string;
    mint: string;
    image: string;
  }>;
  eth: {
    balance: number;
    balanceInUSD: number;
  };
  total_in_usd: number;
}

export async function assets(address?: string): Promise<EVMWalletAssets> {
  if (!address) address = env("TRIGGER_ADDRESS") as string;
  const url = `${env(
    "API_URL"
  )}/autonomy-sdk-api/base/assets?address=${address}`;
  const response = await fetcher<{
    success: boolean;
    assets: EVMWalletAssets;
  }>(url, {
    method: "GET",
  });
  if (!response.success) throw new Error("Failed to fetch assets");
  return response.assets;
}
