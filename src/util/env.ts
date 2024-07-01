export async function loadEnv(): Promise<(key: string) => string | undefined> {
  if (
    Deno.env.get("DEPLOYED") === "true"
  ) {
    return (key: string) => Deno.env.get(key);
  }

  const { loadSync } = await import(
    "https://deno.land/std@0.224.0/dotenv/mod.ts"
  );

  const env = loadSync();

  return (key: string) => env[key];
}
