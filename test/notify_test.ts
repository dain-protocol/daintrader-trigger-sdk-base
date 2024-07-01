import { assertEquals } from "jsr:@std/assert";

import { sendNotification } from "../src/notifications.ts";

Deno.test("sendNotification", async () => {
  const val = await sendNotification("telegram", "Hi !! test-");

  // asset is treue

  assertEquals(val, true, "sendNotification failed");
});
