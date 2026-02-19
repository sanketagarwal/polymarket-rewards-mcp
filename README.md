# Polymarket Sponsored Rewards — MCP Server

MCP server for querying live Polymarket sponsored reward data. Works with any MCP-compatible client: **Claude Code**, **Cursor**, **Codex**, or anything else that supports the protocol.

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

## Agent Context (without MCP)

If your agent doesn't support MCP, or you want to give it context about the API without running a server, use `CONTEXT.md`. It contains the full API reference, response types, and common query patterns. Feed it to your agent however your tool supports context files:

- **Claude Code**: copy as `CLAUDE.md` in your project root
- **Cursor**: create a rule file at `.cursor/rules/polymarket-rewards.md`, or copy into `~/.cursor/skills/polymarket-sponsored-rewards/SKILL.md` (add YAML frontmatter `name` and `description` fields)
- **Codex**: include in your system prompt or project context
- **Any agent**: paste the contents or reference the file in your prompt

## API Reference

All tools query `https://cheff-phi.vercel.app/api/sponsored`. See [CONTEXT.md](CONTEXT.md) for the full response schema and field descriptions.

## Dashboard

[cheff-phi.vercel.app/opportunities](https://cheff-phi.vercel.app/opportunities)
