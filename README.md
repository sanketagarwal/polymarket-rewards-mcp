# Polymarket Sponsored Rewards — MCP Skill

A Cursor agent skill that gives AI agents access to live Polymarket sponsored reward data. Query active rewards, discover high-yield markets, and build automated liquidity provisioning strategies.

## What This Does

Polymarket has a permissionless rewards sponsorship contract on Polygon (`0xf7cD89BE08Af4D4D6B1522852ceD49FC10169f64`). Anyone can deposit USDC to incentivize liquidity on a specific market. This skill lets AI agents query that data through a public API.

The API indexes two on-chain event types:

- **Sponsored** — USDC deposited to reward LPs on a market
- **Withdrawn** — sponsor reclaims unspent USDC

Market names are enriched via Polymarket's Gamma API.

## Install as Cursor Skill

Copy the `polymarket-sponsored-rewards` directory into your Cursor skills folder:

```bash
# Personal skill (available across all projects)
cp -r polymarket-sponsored-rewards ~/.cursor/skills/

# Or project-level skill (shared with repo collaborators)
cp -r polymarket-sponsored-rewards .cursor/skills/
```

Once installed, the Cursor agent will automatically use it when you ask about Polymarket rewards, sponsored markets, or liquidity provisioning.

## API

```
GET https://cheff-phi.vercel.app/api/sponsored
```

Add `?force=1` to bypass the 5-minute cache and fetch fresh on-chain data.

### Response

```json
{
  "events": [...],
  "overall": {
    "totalEvents": 3801,
    "uniqueSponsors": 2565,
    "uniqueMarkets": 920,
    "totalAmountUsdc": 192359.04,
    "netAmountUsdc": 134307.87,
    "totalReturnedUsdc": 58051.18,
    "totalConsumedUsdc": 49958.26
  },
  "fetchedAt": "2026-02-19T22:03:00.000Z",
  "fromBlock": 82810472,
  "toBlock": 83209020
}
```

Each event in the `events` array:

| Field | Type | Description |
|-------|------|-------------|
| `marketId` | string | Polymarket condition token ID |
| `sponsor` | string | Sponsor's Ethereum address |
| `amountUsdc` | number | Total USDC deposited |
| `ratePerDayUsdc` | number | Daily reward rate |
| `startTime` | string | ISO timestamp |
| `endTime` | string | ISO timestamp |
| `durationDays` | number | Total reward duration |
| `txHash` | string | Polygon transaction hash |
| `marketQuestion` | string | Market title from Polymarket |
| `eventSlug` | string | Polymarket event URL slug |
| `withdrawn` | boolean | Whether sponsor has withdrawn |
| `returnedUsdc` | number | USDC returned to sponsor |
| `consumedUsdc` | number | USDC paid to LPs |

## Examples

### Get active rewards sorted by daily rate

```typescript
const res = await fetch('https://cheff-phi.vercel.app/api/sponsored');
const { events } = await res.json();

const active = events
  .filter(e => !e.withdrawn && new Date(e.endTime) > new Date())
  .sort((a, b) => b.ratePerDayUsdc - a.ratePerDayUsdc);
```

### Find rewards for a specific market

```typescript
const forMarket = events.filter(e => e.marketId === targetConditionId);
```

### Top sponsors by net spend

```typescript
const map = new Map();
for (const e of events) {
  const k = e.sponsor.toLowerCase();
  map.set(k, (map.get(k) ?? 0) + e.amountUsdc - e.returnedUsdc);
}
const ranked = [...map.entries()].sort((a, b) => b[1] - a[1]);
```

### Build a Polymarket link

```typescript
const url = `https://polymarket.com/event/${event.eventSlug}`;
```

## Data Source

All data is indexed directly from Polygon. The contract was deployed at block 82,810,472. The API reads `Sponsored` and `Withdrawn` events, decodes the log data, and enriches market IDs with names from the Gamma API.

The backend caches results for 5 minutes and fetches incrementally (only new blocks since the last scan).

## Dashboard

View the live dashboard at [cheff-phi.vercel.app/opportunities](https://cheff-phi.vercel.app/opportunities).
