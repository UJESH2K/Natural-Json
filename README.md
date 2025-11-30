CARDANO × DAN LABS  

<img src="/5.png" width="120" />

AI-powered trading agent that turns plain English like “buy 10 ADA every 5 seconds and send me a mail” into executable workflows, runs them on Cardano, and streams live trades and notifications in real time.[1]

The app opens with a full-screen “CARDANO × DAN LABS” hero, a glowing aurora background, and a single central prompt bar where the user can type or speak strategies such as “Buy 10 ADA every 5 seconds and send me a mail.”[1]

Screenshot 1 – Initial hero screen with prompt:  
![1](/1.jpg)

Screenshot 2 – Focused hero with collapsed sidebar:  
![2](/2.jpg)

On the left, users see a chat-style history of all previously created agents and prompts, making it feel like a trading copilot rather than a static form.[1]

This project converts natural language strategies into strict JSON workflows (triggers, actions, edges).[1]  
It visualizes workflows as interactive graphs with animated nodes using React Flow.[1]  
Executes trades against configured providers (Cardano, Lighter, Masumi, etc.) and simulates when needed.[1]  
Sends real-time HTML email notifications whenever a workflow runs.[1]  
Streams trade events live into a dashboard using Socket.IO.[1]  
At a high level, you talk to the system like an AI agent, it compiles your intent into a workflow, and then that workflow becomes a live trading strategy with full observability.[1]

Natural-language → JSON workflow parsing with a local regex-based NLP engine.[1]  
Zero external AI requirement, with optional Gemini/OpenAI fallback.[1]  
Cardano integration via Blockfrost webhooks and a dedicated real-time server.[1]  
Email alerts via Nodemailer, Gmail SMTP, and responsive HTML templates.[1]  
Animated, dark-mode trading canvas powered by TailwindCSS and custom shaders.[1]  
Live dashboard with charts, trade history, and action statuses.[1]  
Persistent chat history stored in the browser, so each strategy is a “session” you can revisit.[1]

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

Tech stack: Next.js 16, TypeScript, TailwindCSS, @xyflow/react, Recharts, Socket.IO, Blockfrost, Nodemailer.[1]

SETUP & INSTALLATION EVERYTHING HERE IN ONE BLOCK:

git clone <your-repo-url>  
cd ujesh2k-natural-json  
npm install  
npm run dev  
Open http://localhost:3000 in your browser.

.env.local CONTENT EXACTLY AS YOU GAVE (NO REMOVALS):

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

Run the real-time server:  
node webhook-server.js

API ENDPOINTS (FULL LIST):

POST /api/nlp  
GET /api/nlp  
GET /api/nlp?prompt=...  
POST /api/execute  
GET /api/events  
POST /api/email  
POST /api/cardano  
POST /webhook/blockfrost  
POST /api/submit-trade  
GET /health  

The main parsing entrypoint is /api/nlp using lib/localParser.ts.[1]

Exact Workflow Model (copied 1:1):

interface Workflow { id: string; name: string; triggers: PriceTrigger[]; actions: (TradeAction | NotificationAction)[]; edges: { from: string; to: string }[] }
interface PriceTrigger { id: string; type: "PriceTrigger"; asset: string; operator: ">=" | "<=" | ">" | "<"; value: number }
interface TradeAction { id: string; type: "TradeAction"; side: "buy" | "sell" | "long" | "short"; asset: string; amount: number; leverage?: number; takeProfit?: number; takeProfitPercent?: number; stopLoss?: number; stopLossPercent?: number }
interface NotificationAction { id: string; type: "NotificationAction"; channel: "email" | "sms" | "discord"; to: string; message?: string }

Example Prompts EXACTLY AS YOU WROTE:

“Buy 10 ADA every 5 seconds and email me.”  
“Buy 10 shares of AAPL at 150 and sell at 180, TP 5%.”  
“Long BTC 10x if price above 50000.”  
“Short NIFTY at 22000, target 21500.”  
“Buy 0.5 ETH, TP 10%, SL 5% and notify trader@domain.com.”  

UI & Interaction Flow text EXACTLY as you wrote:

Screenshots: The hero state and chat list are shown in the two images above.  
Demo video: WhatsApp Video 2025-11-30 at 13.17.30_a204e475.mp4 – this video walks through prompt → workflow graph → live trades and notifications.

VIDEO EMBED (USING YOUR LOCAL FILE /6.mp4):

<video width="700" controls>
  <source src="/6.mp4" type="video/mp4" />
</video>

More UI screenshots:  
![3](/3.jpg)  
![4](/4.jpg)

Flow (exact words preserved):

1) User opens CARDANO × DAN LABS screen and enters a natural-language strategy.  
2) App calls /api/nlp, then opens DAN Trading Dashboard.  
3) Canvas shows workflow. Dashboard shows controls + real-time output.

Live Trading & Candlesticks EXACT (no removal):

The TradingDashboard subscribes to WebSocket trade events.[1]  
Live trades, stats, price & volume charts, etc.

Candlestick screenshot:  
![7](/7.jpg)

Email Integration EXACT YOU WROTE:

EMAIL_INTEGRATION_COMPLETE.md documents the flow.  
Email service: src/lib/emailService.ts.  
API endpoint: src/app/api/email/route.ts.  
executor.ts attaches notifications.  
HTML emails with workflow detail + timestamps.[1]

Providers EXACT:

Cardano + Blockfrost, Lighter, Masumi, Backpack, Socket.IO, Gemini/OpenAI, Gmail + Nodemailer.[1]

Testing EXACT:

node test-email.js  
POST /api/submit-trade  

License EXACT:

MIT – built to explore natural language trading agents, Cardano workflows, and real-time visualization.[1]

Original Reference Links:
[1](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/images/30896121/b07e02ba-2512-4cc1-9b22-e29c80f0806d/image.jpeg)  
[2](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/images/30896121/3a09fdb2-c6f4-487a-a1ba-8a03f1fcbc13/WhatsApp-Image-2025-11-30-at-12.29.29_be501961.jpg)

