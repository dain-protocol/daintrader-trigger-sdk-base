import { assertEquals } from "jsr:@std/assert";

import { assets, price } from "../src/data.ts";

import { sendEth, sendToken, swap } from "../src/transaction.ts";

Deno.test("sendEth", async () => {
  const tx = await sendEth(
    "0x4F83307866499F19309b1800c087fE27f52D1A21",
    0.000001
  );
  assertEquals(typeof tx, "string");

  console.log("SENDETH TEST TX: ", tx);
});

Deno.test("swapToken", async () => {
  const tx = await swap(
    "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",

    "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    0.000001,
    100
  );
  assertEquals(typeof tx, "string");
});

Deno.test("sendToken", async () => {
  const tx = await sendToken(
    "0xC47FDd93E758c4F1Ef22E76E62C161F971afB326",
    "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    0.002
  );
  assertEquals(typeof tx, "string");
});
