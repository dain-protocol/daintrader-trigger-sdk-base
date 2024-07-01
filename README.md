# DAINTRADER Autonomous Trading Agents

Introducing Autonomous Trading Agents for the Base blockchain! Our platform allows you to create powerful trading agents that automatically execute trades and manage your portfolio on the Base blockchain, which is EVM compatible.

## How It Works

1. **Create an Agent**: Start by creating a new trading agent on our platform.
2. **Deposit Funds**: Deposit ETH or supported tokens into your agent's wallet. Only these deposited funds will be used for trading.
3. **Define Trading Strategies**: Write custom trading scripts using our provided functions to define your trading strategies.
4. **Schedule Execution**: Schedule your scripts to run automatically at specific intervals using cron jobs. Our platform handles the execution based on your cron schedule.
5. **Automatic Trading**: Your agent will automatically execute trades and manage your portfolio according to your defined strategies.
6. **Withdraw or Close**: Withdraw your funds or close your agent at any time. Closing the agent will automatically redeposit all remaining funds back to your main wallet.

Get started now and unleash the power of autonomous trading on the Base blockchain!

## License

This project is open source but fully proprietary. Contributions are welcome and will be licensed under the same terms.

**Disclaimer:** The software is provided "as is", without any warranty.

**Usage:** Only for triggers on `daintrader.com`. All rights reserved by Dain, Inc.

For more information, visit [daintrader.com](https://daintrader.com).

## Helpful

The WETH address on base is `0x4200000000000000000000000000000000000006`

# Example Scripts

No need to import any libraries when using it in your bots! Make sure to await any async functions. If you do not await all of the async properties of your script, then it will close out and your script will not fully execute.

**Dynamic Token Rebalancing**

```typescript
const desiredAllocation = {
  "0x1ceA84203673764244E05693e42E6Ace62bE9BA5": 0.5, // WBTC
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913": 0.3, // USDC
  "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee": 0.2  // ETH (native token)
};

const usdcAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const minEthForFees = 0.001; // Minimum ETH balance required for fees
const rebalanceThreshold = 0.05; // 5% threshold for rebalancing

async function rebalancePortfolio() {
  try {
    const walletAssets = await assets();
    const ethBalance = walletAssets.eth.balance;
    if (ethBalance < minEthForFees) {
      log(`Insufficient ETH balance for fees. Required: ${minEthForFees} ETH, Available: ${ethBalance.toFixed(18)} ETH`);
      return;
    }

    const totalBalanceUSD = walletAssets.total_in_usd;
    log(`Total portfolio value: $${totalBalanceUSD.toFixed(2)}`);

    for (const [tokenAddress, targetAllocation] of Object.entries(desiredAllocation)) {
      const token = walletAssets.tokens.find(t => t.token.address.toLowerCase() === tokenAddress.toLowerCase()) ||
        (tokenAddress === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" ? { balanceInUSD: walletAssets.eth.balanceInUSD, symbol: "ETH" } : null);

      if (!token) {
        log(`Token ${tokenAddress} not found in wallet. Skipping.`);
        continue;
      }

      const currentAllocation = token.balanceInUSD / totalBalanceUSD;
      const targetBalanceUSD = totalBalanceUSD * targetAllocation;
      const diffUSD = targetBalanceUSD - token.balanceInUSD;
      const diffPercentage = Math.abs(diffUSD / targetBalanceUSD);

      log(`${token.symbol}: Current allocation: ${(currentAllocation * 100).toFixed(2)}%, Target: ${(targetAllocation * 100).toFixed(2)}%`);

      if (diffPercentage > rebalanceThreshold) {
        if (diffUSD > 0) {
          // Need to buy more of this token
          const usdcToken = walletAssets.tokens.find(t => t.token.address.toLowerCase() === usdcAddress.toLowerCase());
          if (!usdcToken || usdcToken.balanceInUSD < diffUSD) {
            log(`Insufficient USDC balance to buy ${token.symbol}. Skipping.`);
            continue;
          }
          const amountToBuy = diffUSD / token.price_per_token;
          const txSignature = await swap(usdcAddress, tokenAddress, amountToBuy, 50);
          log(`Bought ${amountToBuy.toFixed(6)} ${token.symbol} worth $${diffUSD.toFixed(2)}. Transaction: ${txSignature}`);
        } else {
          // Need to sell some of this token
          const amountToSell = Math.abs(diffUSD) / token.price_per_token;
          const txSignature = await swap(tokenAddress, usdcAddress, amountToSell, 50);
          log(`Sold ${amountToSell.toFixed(6)} ${token.symbol} worth $${Math.abs(diffUSD).toFixed(2)}. Transaction: ${txSignature}`);
        }
      } else {
        log(`${token.symbol} is within the rebalance threshold. No action needed.`);
      }
    }

    log("Portfolio rebalancing completed.");

    // Log updated balances
    const updatedAssets = await assets();
    log("Updated portfolio balances:");
    for (const token of updatedAssets.tokens) {
      log(`${token.symbol}: ${token.balance} (${token.balanceInUSD.toFixed(2)} USD)`);
    }
    log(`ETH: ${updatedAssets.eth.balance.toFixed(18)} (${updatedAssets.eth.balanceInUSD.toFixed(2)} USD)`);
    log(`Total portfolio value: $${updatedAssets.total_in_usd.toFixed(2)}`);
  } catch (error) {
    log(`An error occurred during rebalancing: ${error}`);
  }
}

await rebalancePortfolio();
```

Cron Schedule: `0 0 * * *`

### Example of Volume-Based Trading Strategy

Cron Schedule: `0 0 * * *`

**Volume-Based Trading Strategy**

```typescript
const ethAddress = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"; // ETH (native token)
const usdcAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC
const highVolumeThreshold = 1000000; // 24-hour volume in USD (e.g., 1 million)
const lowVolumeThreshold = 500000;  // 24-hour volume in USD (e.g., 500,000)
const tradeAmount = 10; // Amount in USDC to trade
const minEthForFees = 0.001; // Minimum ETH balance required for fees

async function placeVolumeBasedOrder() {
  try {
    // Check ETH balance for fees
    const walletAssets = await assets();
    const ethBalance = walletAssets.eth.balance;
    if (ethBalance < minEthForFees) {
      log(`Insufficient ETH balance for fees. Required: ${minEthForFees} ETH, Available: ${ethBalance.toFixed(18)} ETH`);
      return;
    }

    // Get 24-hour volume
    const volume24hUSD: number = await tokenStat(ethAddress, "v24hUSD");
    log(`Current 24-hour trading volume for ETH: $${volume24hUSD.toFixed(2)}`);

    // Get current ETH price
    const currentPrice = await price(ethAddress);
    log(`Current ETH price: $${currentPrice.toFixed(2)}`);

    if (volume24hUSD >= highVolumeThreshold) {
      // High volume: Buy ETH
      const usdcBalance = walletAssets.tokens.find(t => t.token.address.toLowerCase() === usdcAddress.toLowerCase())?.balance || 0;
      if (parseFloat(usdcBalance) < tradeAmount) {
        log(`Insufficient USDC balance. Required: ${tradeAmount} USDC, Available: ${usdcBalance} USDC`);
        return;
      }
      const txSignature = await swap(usdcAddress, ethAddress, tradeAmount, 50);
      log(`High volume detected. Bought ETH with ${tradeAmount} USDC. Transaction: ${txSignature}`);
    } else if (volume24hUSD <= lowVolumeThreshold) {
      // Low volume: Sell ETH
      const ethToSell = tradeAmount / currentPrice;
      if (ethBalance < ethToSell + minEthForFees) {
        log(`Insufficient ETH balance. Required: ${ethToSell.toFixed(18)} ETH (plus fees), Available: ${ethBalance.toFixed(18)} ETH`);
        return;
      }
      const txSignature = await swap(ethAddress, usdcAddress, ethToSell, 50);
      log(`Low volume detected. Sold ${ethToSell.toFixed(18)} ETH. Transaction: ${txSignature}`);
    } else {
      log(`Current volume is between thresholds. No action taken.`);
    }

    // Log updated balances
    const updatedAssets = await assets();
    const updatedEthBalance = updatedAssets.eth.balance;
    const updatedUsdcBalance = updatedAssets.tokens.find(t => t.token.address.toLowerCase() === usdcAddress.toLowerCase())?.balance || "0";
    log(`Updated ETH balance: ${updatedEthBalance.toFixed(18)} ETH`);
    log(`Updated USDC balance: ${updatedUsdcBalance} USDC`);
  } catch (error) {
    log(`An error occurred: ${error}`);
  }
}

await placeVolumeBasedOrder();
```

**Price-Based Limit Orders**

```typescript
const ethAddress = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"; // ETH (native token)
const usdcAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC
const targetPrice = 2000; // Target price to sell ETH
const stopLossPrice = 1800; // Stop-loss price to sell ETH
const percentToSell = 0.5; // Sell 50% of ETH balance when conditions are met

async function placeLimitOrder() {
  // Get current wallet assets
  const walletAssets = await assets();

  // Check ETH balance
  const ethBalance = walletAssets.eth.balance;
  if (ethBalance <= 0) {
    log("Insufficient ETH balance. No ETH available to sell.");
    return;
  }

  // Calculate amount of ETH to sell
  const ethToSell = ethBalance * percentToSell;

  // Get current ETH price
  const currentPrice: number = await price(ethAddress);

  if (currentPrice >= targetPrice) {
    // Place a sell order when the target price is reached
    try {
      const txSignature = await swap(ethAddress, usdcAddress, ethToSell, 50);
      log(`Target price reached. Sold ${ethToSell.toFixed(18)} ETH at price: $${currentPrice.toFixed(2)}. Transaction: ${txSignature}`);
    } catch (error) {
      log(`Failed to execute sell order at target price: ${error}`);
    }
  } else if (currentPrice <= stopLossPrice) {
    // Place a sell order when the stop-loss price is reached
    try {
      const txSignature = await swap(ethAddress, usdcAddress, ethToSell, 50);
      log(`Stop-loss triggered. Sold ${ethToSell.toFixed(18)} ETH at price: $${currentPrice.toFixed(2)}. Transaction: ${txSignature}`);
    } catch (error) {
      log(`Failed to execute stop-loss order: ${error}`);
    }
  } else {
    log(`Current ETH price: $${currentPrice.toFixed(2)}. No action taken.`);
  }

  // Log updated ETH balance
  const updatedAssets = await assets();
  const updatedEthBalance = updatedAssets.eth.balance;
  log(`Updated ETH balance: ${updatedEthBalance.toFixed(18)} ETH`);
}

await placeLimitOrder();
```

Cron Schedule: `*/30 * * * *`

**Dollar-Cost Averaging (DCA)**

```typescript
// Swap $1 of ETH into WBTC
// Swap $1 of USDC into WBTC
const wbtcAddress = "0x1ceA84203673764244E05693e42E6Ace62bE9BA5"; // WBTC
const usdcAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC
const ethAddress = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"; // ETH (native token)
const usdAmount = 1; // Amount in USD to invest
const minEthForFees = 0.001; // Minimum ETH balance required for fees

async function dcaInvestment() {
  // Get current wallet assets
  const walletAssets = await assets();

  // Check ETH balance
  const ethBalance = walletAssets.eth.balance;
  if (ethBalance < minEthForFees) {
    log(`Insufficient ETH balance for fees. Required: ${minEthForFees} ETH, Available: ${ethBalance.toFixed(18)} ETH`);
    return;
  }

  // Check USDC balance
  const usdcBalance = walletAssets.tokens.find(t => t.token.address.toLowerCase() === usdcAddress.toLowerCase())?.balance || "0";
  if (parseFloat(usdcBalance) < usdAmount) {
    log(`Insufficient USDC balance. Required: ${usdAmount} USDC, Available: ${usdcBalance} USDC`);
    return;
  }

  // Swap USDC for WBTC
  try {
    const txSignature = await swap(usdcAddress, wbtcAddress, usdAmount, 50);
    log(`Swapped ${usdAmount} USDC to WBTC. Transaction: ${txSignature}`);
  } catch (error) {
    log(`Failed to swap USDC to WBTC: ${error}`);
  }

  // Swap ETH for WBTC
  try {
    const ethPrice = await price(ethAddress);
    const ethAmount = usdAmount / ethPrice;
    const txSignature = await swap(ethAddress, wbtcAddress, ethAmount, 50);
    log(`Swapped ${ethAmount.toFixed(18)} ETH to WBTC. Transaction: ${txSignature}`);
  } catch (error) {
    log(`Failed to swap ETH to WBTC: ${error}`);
  }

  // Get current WBTC price for logging
  ```typescript
  // Get current WBTC price for logging
  const wbtcPrice = await price(wbtcAddress);
  log(`Current WBTC price: $${wbtcPrice.toFixed(2)}`);

  // Log the updated WBTC balance
  const updatedAssets = await assets();
  const wbtcBalance = updatedAssets.tokens.find(t => t.token.address.toLowerCase() === wbtcAddress.toLowerCase())?.balance || "0";
  log(`Current WBTC balance: ${wbtcBalance} WBTC`);
}

await dcaInvestment();
```

Cron Schedule: `0 9 * * 1`

### Price alert system with notifications

```typescript
const ethAddress = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"; // ETH (native token)
const highPriceThreshold = 2000; // Alert if price goes above $2000
const lowPriceThreshold = 1500; // Alert if price goes below $1500
const notificationPlatform = "telegram"; // Change this if using a different platform

async function checkPriceAndNotify() {
  try {
    // Get the current price of ETH
    const currentPrice = await price(ethAddress);
    log(`Current ETH price: $${currentPrice.toFixed(2)}`);

    // Get the last notified state
    const lastNotifiedHigh = await getValue("lastNotifiedHigh") === "true";
    const lastNotifiedLow = await getValue("lastNotifiedLow") === "true";

    if (currentPrice > highPriceThreshold && !lastNotifiedHigh) {
      // Price is above the high threshold and we haven't notified about this yet
      const message = `🚀 ETH price alert: The price has risen above $${highPriceThreshold}! Current price: $${currentPrice.toFixed(2)}`;
      const notificationSent = await sendNotification(notificationPlatform, message);
      if (notificationSent) {
        log("High price notification sent successfully.");
        await setValue("lastNotifiedHigh", "true");
        await setValue("lastNotifiedLow", "false");
      } else {
        log("Failed to send high price notification.");
      }
    } else if (currentPrice < lowPriceThreshold && !lastNotifiedLow) {
      // Price is below the low threshold and we haven't notified about this yet
      const message = `📉 ETH price alert: The price has fallen below $${lowPriceThreshold}! Current price: $${currentPrice.toFixed(2)}`;
      const notificationSent = await sendNotification(notificationPlatform, message);
      if (notificationSent) {
        log("Low price notification sent successfully.");
        await setValue("lastNotifiedLow", "true");
        await setValue("lastNotifiedHigh", "false");
      } else {
        log("Failed to send low price notification.");
      }
    } else if (currentPrice <= highPriceThreshold && currentPrice >= lowPriceThreshold) {
      // Price is between thresholds, reset notification states
      await setValue("lastNotifiedHigh", "false");
      await setValue("lastNotifiedLow", "false");
      log("Price is within normal range. Notification states reset.");
    }
  } catch (error) {
    log(`An error occurred while checking price and sending notifications: ${error}`);
  }
}

await checkPriceAndNotify();
```

### Daily Bitcoin Market Summary Script

This script demonstrates how to create a daily Bitcoin market summary using DAINTRADER Autonomous Trading Agents. It combines on-chain data with web-sourced news to provide a comprehensive market overview.

```typescript
async function dailyBitcoinSummary() {
  // Bitcoin WBTC token address on Base
  const bitcoinAddress = "0x1ceA84203673764244E05693e42E6Ace62bE9BA5";

  // Gather Bitcoin stats
  const currentPrice = await price(bitcoinAddress);
  const priceChange24h = await tokenStat(bitcoinAddress, "priceChange24hPercent");
  const volume24h = await tokenStat(bitcoinAddress, "v24hUSD");

  // Create a query for the sub agent, including the stats
  const query = `Please search the web for a daily summary on Bitcoin news and return 3 sentences for a daily user briefing on the state of the market. Include these stats in your summary: Current price: $${currentPrice.toFixed(2)}, 24h price change: ${priceChange24h.toFixed(2)}%, 24h trading volume: $${(volume24h / 1e6).toFixed(2)} million.`;

  // Spawn sub agent to get the market summary
  const marketSummary = await spawn_sub_agent(query, "string");

  // Compose the notification message
  const message = `Daily Bitcoin Market Summary:
Current Price: $${currentPrice.toFixed(2)}
24h Price Change: ${priceChange24h.toFixed(2)}%
24h Trading Volume: $${(volume24h / 1e6).toFixed(2)} million

${marketSummary}`;

  // Send the notification
  const notificationSent = await sendNotification("telegram", message);
  if (notificationSent) {
    log("Daily Bitcoin summary notification sent successfully.");
  } else {
    log("Failed to send daily Bitcoin summary notification.");
  }
}

// Execute the function
await dailyBitcoinSummary();
```

cron schedule: 0 9 * * *

# Webhook Triggers

In addition to scheduling scripts using cron jobs, you can also trigger your trading scripts by sending a webhook request to your agent's unique webhook URL. When a script is triggered via a webhook, the body of the webhook request is passed to the script through the `webhookBody` variable.

The `webhookBody` variable will contain the parsed body of the webhook request. You can access and utilize this data to make decisions or perform specific actions in your trading script.

Here's an example of how to use the `webhookBody` in your script:

```typescript
const ethAddress = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"; // ETH (native token)
const usdcAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC
const minEthForFees = 0.001; // Minimum ETH balance required for fees

interface WebhookPayload {
  action: "buy" | "sell";
  amount: number;
  token?: string;
}

async function handleWebhook() {
  try {
    if (!webhookBody) {
      log("No webhook body found. Exiting.");
      return;
    }

    const payload = webhookBody as WebhookPayload;
    log(`Received webhook payload: ${JSON.stringify(payload)}`);

    if (!payload.action || !payload.amount) {
      log("Invalid webhook payload. Missing action or amount.");
      return;
    }

    const walletAssets = await assets();
    const ethBalance = walletAssets.eth.balance;
    if (ethBalance < minEthForFees) {
      log(`Insufficient ETH balance for fees. Required: ${minEthForFees} ETH, Available: ${ethBalance.toFixed(18)} ETH`);
      return;
    }

    const tokenAddress = payload.token || ethAddress; // Default to ETH if no token specified
    const tokenSymbol = tokenAddress === ethAddress ? "ETH" : (walletAssets.tokens.find(t => t.token.address.toLowerCase() === tokenAddress.toLowerCase())?.symbol || "Unknown");

    if (payload.action === "buy") {
      // Check USDC balance
      const usdcToken = walletAssets.tokens.find(t => t.token.address.toLowerCase() === usdcAddress.toLowerCase());
      if (!usdcToken || parseFloat(usdcToken.balance) < payload.amount) {
        log(`Insufficient USDC balance. Required: ${payload.amount} USDC, Available: ${usdcToken ? usdcToken.balance : 0} USDC`);
        return;
      }

      try {
        const txSignature = await swap(usdcAddress, tokenAddress, payload.amount, 50);
        log(`Bought ${tokenSymbol} with ${payload.amount} USDC. Transaction: ${txSignature}`);
      } catch (swapError) {
        log(`Failed to execute buy order: ${swapError}`);
      }
    } else if (payload.action === "sell") {
      let amountToSell: number;
      if (tokenAddress === ethAddress) {
        if (ethBalance - minEthForFees < payload.amount) {
          log(`Insufficient ETH balance. Required: ${payload.amount} ETH (plus fees), Available: ${(ethBalance - minEthForFees).toFixed(18)} ETH`);
          return;
        }
        amountToSell = payload.amount;
      } else {
        const tokenBalance = walletAssets.tokens.find(t => t.token.address.toLowerCase() === tokenAddress.toLowerCase())?.balance;
        if (!tokenBalance || parseFloat(tokenBalance) < payload.amount) {
          log(`Insufficient ${tokenSymbol} balance. Required: ${payload.amount}, Available: ${tokenBalance || 0}`);
          return;
        }
        amountToSell = payload.amount;
      }

      try {
        const txSignature = await swap(tokenAddress, usdcAddress, amountToSell, 50);
        log(`Sold ${amountToSell} ${tokenSymbol} for USDC. Transaction: ${txSignature}`);
      } catch (swapError) {
        log(`Failed to execute sell order: ${swapError}`);
      }
    } else {
      log(`Invalid action: ${payload.action}. Supported actions are 'buy' and 'sell'.`);
      return;
    }

    // Log updated balances
    const updatedAssets = await assets();
    log("Updated balances:");
    log(`ETH: ${updatedAssets.eth.balance.toFixed(18)} ETH`);
    log(`USDC: ${updatedAssets.tokens.find(t => t.token.address.toLowerCase() === usdcAddress.toLowerCase())?.balance || 0} USDC`);
    if (tokenAddress !== ethAddress && tokenAddress !== usdcAddress) {
      log(`${tokenSymbol}: ${updatedAssets.tokens.find(t => t.token.address.toLowerCase() === tokenAddress.toLowerCase())?.balance || 0} ${tokenSymbol}`);
    }
  } catch (error) {
    log(`An error occurred while handling the webhook: ${error}`);
  }
}

await handleWebhook();
```

# Functions

### `price(token: string): Promise<number>`

Fetches the price of a given token.
- `token`: The address of the token e.g. "0x1ceA84203673764244E05693e42E6Ace62bE9BA5"
- Returns a promise that resolves to the price of the token as a number.

### `tokenStat(token: string, statistic: string): Promise<number>`

Fetches a specific statistic for a given token.
- `token`: The address of the token (e.g., "0x1ceA84203673764244E05693e42E6Ace62bE9BA5").
- `statistic`: The specific statistic to fetch. Available options include:
  - `price`: Current price of the token in USD.
  - `liquidity`: Liquidity available for the token in the market.
  - `supply`: Total supply of the token.
  - `mc`: Market capitalization of the token.
  - `circulatingSupply`: Circulating supply of the token.
  - `realMc`: Real market capitalization of the token.
  - `v30mUSD`: 30 Minute USD Volume.
  - `v1hUSD`: 1 Hour USD Volume.
  - `v2hUSD`: 2 Hour USD Volume.
  - `v4hUSD`: 4 Hour USD Volume.
  - `v6hUSD`: 6 Hour USD Volume.
  - `v8hUSD`: 8 Hour USD Volume.
  - `v12hUSD`: 12 Hour USD Volume.
  - `v24hUSD`: 24 Hour USD Volume.
  - `v30mChangePercent`: 30 Minute Volume Change Percentage.
  - `v1hChangePercent`: 1 Hour Volume Change Percentage.
  - `v2hChangePercent`: 2 Hour Volume Change Percentage.
  - `v4hChangePercent`: 4 Hour Volume Change Percentage.
  - `v6hChangePercent`: 6 Hour Volume Change Percentage.
  - `v8hChangePercent`: 8 Hour Volume Change Percentage.
  - `v12hChangePercent`: 12 Hour Volume Change Percentage.
  - `v24hChangePercent`: 24 Hour Volume Change Percentage.
  - `priceChange30mPercent`: 30 Minute Price Change Percentage.
  - `priceChange1hPercent`: 1 Hour Price Change Percentage.
  - `priceChange2hPercent`: 2 Hour Price Change Percentage.
  - `priceChange4hPercent`: 4 Hour Price Change Percentage.
  - `priceChange6hPercent`: 6 Hour Price Change Percentage.
  - `priceChange8hPercent`: 8 Hour Price Change Percentage.
  - `priceChange12hPercent`: 12 Hour Price Change Percentage.
  - `priceChange24hPercent`: 24 Hour Price Change Percentage.
  - `uniqueWallet30m`: Unique Wallets Trading in the last 30 minutes.
  - `uniqueWallet1h`: Unique Wallets Trading in the last 1 hour.
  - `uniqueWallet2h`: Unique Wallets Trading in the last 2 hours.
  - `uniqueWallet4h`: Unique Wallets Trading in the last 4 hours.
  - `uniqueWallet6h`: Unique Wallets Trading in the last 6 hours.
  - `uniqueWallet8h`: Unique Wallets Trading in the last 8 hours.
  - `uniqueWallet12h`: Unique Wallets Trading in the last 12 hours.
  - `uniqueWallet24h`: Unique Wallets Trading in the last 24 hours.
  - `trade30m`: Number of trades in the last 30 minutes.
  - `trade1h`: Number of trades in the last 1 hour.
  - `trade2h`: Number of trades in the last 2 hours.
  - `trade4h`: Number of trades in the last 4 hours.
  - `trade8h`: Number of trades in the last 8 hours.
  - `trade24h`: Number of trades in the last 24 hours.
  - `buy30m`: Number of buy trades in the last 30 minutes.
  - `buy1h`: Number of buy trades in the last 1 hour.
  - `buy2h`: Number of buy trades in the last 2 hours.
  - `buy4h`: Number of buy trades in the last 4 hours.
  - `buy8h`: Number of buy trades in the last 8 hours.
  - `buy24h`: Number of buy trades in the last 24 hours.
  - `sell30m`: Number of sell trades in the last 30 minutes.
  - `sell1h`: Number of sell trades in the last 1 hour.
  - `sell2h`: Number of sell trades in the last 2 hours.
  - `sell4h`: Number of sell trades in the last 4 hours.
  - `sell8h`: Number of sell trades in the last 8 hours.
  - `sell24h`: Number of sell trades in the last 24
  - `sell24h`: Number of sell trades in the last 24 hours.
  - `vBuy30mUSD`: Buy volume in USD for the last 30 minutes.
  - `vBuy1hUSD`: Buy volume in USD for the last 1 hour.
  - `vBuy2hUSD`: Buy volume in USD for the last 2 hours.
  - `vBuy4hUSD`: Buy volume in USD for the last 4 hours.
  - `vBuy8hUSD`: Buy volume in USD for the last 8 hours.
  - `vBuy12hUSD`: Buy volume in USD for the last 12 hours.
  - `vBuy24hUSD`: Buy volume in USD for the last 24 hours.
  - `vSell30mUSD`: Sell volume in USD for the last 30 minutes.
  - `vSell1hUSD`: Sell volume in USD for the last 1 hour.
  - `vSell2hUSD`: Sell volume in USD for the last 2 hours.
  - `vSell4hUSD`: Sell volume in USD for the last 4 hours.
  - `vSell8hUSD`: Sell volume in USD for the last 8 hours.
  - `vSell12hUSD`: Sell volume in USD for the last 12 hours.
  - `vSell24hUSD`: Sell volume in USD for the last 24 hours.
  - `v30m`: 30 Minute Volume in token units.
  - `v1h`: 1 Hour Volume in token units.
  - `v2h`: 2 Hour Volume in token units.
  - `v4h`: 4 Hour Volume in token units.
  - `v8h`: 8 Hour Volume in token units.
  - `v12h`: 12 Hour Volume in token units.
  - `v24h`: 24 Hour Volume in token units.
  - `history30mPrice`: Price 30 minutes ago.
  - `history1hPrice`: Price 1 hour ago.
  - `history2hPrice`: Price 2 hours ago.
  - `history4hPrice`: Price 4 hours ago.
  - `history6hPrice`: Price 6 hours ago.
  - `history8hPrice`: Price 8 hours ago.
  - `history12hPrice`: Price 12 hours ago.
  - `history24hPrice`: Price 24 hours ago.
  - `uniqueWalletHistory30m`: Unique wallets trading in the last 30 minutes (historical).
  - `uniqueWalletHistory1h`: Unique wallets trading in the last 1 hour (historical).
  - `uniqueWalletHistory2h`: Unique wallets trading in the last 2 hours (historical).
  - `uniqueWalletHistory4h`: Unique wallets trading in the last 4 hours (historical).
  - `uniqueWalletHistory8h`: Unique wallets trading in the last 8 hours (historical).
  - `uniqueWalletHistory24h`: Unique wallets trading in the last 24 hours (historical).
  - `holder`: Number of unique holders of the token.
  - `uniqueWallet30mChangePercent`: Percent change in unique wallets trading in the last 30 minutes.
  - `uniqueWallet1hChangePercent`: Percent change in unique wallets trading in the last 1 hour.
  - `uniqueWallet2hChangePercent`: Percent change in unique wallets trading in the last 2 hours.
  - `uniqueWallet4hChangePercent`: Percent change in unique wallets trading in the last 4 hours.
  - `uniqueWallet8hChangePercent`: Percent change in unique wallets trading in the last 8 hours.
  - `uniqueWallet24hChangePercent`: Percent change in unique wallets trading in the last 24 hours.
  - `trade30mChangePercent`: Percent change in number of trades in the last 30 minutes.
  - `trade1hChangePercent`: Percent change in number of trades in the last 1 hour.
  - `trade2hChangePercent`: Percent change in number of trades in the last 2 hours.
  - `trade4hChangePercent`: Percent change in number of trades in the last 4 hours.
  - `trade8hChangePercent`: Percent change in number of trades in the last 8 hours.
  - `trade24hChangePercent`: Percent change in number of trades in the last 24 hours.
  - `buy30mChangePercent`: Percent change in number of buy trades in the last 30 minutes.
  - `buy1hChangePercent`: Percent change in number of buy trades in the last 1 hour.
  - `buy2hChangePercent`: Percent change in number of buy trades in the last 2 hours.
  - `buy4hChangePercent`: Percent change in number of buy trades in the last 4 hours.
  - `buy8hChangePercent`: Percent change in number of buy trades in the last 8 hours.
  - `buy24hChangePercent`: Percent change in number of buy trades in the last 24 hours.
  - `sell30mChangePercent`: Percent change in number of sell trades in the last 30 minutes.
  - `sell1hChangePercent`: Percent change in number of sell trades in the last 1 hour.
  - `sell2hChangePercent`: Percent change in number of sell trades in the last 2 hours.
  - `sell4hChangePercent`: Percent change in number of sell trades in the last 4 hours.
  - `sell8hChangePercent`: Percent change in number of sell trades in the last 8 hours.
  - `sell24hChangePercent`: Percent change in number of sell trades in the last 24 hours.
- Returns a promise that resolves to the requested statistic as a number.

This function fetches the specified statistic for the given token from the API and returns it as a number. If the fetch operation fails, an error is thrown.

### `assets(): Promise<EVMWalletAssets>`

Fetches the asset balances of the trigger agent's wallet.
- Returns a promise that resolves to an `EVMWalletAssets` object containing the wallet's asset balances.

The `EVMWalletAssets` type is defined as follows:

```typescript
interface EVMWalletAssets {
  tokens: Array<{
    balance: string;
    balanceInUSD: number;
    price_per_token: number;
    name: string;
    symbol: string;
    token: {
      address: string;
      decimals: number;
      image: string;
    };
  }>;
  nfts: Array<{
    name: string;
    symbol: string;
    mint: string;
    image: string;
  }>;
  eth: {
    balance: number;
    balanceInUSD: number;
  };
  total_in_usd: number;
}
```

The `EVMWalletAssets` object contains the following properties:
- `tokens`: An array of objects representing the fungible token balances.
- `nfts`: An array of objects representing the non-fungible token (NFT) balances.
- `eth`: An object representing the ETH balance.
- `total_in_usd`: The total balance of all assets in USD.

### `end(): Promise<void>`

Ends the trigger agent and redeposits all assets into the main account.
- Returns a promise that resolves when the operation is complete.

### `swap(fromToken: string, toToken: string, amount: number, slippageBps: number): Promise<string | undefined>`

Performs a token swap.
- `fromToken`: The address of the token to swap from (e.g., "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" for USDC)
- `toToken`: The address of the token to swap to (e.g., "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" for ETH)
- `amount`: The amount of `fromToken` to swap. This should be in the units of the `fromToken`. For example:
  - If swapping 1 USDC into another token, use `1`
  - If swapping 0.1 ETH into another token, use `0.1`
  - If swapping 0.5 WBTC into another token, use `0.5`
- `slippageBps`: The allowed slippage in basis points (1 bps = 0.01%). For example, 50 bps = 0.5% slippage.
- Returns a promise that resolves to the transaction signature as a string if successful, or `undefined` if the swap fails.

### `sendToken(to: string, token: string, amount: number): Promise<string | undefined>`

Sends a specified amount of tokens to a recipient.
- `to`: The recipient's wallet address.
- `token`: The address of the token to send. e.g. "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
- `amount`: The amount of tokens to send.
- Returns a promise that resolves to the transaction signature as a string if successful, or `undefined` if the transaction fails.

### `sendEth(to: string, amount: number): Promise<string | undefined>`

Sends a specified amount of ETH to a recipient.
- `to`: The recipient's wallet address.
- `amount`: The amount of ETH to send.
- Returns a promise that resolves to the transaction signature as a string if successful, or `undefined` if the transaction fails.

# Persistent Storage

Since the trading scripts run on non-persistent serverless functions, you cannot directly set a variable and expect it to be available the next time the script runs. To overcome this limitation, we provide the `getValue` and `setValue` functions for persistent storage.

SCRIPTS CANNOT KEEP STATE. YOU NEED TO USE THE setValue and getValue to keep something persisting between runs of the script / cron

Note: The stored values are specific to each trigger agent, so different agents will have their own separate storage.

### `setValue(key: string, value: any): Promise<any>`

Sets a key-value pair in persistent storage.
- `key`: The key to store the value under.
- `value`: The value to store.
- Returns a promise that resolves to the stored value.

### `getValue(key: string): Promise<any>`

Retrieves a value from persistent storage based on the provided key.
- `key`: The key to retrieve the value for.
- Returns a promise that resolves to the retrieved value.

Use the `setValue` function to store values that you want to persist across script executions. You can then retrieve those values using the `getValue` function in subsequent script runs.

Here's an example of how to use `getValue` and `setValue`:

```typescript
async function persistentCounter() {
  // Store a value
  await setValue("counter", 0);

  // Retrieve the value
  const counter = await getValue("counter");
  console.log(counter); // Output: 0

  // Increment the counter
  await setValue("counter", counter + 1);
}

await persistentCounter();
```

# Notifications and Alerts

### `sendNotification(platform: string, message: string): Promise<boolean>`

Sends a notification to the specified platform.
- `platform`: The platform to send the notification to. Currently, the only allowed value is `"telegram"`.
- `message`: The message as a string to send to the platform.
- Returns a promise with a boolean indicating success or failure of sending the notification.

For notifications, make sure to connect the account on the dashboard because otherwise notifications won't get delivered.

# Spawning a Sub Agent

You can spawn a sub agent to search the web and find any information you need. This can be useful for making decisions based on external data or events.

### `spawn_sub_agent(query: string, responseType: string): Promise<string>`

Spawns a sub AI agent that can search the web and find the requested information.
- `query`: The query or question to ask the sub agent.
- `responseType`: The expected type of the response. Can be "boolean", "number", or "string".
- Returns a promise that resolves to the sub agent's response as a string.

The response from the sub agent is always a string, but you can specify the expected response type and convert it accordingly in your code:
- Booleans will be in "TRUE" or "FALSE" format.
- Numbers will be in "123" format.
- Strings will be in "hello" format.

Here's an example of how to use `spawn_sub_agent` to check if a major economic event has occurred and adjust your trading strategy accordingly:

```typescript
const ethAddress = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"; // ETH (native token)
const usdcAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // USDC
const minEthForFees = 0.001; // Minimum ETH balance required for fees

async function checkEconomicEvent() {
  try {
    // Check if a major economic event has occurred
    const query = "Has there been a significant change in US interest rates in the last 24 hours? Answer with TRUE if there has been, or FALSE if there has not.";
    const response = await spawn_sub_agent(query, "boolean");
    log(`Economic event check result: ${response}`);

    if (response === "TRUE") {
      log("A significant change in US interest rates has been reported. Adjusting trading strategy.");
      
      // Check wallet balances
      const walletAssets = await assets();
      const ethBalance = walletAssets.eth.balance;
      if (ethBalance < minEthForFees) {
        log(`Insufficient ETH balance for fees. Required: ${minEthForFees} ETH, Available: ${ethBalance.toFixed(18)} ETH`);
        return;
      }

      // Get current ETH price
      const ethPrice = await price(ethAddress);
      log(`Current ETH price: $${ethPrice.toFixed(2)}`);

      // Calculate the amount of ETH to swap (e.g., 10% of the balance)
      const ethToSwap = ethBalance * 0.1;

      // Swap some ETH for USDC as a hedge
      try {
        const txSignature = await swap(ethAddress, usdcAddress, ethToSwap, 50);
        log(`Swapped ${ethToSwap.toFixed(18)} ETH for USDC as a hedge. Transaction: ${txSignature}`);
      } catch (swapError) {
        log(`Failed to swap ETH for USDC: ${swapError}`);
      }

      // Check updated balances
      const updatedAssets = await assets();
      const updatedEthBalance = updatedAssets.eth.balance;
      const updatedUsdcBalance = updatedAssets.tokens.find(t => t.token.address.toLowerCase() === usdcAddress.toLowerCase())?.balance || "0";
      log(`Updated ETH balance: ${updatedEthBalance.toFixed(18)} ETH`);
      log(`Updated USDC balance: ${updatedUsdcBalance} USDC`);

    } else {
      log("No significant change in US interest rates. Maintaining current strategy.");
      // Log current balances
      const walletAssets = await assets();
      log(`Current ETH balance: ${walletAssets.eth.balance.toFixed(18)} ETH`);
      const usdcBalance = walletAssets.tokens.find(t => t.token.address.toLowerCase() === usdcAddress.toLowerCase())?.balance || "0";
      log(`Current USDC balance: ${usdcBalance} USDC`);
    }
  } catch (error) {
    log(`An error occurred during the economic event check: ${error}`);
  }
}

await checkEconomicEvent();
```

In this example, the script spawns a sub agent to check if there has been a significant change in US interest rates. The sub agent searches the web and returns a boolean response. If the response is "TRUE", indicating that a significant change has occurred, the script adjusts its trading strategy by swapping some ETH for USDC as a hedge against potential market volatility. If the response is "FALSE", the script maintains its current strategy and logs the current balances.
Remember to handle the response appropriately based on the specified responseType. Convert the string response to the desired type (boolean, number, or string) in your code.
