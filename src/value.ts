import { loadEnv } from "./util/env.ts";
import fetcher from "./util/signFetch.ts";
const env = await loadEnv();
const triggerAddress = env("TRIGGER_ADDRESS");

export async function setValue(key: string, value: any): Promise<any> {
  const url = `${env("API_URL")}/autonomy-sdk-api/common/setValue`;
  const response = await fetcher<{
    value: any;
    success: boolean;
  }>(url, {
    method: "POST",
    body: JSON.stringify({
      key,
      value,
    }),
  });

  if (!response.success) throw new Error("Failed to Set Value");
  return response.value;
}

export async function getValue(key: string): Promise<any> {
  const url = `${env("API_URL")}/autonomy-sdk-api/common/getValue`;
  const response = await fetcher<{
    value: any;
    success: boolean;
  }>(url, {
    method: "POST",
    body: JSON.stringify({
      key,
    }),
  });

  if (!response.success) throw new Error("Failed to fetch value");
  return response.value;
}
