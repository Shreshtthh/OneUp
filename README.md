# OneUp ⚔️ OneChain Colosseum

> **Where Traders Become Gladiators.**  
> *Built for the OneHack 2025 Hackathon.*

## 📖 Introduction

**OneUp** is a high-stakes, 1v1 trading battle arena built on **OneChain**. It bridges the gap between **GameFi** and **DeFi** by allowing users to wager native tokens (OCT) on their trading skills in real-time.

Instead of passive staking, players enter a "Duel," lock a wager, and compete to achieve the highest **Return on Investment (ROI)** within a set time limit using a simulated trading environment.

### 🏆 The Vision
OneChain is built for speed and finance. OneUp leverages OneChain's near-instant finality to create a trading experience that feels like a competitive eSport. We aren't just trading tokens; we are gamifying market volatility.

---

## 🎮 How It Works

1. **Create a Duel:** A user (Creator) sets a wager amount (e.g., 10 OCT) and a duration (e.g., 5 minutes). The wager is deposited into a smart contract escrow.
2. **Accept Challenge:** An Opponent matches the wager to join the lobby.
3. **The Arena:**
   * Both players start with a virtual portfolio equal to the wager amount.
   * They interact with a **Mock DEX** on-chain to swap between `OCT` and `MOCK_USD`.
   * **Rule:** To ensure fairness, players cannot add outside funds. They can only trade with the wagered principal.
4. **Live Tracking:** The frontend visualizes live price feeds and comparative ROI charts using `lightweight-charts`.
5. **Resolution:**
   * Once the timer expires, our **Automated Referee** (backend indexer) calculates the final portfolio value of both players.
   * The player with the higher ROI wins the **entire pot** (minus a 2.5% protocol fee).
   * Funds are automatically transferred to the winner's wallet.

---

## ⚖️ Fairness & Volatility Mechanics (Important!)

We have engineered a specific system to ensure duels measure **pure trading skill**, rather than lucky market movements of the base asset.

### **The "Locked Price" System**
To prevent users from profiting simply by holding the wagered token during a market pump, we utilize a **Locked Starting Price**.

* **Snapshot:** When a duel begins, we lock the current OCT price (e.g., **$3.50**).
* **Trading:** Users swap their wagered OCT ↔ USD using live market fluctuations during the game.
* **Settlement:** At the end of the duel, we calculate the final portfolio value using the **same initial locked price ($3.50)**.

### **Why is this necessary?**
Without this mechanism, if the real-world price of OCT rose to $4.00 during the duel, a player could simply hold their OCT and register a profit without making a single trade.

By locking the valuation price:
1. **Volatility is Excluded:** Real-world OCT price volatility does **not** affect the final ROI calculation.
2. **Skill is Isolated:** ROI is generated strictly from the user's decisions to swap between assets.
3. **Fair Competition:** Both players trade against the same "frozen" exchange rate baseline throughout the duel.

> **Summary:** You can't win just because the market went up. You win because you traded better than your opponent.

---

## 🏗️ Tech Stack

OneUp is a full-stack Web3 application leveraging the OneChain ecosystem.

### **Smart Contracts (Move)**
* **Framework:** OneChain Move (Sui-compatible)
* **Modules:**
  * `duel.move`: Manages game state (Open, Active, Resolved), escrows funds, and emits game events.
  * `mock_dex.move`: A fully functional AMM allowing swaps between OCT and MUSD to simulate market movements.

### **Frontend**
* **Framework:** React + Vite + TypeScript
* **Styling:** Tailwind CSS (Cyber/Ethereal aesthetic)
* **Web3 Integration:** `@mysten/dapp-kit` for OneWallet connection and transaction signing.
* **State Management:** `@tanstack/react-query` for real-time blockchain state syncing.
* **Visualization:** `lightweight-charts` for financial graphing.

### **Backend / Infrastructure**
* **Referee Service:** A TypeScript-based Node.js worker.
* **Function:** Listens for `DuelJoined` events, tracks game timers, and executes the `resolve` transaction on-chain when time expires.
* **Persistence:** Local JSON state management to survive restarts.

---

## 🚀 Key Features

* **⚡ Instant On-Chain Actions:** Leveraging OneChain's speed for snappy trade execution.
* **🔒 Trustless Escrow:** Wagers are locked in Move smart contracts; no one can steal the pot.
* **📈 Real-Time ROI Charts:** Watch your performance against your opponent second-by-second.
* **🤖 Automated Settlement:** No manual claiming required. The Referee service ensures games end promptly and winners get paid.
* **🎨 Immersive UI:** A "Glassmorphism" and Neon design language tailored for gamers.

---

## 🛠️ Installation & Setup

### Prerequisites
* Node.js (v18+)
* pnpm or npm
* OneChain Wallet extension installed.

### 1. Smart Contracts
The contracts are located in the `oneup` directory.
```bash
cd oneup
# Build the contracts
sui move build

# Publish to OneChain Testnet
sui client publish --gas-budget 100000000
```
**Note:** Update the `PACKAGE_ID` in `frontend/src/lib/constants.ts` after deployment.

### 2. Frontend Client
```bash
cd frontend
npm install

# Create .env file if necessary, though constants are mostly in src/lib/constants.ts
npm run dev
```
Open http://localhost:5173 to launch the Colosseum.

### 3. Backend Referee
The referee is required to auto-resolve games.
```bash
cd backend
npm install

# You need an Admin Wallet with gas to resolve games
# Create a .env file in /backend
# ADMIN_PRIVATE_KEY=suiprivkey...
# PACKAGE_ID=...
# ADMIN_CAP_ID=...

npx tsx referee.ts
```

---

## 📸 Screen Previews

### The Lobby
*Browse active challenges*

### The Arena
*Live trading vs Opponent*

---

## 📜 Contract Architecture

The core logic resides in `oneup/sources/duel.move`:

```move
public struct Duel<phantom T> has key {
    id: UID,
    creator: address,
    opponent: Option<address>,
    wager_coins: Balance<T>,
    wager_amount: u64,
    duration: u64,
    start_time: Option<u64>,
    status: u8, // 0: Open, 1: Active, 2: Resolved
}
```

The game follows a strict state machine:
```
create() -> join() -> Active State (Trading) -> resolve()
```

---

## 🔮 Future Roadmap

* **Multi-Token Support:** Allow wagering in USDC, USDT, and OneChain RWA tokens.
* **Tournaments:** Bracket-style trading competitions with grand prizes.
* **NFT Integration:** "Gladiator Skins" for your player card that provide slight fee discounts.
* **Mainnet Launch:** Deploying on OneChain Mainnet.

---

## 👥 Team

Built with ❤️ for OneHack 2025.

[Your Name/Team Name] - Full Stack Developer & Move Engineer

---

## 📄 License

This project is licensed under the MIT License.
