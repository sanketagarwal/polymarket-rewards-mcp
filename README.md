# Polymarket Sponsored Rewards — MCP Server

MCP server for querying live Polymarket sponsored reward data. Works with **Claude Code**, **Cursor**, **Codex**, or any MCP-compatible client.

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

### 2. Connect to your client

#### Claude Code

```bash
claude mcp add polymarket-rewards -- node /absolute/path/to/polymarket-rewards-mcp/build/index.js
```

#### Cursor

Add to `.cursor/mcp.json` in your project or globally at `~/.cursor/mcp.json`:

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

## Dashboard

[cheff-phi.vercel.app/opportunities](https://cheff-phi.vercel.app/opportunities)
