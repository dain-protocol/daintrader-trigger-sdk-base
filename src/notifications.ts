import { loadEnv } from "./util/env.ts";
import fetcher from "./util/signFetch.ts";
const env = await loadEnv();
const triggerAddress = env("TRIGGER_ADDRESS");

export async function sendNotification(
  platform: string,
  message: string,
): Promise<any> {
  const url = `${env("API_URL")}/autonomy-sdk-api/common/sendNotification`;
  const response = await fetcher<{
    success: boolean;
  }>(url, {
    method: "POST",
    body: JSON.stringify({
      platform,
      message,
    }),
  });

  if (!response.success) throw new Error("Failed to Send Notification");
  return true;
}
