# BATTLEQ: Tactical Web3 Arena 🛡️

**BattleQ** is a high-octane, real-time multiplayer strategy game built for the next generation of on-chain gaming. Maneuver through a shifting 15x15 tactical grid, form strategic alliances, and out-smart your opponents in a behavior-driven arena.

![BattleQ Banner](https://img.shields.io/badge/BattleQ-Cyber--Tactical-00f2ff)
![License](https://img.shields.io/badge/Status-Operational-green)
![Tech](https://img.shields.io/badge/Built%20with-Next.js%20%7C%20Socket.io-black)

## 🕹️ Core Gameplay Mechanics

### 1. Dynamic Sector Migration
The arena is alive. Capture zones (Yellow Sectors) relocate every **30 seconds**. Stagnation is death—operatives must constantly re-position to stay in the yield.

### 2. Tactical Alliances & Betrayal
*   **Pact Formation**: Request a vision link with nearby players to share yields (+10 alliance bonus).
*   **The Snatch Mechanic**: Betray your allies to seize their tokens instantly, but at the cost of your global Reputation.
*   **Split Yield**: Cooperatively divide resources in Alliance mode for stable, long-term gains.

### 3. Smart Scoring Engine
Feedback is authentic. Points are earned through:
*   **Passive Yield**: +5/sec inside capture zones.
*   **Strike Engagement**: +25 for successful combat maneuvers.
*   **Discovery Bonus**: Rewards for being the first to enter a newly relocated sector.

---

## 🚀 Technical Stack

*   **Frontend**: [Next.js 14](https://nextjs.org/) (App Router), [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/).
*   **Backend**: [Node.js](https://nodejs.org/) & [Socket.io](https://socket.io/) for real-time synchronization.
*   **Icons**: [Lucide React](https://lucide.dev/).
*   **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) with Persistence.

---

## 🛠️ Setup & Operations

### 1. Intelligence Installation
Clone the repository and install tactical dependencies:
```bash
npm install
```

### 2. Deploy Game Engine (Server)
Start the Socket.io backend in a separate terminal:
```bash
npm run server
```
*Note: Make sure port 3001 is available.*

### 3. Launch Operational Console (Client)
Start the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to begin your mission.

---

## 📐 Design Philosophy: "Cyber-Cinematic"
BattleQ utilizes a custom **Glass-Panel Design System**.
*   **High-Contrast HSL Palettes**: Deep blacks (#020203) with Neon Blue (Primary) and Magenta (Accent).
*   **Spatial Hierarchy**: 7xl standard containers with consistent vertical rhythms.
*   **Motion Intelligence**: Viewport-aware tooltips and layout animations that react to the grid's state.

---

## 📂 Project Structure

```text
├── src/
│   ├── app/            # Tactical Routes (Lobby, Arena, Profile)
│   ├── components/     # UI/UX Modules (Tutorial, RoomCard, HUD)
│   ├── hooks/          # Operational Hooks (useSocket)
│   ├── server/         # Game Engine Logic (Socket.io)
│   └── store/          # Global Persistence & State
```

---

## ⚠️ Tactical Warning
This is a high-stakes environment. All decisions are final. Maintain your Reputation to unlock Elite-grade sectors.

**Status: READY FOR DEPLOYMENT.**
