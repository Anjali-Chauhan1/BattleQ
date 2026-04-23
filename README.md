# BattleQ ⚔️

> A cyberpunk blockchain gaming platform built on **Initia** — stake tokens, hunt treasures, and compete in real-time duels.

![Track: Gaming](https://img.shields.io/badge/Track-Gaming-00f2ff?style=for-the-badge)
![Built on Initia](https://img.shields.io/badge/Built%20on-Initia-5C36FF?style=for-the-badge)
![InterwovenKit](https://img.shields.io/badge/InterwovenKit-Integrated-00ffa3?style=for-the-badge)

---

## 🎮 What is BattleQ?

BattleQ is a high-stakes cyberpunk gaming platform deployed as an **Initia appchain (EVM rollup)**. Players connect their wallets, stake tokens, and compete in two game modes:

### Solo Mode — Treasure Hunt
- Choose a difficulty level (1-3 Practice, 4+ Elite Arena)
- Stake tokens on-chain to the treasury
- Navigate a cyber-grid to find hidden treasures before running out of moves
- Win → receive multiplied payout from the house wallet
- Lose → stake is forfeited to the treasury

### Duel Mode — PvP Chest Battle
- Create or join rooms with room codes
- Both players bet tokens into a shared pot
- Take turns opening chests containing weapons, health, and power-ups
- Last player standing wins the entire pot

---

## 🔗 Initia Integration

### InterwovenKit (`@initia/interwovenkit-react`)
- **Wallet Connection**: Primary wallet connection via `InterwovenKitProvider` with `initiaPrivyWalletConnector`
- **Transaction Handling**: All staking and payout transactions flow through the Initia rollup

### Initia-Native Features
1. **Auto-Signing / Session UX**: Enabled via `enableAutoSign={true}` — players can approve transactions without repeated wallet popups during gameplay
2. **Initia Usernames (.init)**: Player profiles display `.init` usernames via `useUsernameQuery()` hook

### Rollup Deployment
- **VM**: EVM
- **Chain ID**: `BattleQ`
- **Deployed via**: Weave CLI (`weave rollup launch --vm evm`)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                Browser / Player                  │
│  MetaMask / Initia Wallet (InterwovenKit)       │
└──────────┬──────────────────────────┬───────────┘
           │                          │
           ▼                          ▼
┌──────────────────┐      ┌───────────────────────┐
│  Next.js on      │      │  Game Server          │
│  Vercel          │      │  (Socket.IO)          │
│                  │      │                       │
│  /api/auth/*     │      │  Solo rounds          │
│  /api/rollup/*   │      │  Duel matchmaking     │
│  (stake/payout/  │      │  AI opponents         │
│   forfeit)       │      │  Real-time events     │
└──────┬───────────┘      └───────────────────────┘
       │
       ▼
┌──────────────────┐      ┌───────────────────────┐
│  Initia EVM      │      │  Upstash Redis        │
│  Rollup          │      │  (Auth + Stake State) │
│                  │      │                       │
│  Treasury Wallet │      │  Nonces, Sessions,    │
│  House Wallet    │      │  Pending Stakes       │
└──────────────────┘      └───────────────────────┘
```

---

## 💰 Money Flow

1. **Stake**: Player sends INIT tokens → Treasury address (`0xa0a3...E1F8`)
2. **Play**: Game runs (solo treasure hunt or PvP duel)
3. **Win**: House wallet sends payout (stake × multiplier) back to player
4. **Lose**: Stake stays in treasury; pending record is cleared

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- MetaMask or Initia Wallet

### Local Development

```bash
# Install dependencies
npm install

# Start the Next.js app
npm run dev

# In a separate terminal, start the game server
npm run build:server && node dist/server/gameServer.js
```

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

Key variables:
| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_ROLLUP_JSON_RPC` | Your rollup's EVM RPC endpoint |
| `NEXT_PUBLIC_BATTLEQ_TREASURY` | Treasury wallet address |
| `ROLLUP_HOUSE_PRIVATE_KEY` | House wallet private key (server-side) |
| `UPSTASH_REDIS_REST_URL` | Redis for auth state (required on Vercel) |
| `NEXT_PUBLIC_SOCKET_URL` | Game server URL |

### Deploy to Vercel

```bash
npx vercel --prod
```

Set environment variables in Vercel dashboard → Settings → Environment Variables.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── lobby/page.tsx        # Game mode selection
│   ├── arena/page.tsx        # Main game (solo + duel)
│   ├── profile/page.tsx      # Player profile + stats
│   ├── result/page.tsx       # Game results
│   └── api/
│       ├── auth/             # Wallet authentication
│       └── rollup/           # Stake, payout, forfeit
├── components/
│   ├── providers/Web3Provider.tsx  # InterwovenKit + Wagmi
│   ├── shared/AuthGuard.tsx        # Wallet auth gate
│   ├── solo/                       # Solo game components
│   └── game/                       # Multiplayer components
├── hooks/
│   ├── useRollupSolo.ts     # On-chain staking hook
│   └── useSocket.ts         # Socket.IO connection
├── lib/rollup/
│   ├── config.ts            # Rollup configuration
│   ├── chain.ts             # Viem chain definition
│   └── server/              # Server-side clients
├── server/
│   └── gameServer.ts        # Socket.IO game server
└── store/
    └── useGameStore.ts      # Zustand game state
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 16** | Frontend framework |
| **TypeScript** | Type safety |
| **@initia/interwovenkit-react** | Initia wallet integration |
| **Wagmi + Viem** | EVM interactions |
| **Socket.IO** | Real-time multiplayer |
| **Zustand** | Client state management |
| **Upstash Redis** | Serverless auth/stake persistence |
| **Framer Motion** | Animations |
| **Lucide React** | Icons |

---

## 📜 License

MIT
