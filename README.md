
CARDANO × DAN LABS  

AI-powered trading agent that turns plain English like “buy 10 ADA every 5 seconds and send me a mail” into executable workflows, runs them on Cardano, and streams live trades and notifications in real time.[1]

## 🌌 Hero Experience

The app opens with a full-screen “CARDANO × DAN LABS” hero, a glowing aurora background, and a single central prompt bar where the user can type or speak strategies such as “Buy 10 ADA every 5 seconds and send me a mail.”[1]

- Screenshot 1 – Initial hero screen with prompt: WhatsApp Image 2025-11-30 at 12.29.23_69d0b8f0.jpg.[1]
- Screenshot 2 – Focused hero with collapsed sidebar: WhatsApp Image 2025-11-30 at 12.30.26_ce6f6aa0.jpg.[2]

On the left, users see a chat-style history of all previously created agents and prompts, making it feel like a trading copilot rather than a static form.[1]

## 🧠 What This Project Does

- Converts natural language strategies into strict JSON workflows (triggers, actions, edges).[1]
- Visualizes workflows as interactive graphs with animated nodes using React Flow.[1]
- Executes trades against configured providers (Cardano, Lighter, Masumi, etc.) and simulates when needed.[1]
- Sends real-time HTML email notifications whenever a workflow runs.[1]
- Streams trade events live into a dashboard using Socket.IO.[1]

At a high level, you talk to the system like an AI agent, it compiles your intent into a workflow, and then that workflow becomes a live trading strategy with full observability.[1]

## 🚀 Core Features

- Natural-language → JSON workflow parsing with a local regex-based NLP engine.[1]
- Zero external AI requirement, with optional Gemini/OpenAI fallback.[1]
- Cardano integration via Blockfrost webhooks and a dedicated real-time server.[1]
- Email alerts via Nodemailer, Gmail SMTP, and responsive HTML templates.[1]
- Animated, dark-mode trading canvas powered by TailwindCSS and custom shaders.[1]
- Live dashboard with charts, trade history, and action statuses.[1]
- Persistent chat history stored in the browser, so each strategy is a “session” you can revisit.[1]

## 🏗️ Architecture Overview

```txt
ujesh2k-natural-json/
├── README.md
├── EMAIL_INTEGRATION_COMPLETE.md
├── next.config.js
├── webhook-server.js          # Blockfrost + Socket.IO real-time server
├── .env.local.example
└── src/
    ├── app/
    │   ├── page.tsx           # Main UI (CARDANO × DAN LABS, prompt, canvas, dashboard)
    │   ├── layout.tsx
    │   └── api/
    │       ├── nlp/route.ts   # Natural language → workflow JSON
    │       ├── execute/route.ts
    │       ├── events/route.ts
    │       ├── cardano/route.ts
    │       └── email/route.ts
    ├── components/
    │   ├── ai/prompt-input.tsx
    │   ├── ui/aurora-shaders.tsx
    │   ├── ui/sidebar.tsx
    │   ├── trading/TradingDashboard.tsx
    │   ├── trading/WorkflowExecutor.tsx
    │   └── workflow/
    │       ├── CustomNode.tsx
    │       └── workflow-canvas.tsx
    ├── lib/
    │   ├── localParser.ts
    │   ├── workflow-parser.ts
    │   ├── executor.ts
    │   ├── events.ts
    │   ├── emailService.ts
    │   ├── cardanoService.ts
    │   ├── lighterClient.ts
    │   └── layout.ts
    └── types/
        ├── workflow.ts
        ├── chat.ts
        └── index.ts
```


Tech stack: Next.js 16 (App Router), TypeScript, TailwindCSS, `@xyflow/react`, Recharts, Socket.IO, Blockfrost, Nodemailer.[1]

## 📦 Setup & Installation

1) Clone and install:

```bash
git clone <your-repo-url>
cd ujesh2k-natural-json
npm install
npm run dev
```

Open http://localhost:3000 in your browser.[1]

2) Configure `.env.local` for email and blockchain:

```env
# ========= Core Frontend / API =========
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# ========= OpenAI / Gemini (optional) =========
OPENAI_API_KEY=your_openai_key_here
GOOGLE_API_KEY=
GEMINI_API_KEY=
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# ========= Masumi Payments (on-chain settlement) =========
# Used by the Masumi provider adapter in the WorkflowExecutor
MASUMI_API_KEY=your_masumi_api_key_here
MASUMI_API_URL=https://api.masumi.xyz
MASUMI_ENV=testnet   # or "mainnet" when you go live

# ========= Lighter API – currently disabled (all endpoints return 404) =========
LIGHTER_BASE_URL=https://testnet.app.lighter.xyz
LIGHTER_API_KEY_INDEX=0
LIGHTER_API_KEY_PUBLIC=disabled_api_broken
LIGHTER_API_KEY_PRIVATE=disabled_api_broken
ETH_PRIVATE_KEY=disabled_api_broken
LIGHTER_WALLET_ADDRESS=disabled_api_broken

# ========= Email Service Configuration (real-time notifications) =========
SMTP_EMAIL=
SMTP_PASSWORD=PUT_YOUR_16_CHARACTER_GMAIL_APP_PASSWORD_HERE
SMTP_SERVICE=gmail

# Instructions for SMTP_PASSWORD:
# 1. Go to Google Account Settings > Security
# 2. Enable 2-Step Verification (required)
# 3. Generate an "App Password" for this application
# 4. Replace PUT_YOUR_16_CHARACTER_GMAIL_APP_PASSWORD_HERE with the generated password

# ========= Blockfrost + Cardano Testnet =========
BLOCKFROST_PROJECT_ID=
BLOCKFROST_NETWORK=preprod
CARDANO_NETWORK=testnet

# ========= Backpack (optional) =========
BACKPACK_API_KEY=
BACKPACK_API_SECRET=
```

To get the Gmail app password, enable 2FA, create an “App Password,” and paste the 16-character key into `SMTP_PASSWORD`.[1]

3) Run the real-time server (optional but recommended):

```bash
node webhook-server.js
```

This starts the Socket.IO + Blockfrost listener that powers live trade streams and health checks.[1]

## 🔌 API Surface

| Method | Endpoint               | Purpose                                         |
|--------|------------------------|-------------------------------------------------|
| POST   | `/api/nlp`            | Prompt → workflow JSON                          |
| GET    | `/api/nlp`            | Retrieve last parsed workflow                   |
| GET    | `/api/nlp?prompt=...` | Parse prompt via query string                   |
| POST   | `/api/execute`        | Execute a workflow                              |
| GET    | `/api/events`         | Server-Sent Events (workflow status stream)     |
| POST   | `/api/email`          | Trigger email notification                      |
| POST   | `/api/cardano`        | Cardano-related actions                         |
| POST   | `/webhook/blockfrost` | Receive live tx events from Blockfrost server   |
| POST   | `/api/submit-trade`   | Simulated trade endpoint in `webhook-server`    |
| GET    | `/health`             | Health status of real-time server               |
[1]

The main parsing entrypoint is `/api/nlp`, which uses `lib/localParser.ts` to transform natural language into a strictly typed `Workflow`.[1]

## 🧩 Workflow Model

```ts
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

`localParser.ts` infers operators, detects assets, and builds triggers/actions while keeping everything within these interfaces.[1]

## 💡 Example Prompts

- “Buy 10 ADA every 5 seconds and email me.”[1]
- “Buy 10 shares of AAPL at 150 and sell at 180, TP 5%.”[1]
- “Long BTC 10x if price above 50000.”[1]
- “Short NIFTY at 22000, target 21500.”[1]
- “Buy 0.5 ETH, TP 10%, SL 5% and notify trader@domain.com.”[1]

These are parsed into workflows with price or time-based triggers, trade actions, and optional notification actions plus edges connecting them.[1]

## 🎛️ UI & Interaction Flow

This is the section where the full end‑to‑end flow is showcased.

- Screenshots: The hero state and chat list are shown in the two images above.  
- Demo video: WhatsApp Video 2025-11-30 at 13.17.30_a204e475.mp4 – this video walks through prompt → workflow graph → live trades and notifications.

(Embed the video here in your repo using your preferred Markdown or frontend video component.)

For now, the flow is:

1) The user opens the CARDANO × DAN LABS screen and enters a natural-language strategy in the central prompt bar (optionally using voice).[1]
2) On submit, the app calls `/api/nlp`, then animates open the lower “DAN Trading Dashboard” with a React Flow canvas on the left and a live trading dashboard on the right.[1]
3) The canvas renders the parsed workflow as nodes and edges, while the dashboard shows execution controls and real-time output.[1]

Later, you will add another image here showing a candlestick chart with user trades overlaid.

## 📊 Live Trading & Candlesticks

The `TradingDashboard` component subscribes to WebSocket trade events and renders:[1]

- a live feed of submitted and completed trades,  
- aggregated stats for the current workflow, and  
- price and volume charts using Recharts.  

You can enhance this section with a candlestick chart screenshot that highlights executed trades directly on price action.

## 📧 Email Integration

`EMAIL_INTEGRATION_COMPLETE.md` documents the email flow: Nodemailer + Gmail SMTP, HTML templates, and test prompts like “buy 0.1 eth and send notification to your-email@gmail.com.”[1]

- Email service: `src/lib/emailService.ts`.[1]
- API endpoint: `src/app/api/email/route.ts`.[1]
- Execution hook: `src/lib/executor.ts` attaches notifications to workflow actions.[1]

Whenever a notification action fires, the system sends a responsive HTML email that includes workflow details, timestamps, and status.[1]

## 🔗 Providers & Integrations

| Provider / Service   | Role                                  |
|----------------------|---------------------------------------|
| Cardano + Blockfrost | On-chain data and webhook events      |
| Lighter              | Optional execution backend            |
| Masumi               | On-chain settlement via adapter       |
| Backpack             | Optional wallet integration           |
| Socket.IO            | Live trade event streaming            |
| Gemini / OpenAI      | Optional LLM fallback for parsing     |
| Gmail + Nodemailer   | Transaction / alert email delivery    |
[1]

All on-chain sensitive keys live in `.env.local` and are never committed.[1]

## 🧪 Testing

- `node test-email.js` – sends a test email using your SMTP settings.[1]
- `POST /api/submit-trade` on `webhook-server.js` – simulates trades and broadcasts them via Socket.IO.[1]

These utilities help validate infra before running real strategies.[1]

## 📜 License

MIT – built to explore natural language trading agents, Cardano workflows, and real-time visualization.[1]

[1](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/images/30896121/b07e02ba-2512-4cc1-9b22-e29c80f0806d/image.jpeg)
[2](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/images/30896121/3a09fdb2-c6f4-487a-a1ba-8a03f1fcbc13/WhatsApp-Image-2025-11-30-at-12.29.29_be501961.jpg)
