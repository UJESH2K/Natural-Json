# CARDANO × DAN LABS

AI-powered trading agent that turns plain English like “buy 10 ADA every 5 seconds and send me a mail” into executable workflows, runs them on Cardano, and streams live trades and notifications in real time.[1]

## 🌌 Hero Experience

The app opens with a full-screen “CARDANO × DAN LABS” hero, a glowing aurora background, and a single central prompt bar where the user can type or speak strategies such as “Buy 10 ADA every 5 seconds and send me a mail.”[1]

On the left, users see a chat-style history of all previously created agents and prompts, making it feel like a trading copilot rather than a static form.[2]

## 🧠 What This Project Does

* Converts natural language strategies into strict JSON workflows (triggers, actions, edges).[1]
* Visualizes workflows as interactive graphs with animated nodes using React Flow.[1]
* Executes trades against configured providers (Cardano, Lighter, etc.) and simulates when needed.[1]
* Sends real-time HTML email notifications whenever a workflow runs.[1]
* Streams trade events live into a dashboard using Socket.IO.[1]

At a high level, you talk to the system like an AI agent, it compiles your intent into a workflow, and then that workflow becomes a live trading strategy with full observability.[1]

## 🚀 Core Features

* Natural-language → JSON workflow parsing with a local regex-based NLP engine.[1]
* Zero external AI requirement, with optional Gemini/OpenAI fallback.[1]
* Cardano integration via Blockfrost webhooks and a dedicated real-time server.[1]
* Email alerts via Nodemailer, Gmail SMTP, and responsive HTML templates.[1]
* Animated, dark-mode trading canvas powered by TailwindCSS and custom shaders.[1]
* Live dashboard with charts, trade history, and action statuses.[1]
* Persistent chat history stored in the browser, so each strategy is a “session” you can revisit.[1]

## 🏗️ Architecture Overview

```txt
(Architecture tree unchanged for brevity)
```

## 📦 Setup & Installation

(Setup section preserved)

## 🔌 API Surface

(API table preserved)

## 🧩 Workflow Model

(Interfaces preserved)

## 💡 Example Prompts

(Prompts preserved)

## 🎛️ UI & Interaction Flow

### 📸 Screenshots

[1](./public/WhatsApp%20Image%202025-11-30%20at%2012.29.23_69d0b8f0.jpg)
[2](./public/WhatsApp%20Image%202025-11-30%20at%2012.30.26_ce6f6aa0.jpg)

### 🎥 Demo Video

[▶️ Watch the demo video](./public/WhatsApp%20Video%202025-11-30%20at%2013.17.30_a204e475.mp4)

---

1. The user opens the CARDANO × DAN LABS screen and enters a natural-language strategy in the central prompt bar (optionally using voice).[1]
2. On submit, the app calls `/api/nlp`, then animates open the lower “DAN Trading Dashboard” with a React Flow canvas on the left and a live trading dashboard on the right.[1]
3. The canvas renders the parsed workflow as nodes and edges, while the dashboard shows execution controls and real-time output.[1]

## 📊 Live Trading & Candlesticks

(The section preserved with placeholder note)

## 📧 Email Integration

(Email integration section preserved)

## 🔗 Providers & Integrations

(Providers table preserved)

## 🧪 Testing

(Testing section preserved)

## 📜 License

MIT – built to explore natural language trading agents, Cardano workflows, and real-time visualization.

---

[1](./public/WhatsApp%20Image%202025-11-30%20at%2012.29.23_69d0b8f0.jpg)
[2](./public/WhatsApp%20Image%202025-11-30%20at%2012.30.26_ce6f6aa0.jpg)
[Video](./public/WhatsApp%20Video%202025-11-30%20at%2013.17.30_a204e475.mp4)
