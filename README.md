# Polymarket Sponsored Rewards — MCP Server + Skill

MCP server and agent skill for querying live Polymarket sponsored reward data. Works with **Claude Code**, **Cursor**, and **Codex**.

Data is indexed on-chain from Polygon contract `0xf7cD89BE08Af4D4D6B1522852ceD49FC10169f64` (Polymarket Rewards Sponsorship).

## Tools

| Tool | Description |
|------|-------------|
| `get_sponsored_rewards` | Full snapshot: overall stats + every sponsorship event |
| `get_active_opportunities` | Active rewards sorted by daily rate, with filtering |
| `get_top_sponsors` | Top sponsors ranked by net USDC deposited |

## Setup

### 1. Build

```bash
git clone https://github.com/sanketagarwal/polymarket-rewards-mcp.git
cd polymarket-rewards-mcp
npm install
npm run build
```

### 2. Configure your client

#### Claude Code

```bash
claude mcp add polymarket-rewards -- node /absolute/path/to/polymarket-rewards-mcp/build/index.js
```

#### Cursor

Add to `.cursor/mcp.json` in your project (or `~/.cursor/mcp.json` globally):

```json
{
  "mcpServers": {
    "polymarket-rewards": {
      "command": "node",
      "args": ["/absolute/path/to/polymarket-rewards-mcp/build/index.js"]
    }
  }
}
```

#### Codex

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "polymarket-rewards": {
      "command": "node",
      "args": ["/absolute/path/to/polymarket-rewards-mcp/build/index.js"]
    }
  }
}
```

Replace `/absolute/path/to/` with the actual path where you cloned the repo.

## Cursor Skill (alternative)

If you prefer a skill over an MCP server, copy the skill directory into your Cursor skills folder:

```bash
cp -r polymarket-sponsored-rewards ~/.cursor/skills/
```

The skill teaches the agent how to query the API directly via `fetch`/`curl` without needing the MCP server running.

## API Reference

All tools query `https://cheff-phi.vercel.app/api/sponsored` which returns:

```
{
  events: SponsoredEvent[]
  overall: { totalEvents, uniqueSponsors, uniqueMarkets, totalAmountUsdc, netAmountUsdc, totalReturnedUsdc, totalConsumedUsdc }
  fetchedAt: string
  fromBlock: number
  toBlock: number
}
```

Each `SponsoredEvent`:

| Field | Type | Description |
|-------|------|-------------|
| `marketId` | string | Polymarket condition token ID |
| `sponsor` | string | Ethereum address |
| `amountUsdc` | number | Total USDC deposited |
| `ratePerDayUsdc` | number | Daily reward rate |
| `startTime` | string | ISO timestamp |
| `endTime` | string | ISO timestamp |
| `durationDays` | number | Total duration |
| `txHash` | string | Polygon tx hash |
| `marketQuestion` | string | Market title |
| `eventSlug` | string | Polymarket event URL slug |
| `withdrawn` | boolean | Whether sponsor withdrew |
| `returnedUsdc` | number | USDC returned to sponsor |
| `consumedUsdc` | number | USDC paid to LPs |

## Dashboard

[cheff-phi.vercel.app/opportunities](https://cheff-phi.vercel.app/opportunities)
