---
name: polymarket-sponsored-rewards
description: Query and analyze Polymarket sponsored reward markets. Use when the user asks about Polymarket rewards, sponsored markets, liquidity provisioning, reward farming, or market making on Polymarket.
---

# Polymarket Sponsored Rewards

## API

```
GET https://cheff-phi.vercel.app/api/sponsored
GET https://cheff-phi.vercel.app/api/sponsored?force=1  # bypass cache
```

## Response

```typescript
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
```

## Common Queries

**Active rewards:**
```typescript
const active = snapshot.events.filter(
  (e) => !e.withdrawn && new Date(e.endTime) > new Date()
);
```

**Best daily rate:**
```typescript
active.sort((a, b) => b.ratePerDayUsdc - a.ratePerDayUsdc);
```

**Top sponsors:**
```typescript
const map = new Map();
for (const e of snapshot.events) {
  const k = e.sponsor.toLowerCase();
  map.set(k, (map.get(k) ?? 0) + e.amountUsdc - e.returnedUsdc);
}
const ranked = [...map.entries()].sort((a, b) => b[1] - a[1]);
```

## URLs

- Market: `https://polymarket.com/event/{eventSlug}`
- Sponsor: `https://polymarket.com/profile/{sponsor}`
- Tx: `https://polygonscan.com/tx/{txHash}`

## Data Source

On-chain events from Polygon contract `0xf7cD89BE08Af4D4D6B1522852ceD49FC10169f64`. Indexes `Sponsored` (USDC deposited) and `Withdrawn` (USDC reclaimed) events. Market names enriched via Gamma API.
