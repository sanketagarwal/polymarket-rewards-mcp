#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_BASE = "https://cheff-phi.vercel.app/api/sponsored";

interface SponsoredEvent {
  marketId: string;
  sponsor: string;
  amountUsdc: number;
  startTime: string;
  endTime: string;
  durationDays: number;
  ratePerDayUsdc: number;
  txHash: string;
  blockNumber: number;
  marketQuestion?: string;
  marketSlug?: string;
  eventSlug?: string;
  withdrawn: boolean;
  returnedUsdc: number;
  consumedUsdc: number;
}

interface SponsoredSnapshot {
  events: SponsoredEvent[];
  overall: {
    totalEvents: number;
    uniqueSponsors: number;
    uniqueMarkets: number;
    totalAmountUsdc: number;
    netAmountUsdc: number;
    totalReturnedUsdc: number;
    totalConsumedUsdc: number;
  };
  fetchedAt: string;
  fromBlock: number;
  toBlock: number;
}

async function fetchSnapshot(force: boolean): Promise<SponsoredSnapshot> {
  const url = force ? `${API_BASE}?force=1` : API_BASE;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return (await res.json()) as SponsoredSnapshot;
}

const server = new McpServer({
  name: "polymarket-rewards",
  version: "1.0.0",
});

server.registerTool(
  "get_sponsored_rewards",
  {
    description:
      "Get all Polymarket sponsored reward data including overall stats and every sponsorship event. Returns total deposited, consumed, returned USDC, unique sponsors/markets counts, and the full event list.",
    inputSchema: {
      force: z
        .boolean()
        .optional()
        .describe("Bypass cache and fetch fresh on-chain data (default false)"),
    },
  },
  async ({ force }) => {
    const snapshot = await fetchSnapshot(force ?? false);
    const summary = [
      `Total deposited: $${snapshot.overall.totalAmountUsdc.toFixed(2)}`,
      `Net amount: $${snapshot.overall.netAmountUsdc.toFixed(2)}`,
      `Consumed (paid to LPs): $${snapshot.overall.totalConsumedUsdc.toFixed(2)}`,
      `Returned to sponsors: $${snapshot.overall.totalReturnedUsdc.toFixed(2)}`,
      `Total events: ${snapshot.overall.totalEvents}`,
      `Unique markets: ${snapshot.overall.uniqueMarkets}`,
      `Unique sponsors: ${snapshot.overall.uniqueSponsors}`,
      `Block range: ${snapshot.fromBlock} → ${snapshot.toBlock}`,
      `Updated: ${snapshot.fetchedAt}`,
    ].join("\n");

    return {
      content: [
        { type: "text", text: summary },
        { type: "text", text: JSON.stringify(snapshot, null, 2) },
      ],
    };
  },
);

server.registerTool(
  "get_active_opportunities",
  {
    description:
      "Get active sponsored reward opportunities on Polymarket, sorted by daily reward rate. Filters out expired and withdrawn events. Use this to find the best markets to provide liquidity on.",
    inputSchema: {
      min_rate_per_day: z
        .number()
        .optional()
        .describe("Minimum daily reward rate in USD (default 0)"),
      limit: z
        .number()
        .optional()
        .describe("Maximum number of results to return (default 50)"),
    },
  },
  async ({ min_rate_per_day, limit }) => {
    const snapshot = await fetchSnapshot(false);
    const now = new Date();
    const minRate = min_rate_per_day ?? 0;
    const maxResults = limit ?? 50;

    const active = snapshot.events
      .filter(
        (e) =>
          !e.withdrawn &&
          new Date(e.endTime) > now &&
          e.ratePerDayUsdc >= minRate,
      )
      .sort((a, b) => b.ratePerDayUsdc - a.ratePerDayUsdc)
      .slice(0, maxResults);

    const totalDailyRate = active.reduce((s, e) => s + e.ratePerDayUsdc, 0);

    const lines = active.map((e) => {
      const daysLeft = Math.ceil(
        (new Date(e.endTime).getTime() - now.getTime()) / 86_400_000,
      );
      const url = e.eventSlug
        ? `https://polymarket.com/event/${e.eventSlug}`
        : "";
      return [
        e.marketQuestion || e.marketId.slice(0, 40),
        `  Amount: $${e.amountUsdc.toFixed(2)} | Rate: $${e.ratePerDayUsdc.toFixed(2)}/day | ${daysLeft}d left`,
        `  Sponsor: ${e.sponsor}`,
        url ? `  URL: ${url}` : "",
        `  Tx: https://polygonscan.com/tx/${e.txHash}`,
      ]
        .filter(Boolean)
        .join("\n");
    });

    const header = [
      `Active opportunities: ${active.length}`,
      `Total daily rate: $${totalDailyRate.toFixed(2)}/day`,
      `Filters: min $${minRate}/day, limit ${maxResults}`,
      "",
    ].join("\n");

    return {
      content: [{ type: "text", text: header + lines.join("\n\n") }],
    };
  },
);

server.registerTool(
  "get_top_sponsors",
  {
    description:
      "Get the top sponsors on Polymarket by net USDC deposited. Shows address, total amount, and number of markets sponsored.",
    inputSchema: {
      limit: z
        .number()
        .optional()
        .describe("Number of sponsors to return (default 10)"),
    },
  },
  async ({ limit }) => {
    const snapshot = await fetchSnapshot(false);
    const maxResults = limit ?? 10;

    const map = new Map<string, { net: number; markets: Set<string> }>();
    for (const e of snapshot.events) {
      const k = e.sponsor.toLowerCase();
      const entry = map.get(k) ?? { net: 0, markets: new Set() };
      entry.net += e.amountUsdc - e.returnedUsdc;
      entry.markets.add(e.marketId);
      map.set(k, entry);
    }

    const ranked = [...map.entries()]
      .map(([addr, v]) => ({
        address: addr,
        netUsdc: v.net,
        marketCount: v.markets.size,
      }))
      .sort((a, b) => b.netUsdc - a.netUsdc)
      .slice(0, maxResults);

    const lines = ranked.map(
      (s, i) =>
        `${i + 1}. ${s.address} — $${s.netUsdc.toFixed(2)} across ${s.marketCount} market${s.marketCount !== 1 ? "s" : ""}`,
    );

    return {
      content: [
        {
          type: "text",
          text: `Top ${ranked.length} sponsors:\n\n${lines.join("\n")}`,
        },
      ],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Polymarket Rewards MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
