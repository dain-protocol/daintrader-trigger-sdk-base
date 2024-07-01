import { assertEquals } from "jsr:@std/assert";

import { assets, price } from "../src/data.ts";
import { tokenStat } from "../src/index.ts";

Deno.test("price", async () => {
  const ethPrice = await price('0x4200000000000000000000000000000000000006');

  console.log("TEST ETH PRICE: ", ethPrice);
  assertEquals(typeof ethPrice, "number");
  assertEquals(ethPrice > 0, true);
});

Deno.test("assets", async () => {
  const walletAssets = await assets(
    "0x11ce86f18BEed5e2CdC4F0925508f93D070A003B",
  );

  console.log("TEST WALLET ASSETS: ", walletAssets);
  assertEquals(typeof walletAssets.total_in_usd, "number");
  assertEquals(walletAssets.total_in_usd > 0, true);

  assertEquals(Array.isArray(walletAssets.tokens), true);

  const token = walletAssets.tokens[0];

  assertEquals(typeof token.balance, "number");

  assertEquals(typeof token.balanceInUSD, "number");

  assertEquals(typeof token.price_per_token, "number");

  assertEquals(typeof token.symbol, "string");

  assertEquals(typeof token.name, "string");

  assertEquals(typeof token.token.address, "string");

  assertEquals(typeof token.token.decimals, "number");

  assertEquals(typeof token.token.image, "string");

  assertEquals(Array.isArray(walletAssets.nfts), true);

  // const nft = walletAssets.nfts[0];

  // assertEquals(typeof nft.name, "string");

  // assertEquals(typeof nft.symbol, "string");

  // assertEquals(typeof nft.mint, "string");

  // assertEquals(typeof nft.image, "string");

  const eth = walletAssets.eth;

  assertEquals(typeof eth.balance, "number");

  assertEquals(typeof eth.balanceInUSD, "number");
});
Deno.test("tokenStat", async () => {
  const tokenStatistic = await tokenStat("0x4200000000000000000000000000000000000006", "tradeHistory4h");

  console.log("TEST TOKEN STAT: ", tokenStatistic);

  assertEquals(typeof tokenStatistic, "number");
  assertEquals(tokenStatistic > 0, true);

});
