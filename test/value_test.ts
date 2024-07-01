import { assertEquals } from "jsr:@std/assert";

import { getValue, setValue } from "../src/value.ts";

const key = "testKey";
const value = "testValue";
Deno.test("setValue", async () => {
  const val = await setValue(key, value);
  assertEquals(value, val, "setValue failed");
});

Deno.test("getValue", async () => {
  const val = await getValue(key);
  assertEquals(value, val, "getValue failed");
});
