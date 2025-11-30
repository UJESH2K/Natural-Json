```md
CARDANO × DAN LABS  

<img src="public/5.png" width="120" alt="Cardano × Dan Labs logo" />

AI-powered trading agent that turns plain English like “buy 10 ADA every 5 seconds and send me a mail” into executable workflows, runs them on Cardano, and streams live trades and notifications in real time.

---

## 🌌 Hero Experience

The app opens with a full-screen “CARDANO × DAN LABS” hero, a glowing aurora background, and a single central prompt bar where the user can type or speak strategies such as “Buy 10 ADA every 5 seconds and send me a mail”.

On the left, users see a chat-style history of all previously created agents and prompts, so the interface feels like a trading copilot rather than a static form.

### Screenshots

Screenshot 1 – Initial hero screen with prompt:  
![Hero with prompt](public/3.jpg)

Screenshot 2 – Dashboard / workflow state:  
![Workflow and dashboard](public/4.jpg)

Additional view with live trading and charts:  
![Live trading view](public/7.jpg)

---

## 🎬 End-to-End Demo (Video)

GitHub does not always auto-play inline `<video>` tags, so the demo is exposed as a clickable thumbnail that opens the MP4.

[![Watch demo video](public/4.jpg)](public/6.mp4)

> Click the image above to open and play the demo video (`public/6.mp4`) in your browser.

---

## 🧠 What This Project Does

This project converts natural language strategies into strict JSON workflows (triggers, actions, edges), visualizes them as interactive graphs with animated nodes using React Flow, executes trades against configured providers (Cardano, Lighter, Masumi, etc.) or runs simulations, sends real-time HTML email notifications whenever a workflow runs, and streams trade events live into a dashboard using Socket.IO. At a high level, you talk to the system like an AI agent, it compiles your intent into a workflow, and that workflow becomes a live trading strategy with full observability.

Key capabilities include:

- Natural-language → JSON workflow parsing with a local regex-based NLP engine.  
- Zero external AI requirement, with optional Gemini/OpenAI fallback.  
- Cardano integration via Blockfrost webhooks and a dedicated real-time server.  
- Email alerts via Nodemailer, Gmail SMTP, and responsive HTML templates.  
- Animated, dark-mode trading canvas powered by TailwindCSS and custom shaders.  
- Live dashboard with charts, trade history, and action statuses.  
- Persistent chat history stored in the browser, so each strategy is a “session” you can revisit.

---

## 🏗️ Project Structure

```
ujesh2k-natural-json/
├── README.md
├── EMAIL_INTEGRATION_COMPLETE.md
├── next.config.js
├── webhook-server.js
├── .env.local.example
└── src/
    ├── app/page.tsx
    ├── app/layout.tsx
    ├── api/nlp/route.ts
    ├── api/execute/route.ts
    ├── api/events/route.ts
    ├── api/cardano/route.ts
    ├── api/email/route.ts
    ├── components/ai/prompt-input.tsx
    ├── components/ui/aurora-shaders.tsx
    ├── components/ui/sidebar.tsx
    ├── components/trading/TradingDashboard.tsx
    ├── components/trading/WorkflowExecutor.tsx
    ├── components/workflow/CustomNode.tsx
    ├── components/workflow/workflow-canvas.tsx
    ├── lib/localParser.ts
    ├── lib/workflow-parser.ts
    ├── lib/executor.ts
    ├── lib/events.ts
    ├── lib/emailService.ts
    ├── lib/cardanoService.ts
    ├── lib/lighterClient.ts
    ├── lib/layout.ts
    └── types/workflow.ts
```

Tech stack: Next.js 16, TypeScript, TailwindCSS, `@xyflow/react`, Recharts, Socket.IO, Blockfrost, Nodemailer.

---

## ⚙️ Setup & Installation

```
git clone <your-repo-url>
cd ujesh2k-natural-json
npm install
npm run dev

# App will be available at:
# http://localhost:3000
```

---

## 🔐 .env.local

```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
OPENAI_API_KEY=your_openai_key_here
GOOGLE_API_KEY=
GEMINI_API_KEY=
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
MASUMI_API_KEY=your_masumi_api_key_here
MASUMI_API_URL=https://api.masumi.xyz
MASUMI_ENV=testnet
LIGHTER_BASE_URL=https://testnet.app.lighter.xyz
LIGHTER_API_KEY_INDEX=0
LIGHTER_API_KEY_PUBLIC=disabled_api_broken
LIGHTER_API_KEY_PRIVATE=disabled_api_broken
ETH_PRIVATE_KEY=disabled_api_broken
LIGHTER_WALLET_ADDRESS=disabled_api_broken
SMTP_EMAIL=
SMTP_PASSWORD=PUT_YOUR_16_CHARACTER_GMAIL_APP_PASSWORD_HERE
SMTP_SERVICE=gmail
BLOCKFROST_PROJECT_ID=
BLOCKFROST_NETWORK=preprod
CARDANO_NETWORK=testnet
BACKPACK_API_KEY=
BACKPACK_API_SECRET=
```

---

## 🚀 Run the Real-Time Server

```
node webhook-server.js
```

---

## 🔌 API Endpoints

- `POST /api/nlp`  
- `GET /api/nlp`  
- `GET /api/nlp?prompt=...`  
- `POST /api/execute`  
- `GET /api/events`  
- `POST /api/email`  
- `POST /api/cardano`  
- `POST /webhook/blockfrost`  
- `POST /api/submit-trade`  
- `GET /health`  

The main parsing entrypoint is `/api/nlp` using `lib/localParser.ts`.

---

## 🧩 Workflow Model

```
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

interface NotificationAction {
  id: string;
  type: "NotificationAction";
  channel: "email" | "sms" | "discord";
  to: string;
  message?: string;
}
```

---

## 🧪 Example Prompts

- “Buy 10 ADA every 5 seconds and email me.”  
- “Buy 10 shares of AAPL at 150 and sell at 180, TP 5%.”  
- “Long BTC 10x if price above 50000.”  
- “Short NIFTY at 22000, target 21500.”  
- “Buy 0.5 ETH, TP 10%, SL 5% and notify trader@domain.com.”  

---

## 🎛️ UI & Interaction Flow

Screenshots show the hero state and chat list; the demo video walks through prompt → workflow graph → live trades and notifications.

Flow:

1. User opens the CARDANO × DAN LABS screen and enters a natural-language strategy.  
2. The app calls `/api/nlp`, then opens the DAN Trading Dashboard.  
3. The canvas shows the workflow; the dashboard shows controls and real-time output.

---

## 📊 Live Trading & Candlesticks

The `TradingDashboard` subscribes to WebSocket trade events, displaying live trades, aggregated stats, and price/volume charts. A candlestick view highlights executed trades directly on the chart.

---

## 📧 Email Integration

`EMAIL_INTEGRATION_COMPLETE.md` documents the email flow.  
Email service: `src/lib/emailService.ts`.  
API endpoint: `src/app/api/email/route.ts`.  
`executor.ts` attaches notification actions.  
HTML emails include workflow details and timestamps.

---

## 🔗 Providers

Cardano + Blockfrost, Lighter, Masumi, Backpack, Socket.IO, Gemini/OpenAI, Gmail + Nodemailer.

---

## 🧪 Testing

- `node test-email.js`  
- `POST /api/submit-trade`

---

## 📜 License

MIT – built to explore natural language trading agents, Cardano workflows, and real-time visualization.
```
