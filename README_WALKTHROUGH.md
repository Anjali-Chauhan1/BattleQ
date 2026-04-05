# BattleQ: Full-Stack Web3 Strategy Arena

BattleQ is a high-engagement, behavior-driven multiplayer game built as a dedicated **Initia Rollup**. It leverages real-time interactions and Web3 staking to create a competitive, reward-based ecosystem.

---

## 🚀 Key Features

### 1. 🧠 Behavioral Retention Loop
- **Smart Feedback**: Players receive real-time rewards like "Smart Move +20" and "Near-Win Luck" (subtle nudges to keep players in the flow state).
- **Matchmaking & AI**: Rooms are filled with a mix of real players and adaptive bots (Sentinel drones) that scale based on player level.
- **Fog of War**: Grid-based map system where limited visibility forces strategic decisions.

### 2. 🤝 Alliance & Social Dynamics
- **Alliances**: Form temporary pacts with other players to share resource zones.
- **Snatch vs Split**: At the end of resource yields, players can choose to share rewards or "Snatch" (betray) for a high-risk token gain, damaging their **Reputation**.

### 3. 🔗 Initia Native Features
- **AppChain / Rollup**: Architected for the **`battleq-rollup-1`**. 
- **Session UX (Auto-signing)**: Accessible in the Profile, allowing the game to auto-sign repetitive gameplay transactions for a seamless experience.
- **Initia Usernames (.init)**: Native resolving of user identities for personalized leaderboards.

---

## 🛠️ Technology Stack
- **Next.js & TypeScript**: Frontend Framework.
- **Tailwind CSS 4 & Framer Motion**: Advanced gaming UI and glassmorphism.
- **Socket.io (Node.js)**: Real-time game state engine and conflict resolution.
- **Zustand**: Frontend state management for low-latency synchronization.
- **InterwovenKit (@initia/interwovenkit-react)**: Wallet connectivity and rollup interaction.

---

## 🏗️ Getting Started
1. `npm install`
2. `npm run dev`
   - This starts both the **Next.js App (:3000)** and the **BattleQ Game Server (:3001)**.

---
*Built for the Initia Interwoven Hackathon.*
