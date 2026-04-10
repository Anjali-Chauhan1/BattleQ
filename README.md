# BATTLEQ: Tactical Web3 Arena 🛡️

**BattleQ** is a high-octane tactical grid-based strategy game. Navigate through shifting sectors, manage high-stakes energy reserves, and extract rare treasures in a high-fidelity "Cyber-Cinematic" environment.

![BattleQ Banner](https://img.shields.io/badge/BattleQ-Cyber--Tactical-00f2ff)
![License](https://img.shields.io/badge/Status-Operational-green)
![Tech](https://img.shields.io/badge/Built%20with-Next.js%20%7C%20Socket.io-black)

## 🕹️ Core Gameplay Mechanics

### 1. Solo Extraction (The Hunt)
*   **Mission Sync**: Lock your credits before entering a sector. Stake 10 credits per level.
*   **Tactical Grid**: Navigate a dynamic grid (`3x3` to `10x10`) to find the hidden treasure.
*   **Energy Management**: Every scan costs charge. Run out of energy, and your stake is **liquidated**.
*   **3D Interaction**: On-click reveals feature a 3D chest opening animation with particle bursts.

### 2. High-Stakes Rewards
*   **Yield Curve**: Successfully extracting treasures returns your stake plus a level-based bonus.
    *   *Level 1*: Stake 10 → Yield **20**
    *   *Level 2*: Stake 20 → Yield **35**
*   **Liquidated Assets**: Failing a mission results in a "Disturbing" system failure screen and forfeiture of staked credits.

### 3. Progressive Difficulty
*   **Trap Detection**: Levels 2+ introduce trap tiles that drain double energy.
*   **Fake Signals**: Multiple fake treasures appear as you advance.
*   **Dynamic Scaling**: Grid size and scan success ratios tighten as you climb the ranks.

---

## 👤 Operative Profile & Intelligence
*   **Strategic Mission Log**: Track your last 5 operations with detailed results and rewards.
*   **Tactical Win Ratio**: Real-time calculation of your success percentage.
*   **Rank Progression**: Advance from **Sector Scout** to **Elite Guard** and **Centurion Prime**.
*   **Global Score**: Persistent credit tracking with rank-based tiering.

---

## 🚀 Technical Stack

*   **Frontend**: [Next.js 15](https://nextjs.org/) (App Router), [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/).
*   **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) with deep mission history persistence.
*   **Animation Engine**: Complex 3D CSS transforms and SVG-based glitch filters.
*   **Icons**: [Lucide React](https://lucide.dev/).
*   **Backend**: Node.js & Socket.io (for future multiplayer scalability).

---

## 🛠️ Setup & Operations

### 1. Intelligence Installation
Clone the repository and install tactical dependencies:
```bash
npm install
```

### 2. Launch Operational Console (Client)
Start the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to begin your mission.

---

## 📂 Project Structure

```text
├── src/
│   ├── app/            # Tactical Routes (Lobby, Arena, Profile)
│   ├── components/     
│   │   ├── solo/       # Mission Logic (Grid, Staking, Loss/Win Cards)
│   │   └── ui/         # Glass-Panel Design System
│   ├── store/          # Global Persistence & Difficulty Logic
│   └── lib/            # User & Contract Protocols
```

---

## ⚠️ Tactical Warning
This is a high-stakes environment. Unauthorized disconnects or energy depletion will result in immediate asset liquidation.

**Status: READY FOR DEPLOYMENT.**
