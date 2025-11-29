# NLP → JSON Trading Workflow API

A Next.js API that converts natural language trading strategies into structured JSON workflows. No external AI API required — runs 100% locally with a regex-based NLP parser.

## 🚀 Features

- **Natural Language Parsing**: Convert plain English trading strategies to JSON
- **Zero Dependencies on AI APIs**: Works completely offline using local regex parsing
- **Persistent Last Workflow**: Submit a prompt, then fetch `/api/nlp` anytime to get the result
- **Smart Trigger Detection**: Automatically infers operators (`<=`, `>=`) from context
- **Multi-Action Support**: Handles "buy at X and sell at Y" in a single prompt
- **Percent-based TP/SL**: Supports `TP 5%`, `SL 2%` syntax
- **Dynamic Asset Detection**: Recognizes crypto, stocks, indices, and commodities

## 📦 Installation

```bash
git clone https://github.com/yourusername/trading-workflow-builder.git
cd trading-workflow-builder
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the UI.

## 🔌 API Usage

### POST `/api/nlp`

Submit a trading strategy and get structured JSON.

```bash
curl -X POST http://localhost:3000/api/nlp \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Buy BTC at 50000 and sell at 60000"}'
```

### GET `/api/nlp`

Returns the **last submitted workflow** — no parameters needed.

```bash
curl http://localhost:3000/api/nlp
```

### GET `/api/nlp?prompt=...`

Parse a prompt directly via query parameter.

```bash
curl "http://localhost:3000/api/nlp?prompt=Long%20ETH%2010x%20if%20price%20above%202000"
```

## 📄 Example

**Input:**
```
Buy 10 shares of AAPL at 150 and sell at 180, TP 5%
```

**Output:**
```json
{
  "id": "wf-1764439193767",
  "name": "Buy 10 shares of AAPL at 150 and sell at 180, TP 5%",
  "triggers": [
    {
      "id": "t1",
      "type": "PriceTrigger",
      "asset": "AAPL",
      "operator": "<=",
      "value": 150
    },
    {
      "id": "t2",
      "type": "PriceTrigger",
      "asset": "AAPL",
      "operator": ">=",
      "value": 180
    }
  ],
  "actions": [
    {
      "id": "a1",
      "type": "TradeAction",
      "side": "buy",
      "asset": "AAPL",
      "amount": 10,
      "takeProfitPercent": 5
    },
    {
      "id": "a2",
      "type": "TradeAction",
      "side": "sell",
      "asset": "AAPL",
      "amount": 1
    }
  ],
  "edges": [
    { "from": "t1", "to": "a1" },
    { "from": "t2", "to": "a2" }
  ]
}
```

## 🎯 Supported Prompts

| Prompt | Parsed As |
|--------|-----------|
| `Buy BTC at 50000` | Buy when price ≤ 50000 |
| `Sell ETH at 2000` | Sell when price ≥ 2000 |
| `Long BTC 10x if price > 50000` | Long with 10x leverage above 50k |
| `Short NIFTY at 22000, target 21500` | Short with take profit |
| `Buy at 100 and sell at 120` | Two triggers, two actions, 1:1 edges |
| `Buy 0.5 ETH, TP 10%, SL 5%` | Fractional amount with percent TP/SL |

## 🏗️ Project Structure

```
trading-workflow-builder/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── nlp/
│   │   │       └── route.ts    # API endpoint
│   │   ├── page.tsx            # Simple UI
│   │   └── layout.tsx
│   ├── lib/
│   │   ├── localParser.ts      # NLP regex parser
│   │   └── gemini.ts           # Optional Gemini fallback
│   └── types/
│       └── workflow.ts         # TypeScript interfaces
├── package.json
└── README.md
```

## 🔧 Configuration (Optional)

To enable Gemini AI as a fallback parser, create `.env.local`:

```env
GEMINI_API_KEY=your_api_key_here
```

The local parser works without any API key.

## 📝 Workflow Schema

```typescript
interface Workflow {
  id: string;
  name: string;
  triggers: PriceTrigger[];
  actions: (TradeAction | NotificationAction)[];
  edges: { from: string; to: string }[];
}

interface PriceTrigger {
  id: string;
  type: "PriceTrigger";
  asset: string;
  operator: ">=" | "<=" | ">" | "<";
  value: number;
}

interface TradeAction {
  id: string;
  type: "TradeAction";
  side: "buy" | "sell" | "long" | "short";
  asset: string;
  amount: number;
  leverage?: number;
  takeProfit?: number;
  takeProfitPercent?: number;
  stopLoss?: number;
  stopLossPercent?: number;
}
```

## 🛠️ Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Local Regex NLP Parser**

## 📜 License

MIT

---

Built for converting trading ideas into executable workflow JSON.