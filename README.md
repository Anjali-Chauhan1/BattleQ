# BattleQ

BattleQ is a cyber-tactical arena game built with Next.js, React, Socket.IO, Zustand, Wagmi, RainbowKit, Viem, and Hardhat. It combines solo progression, multiplayer duels, and BTQ token staking into one wallet-authenticated experience.

The codebase is split into three layers:

- the web app in Next.js
- the standalone socket game server
- the BTQ smart contract and deployment tooling

## Overview

BattleQ centers on tactical decision-making, wallet identity, and token-based progression.

- Solo mode is the main single-player loop.
- Duel mode uses sockets for real-time multiplayer play.
- Wallet connection is required for gameplay access.
- BTQ is the staking and reward currency.
- Tutorial and onboarding state are scoped per wallet.

## Core Features

### Solo Mode

- Practice rounds 1 to 3 are beginner missions.
- Practice rounds are one-time per wallet.
- Elite arena is the repeatable main solo gameplay.
- Solo missions require BTQ stake confirmation before play.
- Elite stake is editable but capped at 1000 BTQ.
- Minimum withdraw amount is 150 BTQ.

### Multiplayer Duel Mode

- Socket-driven real-time gameplay.
- Room-based match entry.
- Shared game state with turn-based interactions.
- Separate server process for low-latency updates.

### Wallet and BTQ Flow

- Wallet address is used as the player identity.
- BTQ balance is synced from the connected chain.
- Players can buy BTQ through the wallet panel.
- Players can sell BTQ only when the balance meets the minimum withdraw threshold.

### Onboarding

- Tutorial completion is stored per wallet.
- Solo onboarding and arena tour do not repeat for the same wallet.
- Practice completion also persists per wallet.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Framer Motion
- Zustand
- Socket.IO
- Express
- Wagmi
- RainbowKit
- Viem
- Hardhat

## Project Structure

```text
BattleQ/
├── contracts/             # Solidity contracts
├── deploy/                # Deployment helpers
├── scripts/               # Startup and deployment scripts
├── src/
│   ├── app/               # App Router pages and API routes
│   ├── components/        # UI, wallet, solo, duel, and shared components
│   ├── hooks/             # Web3 and sync hooks
│   ├── lib/               # Local player helpers
│   ├── server/            # Socket.IO game server
│   └── store/             # Zustand game state
├── public/                # Static assets
├── hardhat.config.ts      # Hardhat configuration
├── next.config.ts         # Next.js configuration
└── package.json           # Scripts and dependencies
```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm
- A wallet extension such as MetaMask
- RPC access for the target chain

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create a `.env.local` file in the project root.

```bash
# Frontend
NEXT_PUBLIC_SOCKET_URL=http://127.0.0.1:3001
NEXT_PUBLIC_BTQ_ADDRESS=0xYourDeployedBTQContract
NEXT_PUBLIC_BTQ_RATE_NATIVE_PER_BTQ=0.001

# Optional chain-specific addresses
NEXT_PUBLIC_BTQ_ADDRESS_ROBINHOOD=0xYourRobinhoodContract
NEXT_PUBLIC_BTQ_ADDRESS_ARBITRUM_SEPOLIA=0xYourArbitrumSepoliaContract

# Optional chain config used by the wallet provider
NEXT_PUBLIC_ROBINHOOD_CHAIN_ID=1337
NEXT_PUBLIC_ROBINHOOD_RPC=https://your-robinhood-rpc
NEXT_PUBLIC_ROBINHOOD_EXPLORER=https://your-robinhood-explorer

# Deployment
PRIVATE_KEY=your_private_key
ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
ARBITRUM_ONE_RPC=https://arb1.arbitrum.io/rpc
ROBINHOOD_TESTNET_RPC=https://your-robinhood-rpc
ROBINHOOD_CHAIN_ID=1337
```

If BTQ contract variables are missing, the wallet UI can still render, but buying, selling, and staking flows will not work correctly.

## Running Locally

### Start the full app

```bash
npm run dev
```

This starts:

- Next.js on `http://localhost:3000`
- the socket server on `http://localhost:3001`

### Start only the web app

```bash
npm run dev:next
```

### Start only the socket server

```bash
npm run dev:server
```

## Build and Production Start

### Build

```bash
npm run build
```

This runs the web build and the server TypeScript build.

### Start production

```bash
npm run start
```

This launches the built Next.js app and the compiled socket server together.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the web app and socket server together |
| `npm run dev:next` | Start Next.js dev server only |
| `npm run dev:server` | Start the Socket.IO game server only |
| `npm run build:web` | Build the Next.js app |
| `npm run build:server` | Type-check and compile the server code |
| `npm run build` | Run both build steps |
| `npm run start` | Start the production web app and server |
| `npm run deploy:arbitrum-sepolia` | Deploy the BTQ contract to Arbitrum Sepolia |
| `npm run deploy:arbitrum-one` | Deploy the BTQ contract to Arbitrum One |
| `npm run deploy:robinhood` | Deploy the BTQ contract to Robinhood Testnet |

Note: `npm run lint` currently uses `next lint`, which is not the most reliable validation path for this setup. Prefer `npm run build` for a full project check.

## Gameplay Flow

### Solo Flow

1. Connect a wallet.
2. Open the lobby.
3. Buy BTQ if needed.
4. Enter Solo mode.
5. Select a practice round or elite arena.
6. Confirm the stake.
7. Play the mission.
8. Claim the win or pay the penalty.

### Duel Flow

1. Connect a wallet.
2. Enter Duel mode from the arena.
3. Join or create a room.
4. Wait for match synchronization.
5. Play against another wallet in real time.

## BTQ Token System

BTQ is the in-game currency used for staking and reward flows.

- Default rate: `1 BTQ = 0.001 native token`
- Buying BTQ uses the connected wallet and chain.
- Selling BTQ withdraws native value back to the wallet.
- Minimum withdraw amount: `150 BTQ`
- Elite solo stake cap: `1000 BTQ`

### Supported Chain Behavior

The app prefers chain-specific BTQ addresses when available.

- `NEXT_PUBLIC_BTQ_ADDRESS_ROBINHOOD`
- `NEXT_PUBLIC_BTQ_ADDRESS_ARBITRUM_SEPOLIA`
- `NEXT_PUBLIC_BTQ_ADDRESS`

If a chain-specific address exists, it overrides the generic fallback.

## Smart Contract and Deployment

The BTQ token contract lives in `contracts/BTQToken.sol`.

It supports:

- ERC20 token behavior
- `buy()` for swapping native tokens into BTQ
- `sell(uint256 btqAmount)` for withdrawing BTQ value
- owner-controlled rate and withdrawal logic

### Deploying BTQ

```bash
npm run deploy:arbitrum-sepolia
npm run deploy:arbitrum-one
npm run deploy:robinhood
```

After deployment, set the contract address in `.env.local`.

```bash
NEXT_PUBLIC_BTQ_ADDRESS=0x...
```

## Wallet and Identity

- Wallet connection is handled by Wagmi and RainbowKit.
- The connected wallet address is used as the player id.
- The app stores a short display id in localStorage for UI purposes.
- Practice completion and tutorial completion are stored per wallet.

## Troubleshooting

### Wallet does not connect

- Make sure the wallet extension is installed and unlocked.
- Confirm the RainbowKit wallet prompt is enabled.
- Refresh the page and reconnect.

### BTQ balance is not showing

- Check the connected chain.
- Verify the BTQ contract address is configured.
- Confirm the RPC endpoint is reachable.

### Buy or sell transactions fail

- Verify the connected chain is supported.
- Confirm the BTQ contract address exists for that chain.
- Make sure the wallet has enough native gas.
- Check the on-chain rate and contract deployment.

### Withdraw is disabled

- The balance must be at least 150 BTQ.
- The sell button remains disabled below that threshold.

### Elite arena is missing

- Elite arena opens after the practice rounds are cleared.
- Practice progression is stored per wallet.

## Validation

- Use `npm run build` for the most reliable full-project validation.
- The server build is compiled separately with `npm run build:server`.

## License

No explicit license is defined in this repository yet. Add one before publishing the project externally.