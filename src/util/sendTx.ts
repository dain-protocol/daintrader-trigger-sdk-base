import { loadEnv } from "./env.ts";
import fetcher from "./signFetch.ts";

export default async function sendTX(serializedTx: string): Promise<{
  success: boolean;
  signature?: string;
  error?: string;
}> {
  const env = await loadEnv();
  const url = env("TX_SENDER_URL") as string;
  try {
    const { success, signature } = await fetcher<{
      success: boolean;
      signature?: string;
    }>(url, {
      body: JSON.stringify({
        tx: serializedTx,
      }),
    });

    return { success: true, signature, error: "Successfully sent Transaction" };
  } catch (error) {
    console.log("Error sending transaction", error);
    return {
      success: false,
      signature: "",
      error: "Error sending transaction to tx spammer",
    };
  }
}
