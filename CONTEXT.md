# Polymarket Sponsored Rewards

## API Endpoint

```
GET https://cheff-phi.vercel.app/api/sponsored
```

Optional query parameter: `?force=1` to bypass cache and fetch fresh on-chain data.

## Response Shape

```typescript
interface SponsoredSnapshot {
  events: SponsoredEvent[];
  overall: {
    totalEvents: number;
    uniqueSponsors: number;
    uniqueMarkets: number;
    totalAmountUsdc: number;      // gross deposited
    netAmountUsdc: number;        // deposited minus returned
    totalReturnedUsdc: number;    // withdrawn by sponsors
    totalConsumedUsdc: number;    // paid out to LPs
  };
  fetchedAt: string;              // ISO timestamp
  fromBlock: number;              // Polygon block range start
  toBlock: number;                // Polygon block range end
}

interface SponsoredEvent {
  marketId: string;               // Polymarket condition token ID
  sponsor: string;                // Ethereum address
  amountUsdc: number;             // total deposited USDC
  startTime: string;              // ISO timestamp
  endTime: string;                // ISO timestamp
  durationDays: number;
  ratePerDayUsdc: number;         // amountUsdc / durationDays
  txHash: string;                 // Polygon tx hash
  blockNumber: number;
  marketQuestion?: string;        // human-readable market title
  marketSlug?: string;            // Polymarket market slug
  eventSlug?: string;             // Polymarket event slug (for URLs)
  withdrawn: boolean;             // true if sponsor withdrew
  returnedUsdc: number;           // amount returned to sponsor
  consumedUsdc: number;           // amount distributed to LPs
}
```

## Fetching Data

```bash
curl -s https://cheff-phi.vercel.app/api/sponsored | jq .overall
```

```typescript
const res = await fetch('https://cheff-phi.vercel.app/api/sponsored');
const snapshot = await res.json();
```

## Common Queries

**Active rewards only** (not withdrawn, not expired):
```typescript
const active = snapshot.events.filter(
  (e) => !e.withdrawn && new Date(e.endTime) > new Date()
);
```

**Best rate per day:**
```typescript
const best = active.sort((a, b) => b.ratePerDayUsdc - a.ratePerDayUsdc);
```

**Rewards for a specific market:**
```typescript
const forMarket = snapshot.events.filter(e => e.marketId === targetId);
```

**Top sponsors by net amount:**
```typescript
const map = new Map();
for (const e of snapshot.events) {
  const k = e.sponsor.toLowerCase();
  map.set(k, (map.get(k) ?? 0) + e.amountUsdc - e.returnedUsdc);
}
const ranked = [...map.entries()].sort((a, b) => b[1] - a[1]);
```

## Data Source

On-chain events from Polygon contract `0xf7cD89BE08Af4D4D6B1522852ceD49FC10169f64` (Polymarket Rewards Sponsorship). Two event types indexed:

- **Sponsored**: USDC deposited to incentivize liquidity on a market
- **Withdrawn**: sponsor reclaims unspent USDC

Market names enriched via Gamma API (`gamma-api.polymarket.com`).

## Polymarket URLs

- Market page: `https://polymarket.com/event/{eventSlug}`
- Sponsor profile: `https://polymarket.com/profile/{sponsor}`
- Transaction: `https://polygonscan.com/tx/{txHash}`
