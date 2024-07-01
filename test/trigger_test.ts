import { assertEquals } from "jsr:@std/assert";

import { assets, price } from "../src/index.ts";
import { spawn_sub_agent } from "../src/agent.ts";

Deno.test("test trigger, subagent", async () => {
  const hasWorldWar3Started = await spawn_sub_agent(
    "Has World War 3 started?",
    "boolean",
  );

  assertEquals(hasWorldWar3Started, "FALSE");
});
