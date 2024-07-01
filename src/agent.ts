import { loadEnv } from "./util/env.ts";
import fetcher from "./util/signFetch.ts";
const env = await loadEnv();
const triggerAddress = env("TRIGGER_ADDRESS");

/*Spawns a sub ai agent that can search the web, and find any information you need.
response is ALWAYS a string, but you can ask for a "boolean" or "number" or "string" and convert it to that type in your code.
booleans will always be in "TRUE" or "FALSE" format. numbers will always be in "123" format. strings will always be in "hello" format.
*/

export async function spawn_sub_agent(
  query: string,
  responseType: string,
): Promise<string> {
  const url = `${env("SUB_AGENT_API_URL")}`;
  const response = await fetcher<{
    success: boolean;
    result: string;
  }>(url, {
    method: "POST",
    body: JSON.stringify({
      query,
      responseType,
    }),
  });

  if (!response.success) throw new Error("Failed to Spawn Sub Agent");
  return response.result.toUpperCase();
}
