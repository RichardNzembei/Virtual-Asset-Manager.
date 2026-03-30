# TRAMIA Platform — Complete Business Process User Guide

> **Version:** 2.0 | **Last Updated:** March 2026
> **Platform:** TRAMIA Virtual Assets Infrastructure
> **Jurisdiction:** Kenya (Capital Markets Authority, Financial Reporting Centre)

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [User Roles & Access Permissions](#2-user-roles--access-permissions)
3. [Customer Onboarding & Authentication](#3-customer-onboarding--authentication)
4. [Digital Wallet Management](#4-digital-wallet-management)
5. [Fiat On-Ramp: Depositing KES](#5-fiat-on-ramp-depositing-kes)
6. [Fiat Off-Ramp: Withdrawing KES](#6-fiat-off-ramp-withdrawing-kes)
7. [Trading on the DEX](#7-trading-on-the-dex)
8. [Real-World Asset Tokenization (Issuer Guide)](#8-real-world-asset-tokenization-issuer-guide)
9. [Investing in Tokenized Offerings](#9-investing-in-tokenized-offerings)
10. [Compliance & AML Operations (Admin Guide)](#10-compliance--aml-operations-admin-guide)
11. [KYC Review & Management (Admin Guide)](#11-kyc-review--management-admin-guide)
12. [Regulatory Reporting (Admin Guide)](#12-regulatory-reporting-admin-guide)
13. [Admin Dashboard & Platform Monitoring](#13-admin-dashboard--platform-monitoring)
14. [Tokenization Pipeline Management (Admin Guide)](#14-tokenization-pipeline-management-admin-guide)
15. [Trading Monitoring (Admin Guide)](#15-trading-monitoring-admin-guide)
16. [Account Settings & Profile](#16-account-settings--profile)
17. [Appendix A: Fee Schedule](#appendix-a-fee-schedule)
18. [Appendix B: KYC Tiers & Transaction Limits](#appendix-b-kyc-tiers--transaction-limits)
19. [Appendix C: Supported Assets & Trading Pairs](#appendix-c-supported-assets--trading-pairs)
20. [Appendix D: AML Risk Scoring & Thresholds](#appendix-d-aml-risk-scoring--thresholds)
21. [Appendix E: State Transition Reference](#appendix-e-state-transition-reference)
22. [Appendix F: Demo Accounts & Test Data](#appendix-f-demo-accounts--test-data)

---

## 1. Platform Overview

TRAMIA is a regulated virtual assets infrastructure platform designed for the Kenyan financial market. It bridges traditional banking (KCB Bank, powered by Temenos T24) with blockchain-based digital asset trading and real-world asset (RWA) tokenization.

### What TRAMIA Does

| Capability | Description |
|---|---|
| **Fiat Bridge** | Convert KES from your KCB bank account to tKES (tokenized Kenya Shilling) and back |
| **Digital Wallets** | Multi-chain wallets (TRAMIA, Ethereum, Bitcoin) secured by MPC custody |
| **DEX Trading** | On-chain order book exchange for BTC, ETH, stablecoins, and security tokens |
| **RWA Tokenization** | Fractional ownership of real estate and other assets via ERC-3643 security tokens |
| **Compliance** | Built-in AML/KYC/sanctions screening with on-chain immutable audit trail |

### How It Works (High-Level)

```
   KCB Bank (KES)                    TRAMIA Platform                     Blockchain (Besu)
   +--------------+     Deposit      +------------------+    Mint        +------------------+
   | Bank Account |  ------------->  | tKES Balance     | ----------->  | On-Chain tKES    |
   | KES 150,000  |     (T24 API)   | tKES 49,750      |   (ERC-20)   | Token Ledger     |
   +--------------+                  +------------------+               +------------------+
                         Withdraw           |                                    |
   +--------------+  <-------------  | Trade BTC/ETH    |    Transfer   | Smart Contracts  |
   | Bank Account |     (T24 API)   | Invest in RWA    | ----------->  | ERC-3643 Tokens  |
   +--------------+                  +------------------+               +------------------+
```

---

## 2. User Roles & Access Permissions

### Role Definitions

| Role | Platform | Description |
|---|---|---|
| **Customer** | Mobile App | Retail user — trade, invest, deposit, withdraw |
| **Issuer** | Mobile App | Asset originator — submit properties for tokenization |
| **Compliance Officer** | Admin Dashboard | AML alerts, KYC reviews, regulatory reports |
| **Admin** | Admin Dashboard | Full platform management including tokenization approvals |
| **Super Admin** | Admin Dashboard | System configuration and all admin capabilities |

### Detailed Access Matrix

| Process | Customer | Issuer | Compliance | Admin | Super Admin |
|---|---|---|---|---|---|
| Login via KCB Bank SSO | Yes | Yes | - | - | - |
| View wallet & balances | Yes | Yes | - | Yes | Yes |
| Deposit KES | Yes | Yes | - | - | - |
| Withdraw KES | Yes | Yes | - | - | - |
| Place trade orders | Yes | Yes | - | - | - |
| Cancel trade orders | Yes | Yes | - | - | - |
| Invest in offerings | Yes | Yes | - | - | - |
| Submit asset for tokenization | - | Yes | - | - | - |
| Review AML alerts | - | - | Yes | Yes | Yes |
| Approve/reject KYC | - | - | Yes | Yes | Yes |
| Generate compliance reports | - | - | Yes | Yes | Yes |
| Approve tokenized assets | - | - | - | Yes | Yes |
| Deploy smart contracts | - | - | - | Yes | Yes |
| Mint tokens | - | - | - | Yes | Yes |
| View system dashboard | - | - | Yes | Yes | Yes |
| Monitor trading | - | - | - | Yes | Yes |
| View fiat operations | - | - | - | Yes | Yes |

---

## 3. Customer Onboarding & Authentication

### 3.1 How Registration Works

TRAMIA does not have a separate registration form. All customers are onboarded through their existing KCB Bank relationship. When you log in for the first time, the platform automatically:

1. Fetches your profile from KCB's core banking system (T24)
2. Creates your TRAMIA account with your real KCB data
3. Provisions a secure multi-chain digital wallet
4. Links your primary KCB bank account
5. Sets your KYC level based on your bank verification status

### 3.2 Login Flow (Step-by-Step)

```
                                        AUTOMATIC ON FIRST LOGIN
                                        ========================
+----------+     +----------+     +-----------+     +-----------+     +----------+
|  Enter   |---->| Bank SSO |---->|  Fetch    |---->| Provision |---->| Link KCB |
|  Phone   |     | Validate |     |  KCB Data |     |  Wallet   |     | Account  |
+----------+     +----------+     +-----------+     +-----------+     +----------+
                      |                                                     |
                      v                                                     v
                 +----------+     +----------+     +-----------+     +-----------+
                 | Send OTP |---->| Enter OTP|---->|  Verify   |---->| Dashboard |
                 | via SMS  |     | (6 digit)|     |  & Login  |     | (Wallet)  |
                 +----------+     +----------+     +-----------+     +-----------+
```

**Step 1: Open the TRAMIA Mobile App**
- The login screen displays the TRAMIA branding and a phone number input field.

**Step 2: Enter Your Phone Number**
- Enter your KCB-registered mobile number (e.g., `+254700000001`).
- The number must match your KCB bank records.

**Step 3: Tap "Login with KCB"**
- The system connects to KCB's core banking system (T24) and retrieves your profile:
  - Full name, email, national ID
  - KYC verification level
  - CIF (Customer Information File) number
  - Bank account details
- If you are a **new TRAMIA user**, your profile is created automatically using this KCB data.
- If you are a **returning user**, your profile is synced with the latest KCB data.

**Step 4: Receive and Enter OTP**
- A 6-digit one-time password is sent to your phone via SMS.
- Enter the code on the verification screen.

**Step 5: Automatic Wallet & Account Setup**
On successful OTP verification, the following happens automatically:
- **Wallet Provisioned** (if first login):
  - MPC key ceremony generates a secure multi-party key
  - Three blockchain addresses are created: TRAMIA chain, Ethereum, Bitcoin
  - Your on-chain identity is registered
  - Zero balances are initialized for all supported assets (BTC, ETH, tKES, USDC, USDT)
- **Bank Account Linked** (if first login):
  - Your primary KCB account is fetched from T24
  - It is automatically linked and verified with your wallet

**Step 6: Dashboard**
- You land on the Wallet screen with your real balances, linked bank account, and portfolio overview.

### 3.3 What Gets Returned After Login

After OTP verification, your session contains:
- **Customer profile**: name, email, phone, national ID, KYC level, CIF, risk category
- **Wallet**: ID, status, blockchain addresses (TRAMIA, ETH, BTC)
- **Balances**: All asset balances (BTC, ETH, tKES, USDC, USDT)
- **Bank accounts**: Linked KCB accounts with account number, type, and verification status

### 3.4 Session & Security

| Parameter | Value |
|---|---|
| Access token validity | 15 minutes |
| Refresh token validity | 7 days |
| Authentication method | Phone + OTP (no password) |
| Token storage | Secure Store (iOS Keychain / Android Keystore) |
| On app restart | Re-authentication required (SSO + OTP) |

---

## 4. Digital Wallet Management

### 4.1 Wallet Overview

Every TRAMIA customer has one digital wallet that holds all their assets across multiple blockchains.

**What Your Wallet Contains:**

| Component | Description |
|---|---|
| **TRAMIA Address** | For tKES, USDC, USDT, and security tokens |
| **Ethereum Address** | For ETH and ERC-20 tokens |
| **Bitcoin Address** | For BTC (bech32 format) |
| **MPC Key** | Multi-party computation key — no single party holds the full private key |

### 4.2 Balance States

Each asset in your wallet has four balance components:

| State | Meaning | Example |
|---|---|---|
| **Available** | Free to use — trade, withdraw, or invest | 49,750 tKES |
| **Pending** | Awaiting confirmation (incoming deposit) | 5,000 tKES |
| **Locked** | Reserved for open trade orders | 10,000 tKES |
| **Staked** | Committed to staking or lock-up periods | 500 KLMNI |

### 4.3 Viewing Your Wallet (Mobile App)

The **Wallet** tab shows:

1. **Total Portfolio Value** — Sum of all digital assets converted to KES, using real-time price estimates:
   - BTC: KES 13,000,000 per BTC
   - ETH: KES 450,000 per ETH
   - tKES: KES 1 per tKES (1:1 peg)
   - USDC/USDT: KES 129 per token

2. **KCB Bank Balance** — Your fiat balance fetched from T24 (e.g., KES 150,000)

3. **Digital Assets List** — Individual balances for each supported asset

4. **RWA Holdings** — Any tokenized real estate or security tokens you own, showing:
   - Token name and symbol
   - Number of tokens held
   - Acquisition price
   - Current KES value

5. **Action Buttons**: Deposit, Withdraw, Trade, Invest

### 4.4 Unified Balance View

The wallet provides a **unified view** combining:
- Your KCB bank account balance (traditional KES)
- All digital asset balances with KES valuations
- A single **Total Value in KES** figure

### 4.5 Transaction History (Balance Ledger)

Every balance change is recorded in an immutable **Balance Ledger**. Each entry contains:
- Date and timestamp
- Amount and direction (Credit / Debit)
- Balance type affected (available, pending, locked, staked)
- Balance before and after the change
- Reference type (DEPOSIT, TRADE, WITHDRAWAL, MINT, BURN, INVESTMENT, ORDER_LOCK, ORDER_CANCEL)
- Reference ID linking to the originating transaction
- Idempotency key (prevents duplicate processing)

---

## 5. Fiat On-Ramp: Depositing KES

### 5.1 Overview

Depositing converts Kenya Shillings from your KCB bank account into tKES (Tramia KES) tokens in your digital wallet. The conversion rate is always 1:1 (1 KES = 1 tKES) minus fees.

### 5.2 Step-by-Step Process

1. **Tap "Deposit"** on the Wallet screen
2. **Review source account** — Your linked KCB bank account is shown (e.g., "KCB SAVINGS ****1001")
3. **Enter amount** — Minimum deposit: KES 500
4. **Review fee breakdown:**
   - Fee: 0.5% of deposit amount (minimum KES 50)
   - Net tKES received: deposit amount minus fee
   - Example: KES 50,000 deposit → KES 250 fee → 49,750 tKES received
5. **Confirm deposit**

### 5.3 What Happens Behind the Scenes

```
Step 1: T24 Debit         Step 2: Blockchain Mint      Step 3: Wallet Credit
+--------------+          +-------------------+         +------------------+
| KCB Account  |  -KES->  | Mint tKES Tokens  |  +tKES> | Your Wallet     |
| Debited via  |          | on TRAMIA Chain   |         | tKES Available  |
| T24 API      |          | (ERC-20)          |         | Balance Updated |
+--------------+          +-------------------+         +------------------+
                                                                 |
                                                        Step 4: Notify
                                                        Push notification sent
```

1. Your KCB account is debited via the T24 banking API
2. Equivalent tKES tokens are minted on the TRAMIA blockchain
3. Your wallet's tKES available balance is credited
4. An immutable ledger entry is created
5. You receive a push notification confirming the deposit

### 5.4 Deposit Statuses

| Status | Meaning |
|---|---|
| PROCESSING | Deposit initiated, T24 debit in progress |
| COMPLETED | All steps finished — tKES credited to wallet |
| FAILED | An error occurred (rare) |

### 5.5 Deposit Limits

| Method | Minimum | Maximum | Fee Rate |
|---|---|---|---|
| KCB Bank Transfer | KES 500 | KES 1,000,000 | 0.5% (min KES 50) |
| M-Pesa | KES 100 | KES 150,000 | 1.5% |
| Card | KES 500 | KES 100,000 | 1.0% |

Daily limits are governed by your KYC level (see Appendix B).

---

## 6. Fiat Off-Ramp: Withdrawing KES

### 6.1 Overview

Withdrawing converts tKES tokens from your digital wallet back into Kenya Shillings, credited to your KCB bank account.

### 6.2 Step-by-Step Process

1. **Tap "Withdraw"** on the Wallet screen
2. **Review source** — Your current tKES balance is displayed
3. **Enter amount** — Minimum withdrawal: KES 100 tKES
4. **Review destination** — Your linked KCB bank account
5. **Review fee breakdown:**
   - Fee: 0.5% (minimum KES 50)
   - Net KES to bank: withdrawal amount minus fee
   - Example: 20,000 tKES → KES 100 fee → KES 19,900 credited to bank
6. **Confirm withdrawal**

### 6.3 What Happens Behind the Scenes

```
Step 1: Wallet Debit      Step 2: Token Burn          Step 3: T24 Credit
+--------------+          +-------------------+        +------------------+
| Your Wallet  |  -tKES-> | Burn tKES Tokens  | -KES-> | KCB Account     |
| tKES Balance |          | on TRAMIA Chain   |        | Credited via    |
| Debited      |          | (Permanent destroy)|       | T24 API         |
+--------------+          +-------------------+        +------------------+
                                                                |
                                                       Step 4: Notify
                                                       Push notification sent
```

### 6.4 AML Pre-Check

Every withdrawal undergoes an automatic AML compliance check before processing:
- If risk score < 50: auto-approved, withdrawal proceeds
- If risk score 50-99: held for manual compliance review
- If risk score = 100: blocked (sanctions match)

---

## 7. Trading on the DEX

### 7.1 Overview

TRAMIA operates a decentralized exchange with an on-chain order book. You can trade between supported pairs using limit or market orders.

### 7.2 Available Trading Pairs

| Pair | Base Asset | Quote Asset | Maker Fee | Taker Fee |
|---|---|---|---|---|
| BTC/tKES | Bitcoin | Tramia KES | 0.1% | 0.2% |
| ETH/tKES | Ethereum | Tramia KES | 0.1% | 0.2% |
| BTC/USDC | Bitcoin | USD Coin | 0.1% | 0.2% |
| USDC/tKES | USD Coin | Tramia KES | 0.05% | 0.1% |

### 7.3 Understanding the Order Book

The **Trade** tab displays a live order book:

| Column | Description |
|---|---|
| **Asks (Red)** | Sell orders — prices at which others are willing to sell. Sorted lowest price first. |
| **Bids (Green)** | Buy orders — prices at which others are willing to buy. Sorted highest price first. |
| **Spread** | Gap between the lowest ask and highest bid. Tighter = more liquidity. |
| **Last Price** | The price of the most recently executed trade. |

### 7.4 Placing an Order (Step-by-Step)

1. **Navigate to the Trade tab**
2. **Select BUY or SELL**
   - BUY: You want to acquire the base asset (e.g., BTC)
   - SELL: You want to sell the base asset
3. **Enter Price** — Your desired price per unit (in quote asset, e.g., KES per BTC)
4. **Enter Quantity** — Amount of base asset (e.g., 0.001 BTC)
5. **Review summary:**
   - Total = Quantity x Price
   - Fee = Total x 0.2% (taker) or 0.1% (maker)
6. **Confirm the order**

### 7.5 What Happens When You Place an Order

1. **Funds are locked immediately:**
   - BUY order: Your tKES (quote asset) is moved from "available" to "locked"
   - SELL order: Your BTC (base asset) is moved from "available" to "locked"

2. **Matching engine processes the order:**
   - BUY orders are matched against asks (lowest price first)
   - SELL orders are matched against bids (highest price first)
   - Price-time priority: same price = earliest order fills first

3. **For each match (trade):**
   - Assets are transferred between buyer and seller wallets
   - Maker and taker fees are deducted from proceeds
   - A trade record is created
   - All balance changes are recorded in the ledger

4. **If no match is found:**
   - LIMIT orders rest in the order book until matched or cancelled
   - Your funds remain locked

### 7.6 Order Types

| Type | Behavior |
|---|---|
| **LIMIT** | Rests in the order book at your specified price until filled or cancelled |
| **MARKET** | Fills immediately at the best available prices in the book |

### 7.7 Time-in-Force Options

| Option | Behavior |
|---|---|
| **GTC** (Good Till Cancel) | Default. Stays open until filled or you cancel. |
| **IOC** (Immediate or Cancel) | Fills as much as possible immediately; cancels remainder. |
| **FOK** (Fill or Kill) | Must fill entirely in one match or is rejected completely. |

### 7.8 Cancelling an Order

1. Find the open order in your order history
2. Tap **Cancel**
3. Your locked funds are **immediately released** back to available balance
4. The order is removed from the order book

**You cannot cancel orders that are already fully filled (FILLED status).**

### 7.9 Trade Settlement Details

When a trade is matched:

| Party | Fee | Example (BTC/tKES, 0.001 BTC at 13M) |
|---|---|---|
| **Maker** (order was already in the book) | 0.1% of quote amount | 0.001 BTC x 13,000,000 = 13,000 tKES → Fee: 13 tKES |
| **Taker** (order matched against the book) | 0.2% of quote amount | Same → Fee: 26 tKES |

Fees are deducted from the proceeds credited to each party.

---

## 8. Real-World Asset Tokenization (Issuer Guide)

### 8.1 Overview

TRAMIA enables the fractional ownership of real-world assets through blockchain-based ERC-3643 security tokens. This section is for **Issuers** (property developers, fund managers) who want to tokenize assets.

### 8.2 Supported Asset Types

- Real Estate (residential, commercial, industrial, land, agricultural)
- Invoices
- Purchase Orders
- Farm Produce
- Bonds
- Equity

### 8.3 The 6-Phase Tokenization Lifecycle

```
  Phase 1         Phase 2          Phase 3          Phase 4         Phase 5         Phase 6
+---------+    +-----------+    +-----------+    +-----------+   +-----------+   +-----------+
|  DRAFT  |--->| PENDING   |--->|  LEGAL    |--->|   CMA     |-->| CONTRACT  |-->|  ACTIVE   |
|         |    | APPROVAL  |    |  REVIEW   |    | APPROVED  |   | DEPLOYED  |   | OFFERING  |
| Issuer  |    | Submitted |    | On-Chain  |    | On-Chain  |   | On-Chain  |   | Investors |
+---------+    +-----------+    +-----------+    +-----------+   +-----------+   +-----------+
                    |                                                                  |
                    v                                                                  v
               +-----------+                                                    +-----------+
               | REJECTED  |                                                    | MATURED / |
               | (re-submit|                                                    | CLOSED    |
               +-----------+                                                    +-----------+
```

### Phase 1: Asset Submission (Issuer)

**Who:** The asset issuer

**What you submit:**
- **Basic info:** Asset type, name, description
- **Token config:** Token symbol (e.g., "KLMNI"), token name, price per token (default: KES 100)
- **Financials:** Total asset value in KES, expected annual yield, distribution frequency
- **Investment terms:** Minimum investment (default: KES 100), lock-up period (default: 180 days)
- **Property details** (for real estate): Property type, address, city, county, title number, rental income, occupancy rate, SPV name

**Status flow:** DRAFT → PENDING_APPROVAL (on submit)

**Example — Kilimani Heights:**
```
Name:               Kilimani Heights Apartments
Token Symbol:       KLMNI
Asset Value:        KES 50,000,000
Token Price:        KES 100 per token
Total Supply:       500,000 tokens (auto-calculated)
Expected Yield:     12% p.a.
Min Investment:     KES 100
Lock-up:            180 days
Property:           Residential, 14 Kilimani Road, Nairobi
```

### Phase 2: Legal Verification (Admin)

**Who:** Admin or Compliance Officer via Admin Dashboard

**What happens:**
1. Admin reviews submitted documents and property details
2. Clicks "Verify Legal" on the asset card
3. System records on-chain:
   - Title deed hash (SHA-256 fingerprint)
   - Legal verifier's address and signature
   - Transaction hash and block number
4. SPV status updated to "STRUCTURED"

**Status:** PENDING_APPROVAL → LEGAL_REVIEW

### Phase 3: CMA Compliance Review (Admin)

**Who:** Admin or Compliance Officer

**What happens:**
1. Admin clicks "CMA Review" and enters CMA reference number
2. System performs **3 on-chain verification contracts:**
   - **Financial Audit** — Verifies asset value and projected yield
   - **Compliance Check** — Verifies KYC references and jurisdictional coverage (KE, UG, TZ, RW)
   - **Final Verification (Multi-Sig Gate)** — All 3 phases (legal, financial, compliance) must be approved
3. Total token supply is calculated: `asset_value_kes / token_price_kes`

**Status:** LEGAL_REVIEW → CMA_APPROVED

### Phase 4: Smart Contract Deployment (Admin)

**Who:** Admin

**What happens:**
1. Admin clicks "Deploy Contract"
2. An ERC-3643 security token contract is deployed on the TRAMIA blockchain (Besu)
3. Contract address is stored
4. A new asset entry is registered in the system (initially non-tradeable)

**Status:** CMA_APPROVED → CONTRACT_DEPLOYED

### Phase 5: Token Minting (Admin)

**Who:** Admin

**What happens:**
1. Admin clicks "Mint Tokens"
2. All tokens are minted to the platform's **ESCROW wallet** (not to the issuer)
3. Offering window opens: starts now, ends in 3 months
4. `tokens_remaining = total_supply`, `tokens_outstanding = 0`

**Status:** CONTRACT_DEPLOYED → ACTIVE

### One-Click Approval (Admin Shortcut)

Admins can use the **"Approve All (Phases 2-5)"** button to run all phases in sequence. This auto-generates SPV details, CMA reference, and valuer name. Use for pre-vetted or demo assets.

### Rejection

At PENDING_APPROVAL status, an Admin can **Reject** with notes. The asset remains in PENDING_APPROVAL with rejection notes stored for the issuer to review.

---

## 9. Investing in Tokenized Offerings

### 9.1 Browsing Available Offerings

1. **Tap the Invest tab** in the mobile app
2. Browse **ACTIVE** offerings. Each card shows:
   - Asset name and token symbol badge
   - Description of the underlying asset
   - Price per token (KES)
   - Expected annual yield (%)
   - Number of current investors
   - Tokens remaining / total supply
   - Funding progress bar and percentage
   - Offering close date

### 9.2 Making an Investment (Step-by-Step)

1. **Tap on an offering** to select it
2. **Enter investment amount in KES** (minimum varies per asset, default: KES 100)
3. **Review token calculation:**
   - Tokens received = Amount KES / Price per token
   - Example: KES 5,000 / KES 100 = 50 tokens
4. **Tap "Confirm"**

### 9.3 What Happens Behind the Scenes

1. **Validation:**
   - Offering must be ACTIVE and within the offering date window
   - Amount must meet minimum investment requirement
   - Sufficient tokens must remain in the offering
2. **Payment:** Your tKES balance is debited by the investment amount
3. **Token Transfer:** Tokens are transferred from the escrow wallet to your wallet on the blockchain
4. **Records Created:**
   - Investment record (status: COMPLETED)
   - TokenHolding record (or updated if you already hold this token)
5. **Asset Counters Updated:**
   - `tokens_outstanding` increases
   - `tokens_remaining` decreases
   - `current_investors` increments (if new investor)
   - `total_raised_kes` increases
6. **Lock-Up Applied:** Your tokens are locked until the lock-up period expires (e.g., 180 days)

### 9.3 Viewing Your Holdings

On the **Invest** tab, scroll to **"Your Holdings"** to see:
- Token name and symbol
- Number of tokens held
- Current value in KES (tokens x acquisition price)
- Lock-up expiry date

The same holdings also appear on the **Wallet** tab under "RWA Holdings."

---

## 10. Compliance & AML Operations (Admin Guide)

### 10.1 Automatic Transaction Monitoring

Every deposit, withdrawal, and trade passes through the **Transaction Monitor** before processing. This is automatic and invisible to the customer.

**5-Step AML Check Flow:**

```
Step 1              Step 2                Step 3           Step 4             Step 5
+-----------+    +----------------+    +-----------+    +-------------+    +----------+
| Sanctions |    | Transaction    |    | Travel    |    | Risk Score  |    | On-Chain |
| Screening |    | Pattern Check  |    | Rule      |    | Update      |    | Logging  |
+-----------+    +----------------+    +-----------+    +-------------+    +----------+
```

#### Step 1 — Sanctions Screening (Hard Block)

Checks customer name and national ID against:
- OFAC SDN (US Treasury)
- UN Sanctions
- EU Sanctions
- FRC Kenya (Financial Reporting Centre)
- FBI Most Wanted

Also checks high-risk jurisdictions: North Korea, Iran, Syria, Cuba, Myanmar, Belarus, Russia, Venezuela.

**If matched:** Risk score = 100, transaction immediately blocked, SANCTIONS_MATCH alert created with CRITICAL severity, auto-escalated.

#### Step 2 — Transaction Pattern Analysis

| Pattern | Trigger | Risk Points | Alert Type | Severity |
|---|---|---|---|---|
| Large Transaction | Amount >= KES 1,000,000 | +30 | LARGE_TRANSACTION | MEDIUM |
| Hourly Velocity | 5+ transactions in 1 hour | +25 | VELOCITY_HOURLY | HIGH |
| Structuring | 3+ deposits in 24h between KES 900K-999K | +35 | STRUCTURING | HIGH |

#### Step 3 — Travel Rule (FATF)

For transactions exceeding **KES 130,000** (~USD 1,000):
- Originator and beneficiary information is captured
- Data includes names, account identifiers, and VASP information
- Required for cross-border compliance with FATF guidance

#### Step 4 — Dynamic Risk Score Update

- **Blending formula:** `new_score = round(existing_score * 0.7 + current_score * 0.3)`
- Risk categories:
  - LOW: score < 30
  - MEDIUM: score 30-59
  - HIGH: score >= 60
- Customer risk category is updated if it changes

#### Step 5 — On-Chain Audit Logging

The AML check result is permanently recorded on the TRAMIA blockchain, creating an immutable audit trail.

### 10.2 Decision Thresholds

| Risk Score | Outcome |
|---|---|
| **0-49** | Auto-approved — transaction proceeds normally |
| **50-99** | Manual review required — held for compliance officer |
| **100** | Hard block — sanctions match, transaction rejected immediately |

### 10.3 Managing AML Alerts (Admin Dashboard)

**Viewing alerts:**
1. Navigate to **Compliance > AML Alerts**
2. View summary counts by status (NEW, INVESTIGATING, ESCALATED, RESOLVED, FALSE_POSITIVE)
3. Filter alerts by clicking status buttons
4. Each alert shows: type, severity badge, customer name, description, status

**Alert resolution workflow:**

```
+-------+    +----------------+    +------------+    +----------+
|  NEW  |--->| INVESTIGATING  |--->|  ESCALATED |--->| RESOLVED |
+-------+    +----------------+    +------------+    +----------+
                   |                                       ^
                   |        +-----------------+            |
                   +------->| FALSE_POSITIVE  |            |
                            +-----------------+            |
                   |                                       |
                   +---------------------------------------+
```

**Resolving an alert:**
1. Click **"Review"** on the alert
2. A detail modal opens showing:
   - Alert type and severity
   - Full description
   - Current status
   - Transaction details (JSON)
3. Enter **resolution notes** explaining your findings
4. Select action:
   - **Investigate** — Mark as under active investigation
   - **Escalate** — Requires senior review or regulatory action
   - **Resolve** — Issue addressed (e.g., STR filed)
   - **False Positive** — Alert was incorrect, no action needed
5. Click the action button — alert status updates immediately

---

## 11. KYC Review & Management (Admin Guide)

### 11.1 Viewing Customer KYC Status

1. Navigate to **Compliance > KYC Reviews**
2. The customer table shows:
   - Customer name and phone
   - Current KYC level badge (Level 0-3)
   - Verification status (VERIFIED / PENDING)

### 11.2 Reviewing and Upgrading KYC

1. Click **"Review"** on a customer
2. The modal displays:
   - Customer name and current KYC level
   - **Verification History**: All previous KYC reviews with method and result
3. Select the **upgrade level** from the dropdown:
   - Level 1 (Basic Trading): KES 100,000/day
   - Level 2 (Full Trading): KES 1,000,000/day
   - Level 3 (Unlimited): No daily limit
4. Click **"Approve"**
5. A KYC record is created with verification method "MANUAL_REVIEW"
6. The customer's KYC level and status are updated immediately

### 11.3 KYC Verification Methods

| Method | Description |
|---|---|
| BANK_KYC_INHERIT | Automatic — inherited from KCB bank verification |
| DOCUMENT_REVIEW | Manual — national ID and address proof reviewed |
| ENHANCED_DUE_DILIGENCE | Manual — full background check, source of funds verification |
| MANUAL_REVIEW | Admin-initiated review through dashboard |

---

## 12. Regulatory Reporting (Admin Guide)

### 12.1 Report Types

| Report | Full Name | Description | Recipient | Frequency |
|---|---|---|---|---|
| **STR** | Suspicious Transaction Report | Structuring alerts and suspicious patterns | FRC | Within 24 hours |
| **CTR** | Currency Transaction Report | All transactions >= KES 1,000,000 | FRC | Within 7 days |
| **VASP_MONTHLY** | VASP Monthly Summary | Customer counts, alert volumes, transaction totals | CMA | Monthly |

### 12.2 Generating a Report

1. Navigate to **Compliance > Reports**
2. Select **Report Type** (STR, CTR, or VASP_MONTHLY)
3. Set **Start Date** and **End Date**
4. Click **"Generate"**
5. The system compiles the report with:
   - Unique report ID
   - Generation timestamp
   - Period covered
   - Summary statistics (alert counts, transaction totals, customer metrics)
6. The report is displayed with a JSON summary

### 12.3 Reporting Schedule Reference

| Report | Frequency | Recipient | Trigger |
|---|---|---|---|
| STR | Within 24 hours of identification | FRC (Financial Reporting Centre) | Suspicious activity detected |
| CTR | Within 7 days | FRC | Transactions >= KES 1M |
| SAR | As needed | FRC | Suspicious Activity Report |
| VASP Monthly | Monthly | CMA (Capital Markets Authority) | Calendar cycle |
| Annual Compliance | Annually | CBK (Central Bank of Kenya) | Year-end |

---

## 13. Admin Dashboard & Platform Monitoring

### 13.1 Logging In

1. Navigate to the Admin Dashboard URL in your web browser
2. Enter your **email** and **password**
3. Click **"Sign In"**

**Demo Admin Credentials:**
| Email | Password | Role |
|---|---|---|
| admin@tramia.io | TramiaAdmin2026! | Super Admin |
| fatuma@tramia.io | TramiaDemo2026! | Compliance Officer |
| james@tramia.io | TramiaIssuer2026! | Admin |

### 13.2 Dashboard Overview

The main dashboard displays real-time platform health across four sections:

**KPI Tiles (8 metrics):**
- Total Customers | Active Wallets | Open Orders | New AML Alerts
- Total Trades | Active Offerings | Pending Deposits | Pending Withdrawals

**Microservice Health (9 services):**

| Service | Function | Expected Latency |
|---|---|---|
| Identity Service | Customer identity management | ~48ms |
| Wallet Service | Balance and wallet operations | ~52ms |
| Trading Service | Order matching engine | ~12ms |
| Fiat Gateway | KES deposit/withdrawal processing | ~210ms |
| Tokenization | RWA token management | ~88ms |
| Compliance | AML/KYC processing | ~340ms |
| Core Banking Bridge | T24 integration | ~195ms |
| Blockchain Indexer | Besu chain monitoring | ~22ms |
| Notification Service | SMS/push notifications | ~65ms |

**Validator Node Status (4 Besu consensus nodes):**

| Node | Operator | Expected Status |
|---|---|---|
| Validator 1 | Riverbank Nairobi | HEALTHY, 3/3 peers |
| Validator 2 | KCB Infrastructure | HEALTHY, 3/3 peers |
| Validator 3 | DR Site Mombasa | HEALTHY, 3/3 peers |
| Validator 4 | CMA Observer | HEALTHY, 3/3 peers |

**Liquidity Pools:**

| Pool | Balance | Threshold | Status |
|---|---|---|---|
| KES Float (T24) | ~42M KES | 10M KES | ADEQUATE |
| tKES Reserve | ~42M tKES | 1:1 backing | BALANCED |
| BTC Hot Wallet | ~3.82 BTC | 1.00 BTC | ADEQUATE |
| ETH Hot Wallet | ~38.5 ETH | 10.0 ETH | ADEQUATE |

---

## 14. Tokenization Pipeline Management (Admin Guide)

### 14.1 Viewing the Pipeline

Navigate to **Tokenization** in the admin sidebar. Each asset is displayed as a card showing:
- Asset name and current status badge
- **Phase progress indicator** — Visual dots showing progression through 6 phases
- Token details: symbol, price, supply, asset value
- Legal, SPV, and CMA status
- Funding progress bar (for ACTIVE offerings)
- Phase-specific action buttons

### 14.2 Phase-Specific Actions

| Current Status | Available Actions |
|---|---|
| PENDING_APPROVAL | "Verify Legal (Phase 2)", "Approve All (Phases 2-5)", "Reject" |
| LEGAL_REVIEW | "CMA Review (Phase 3)" |
| CMA_APPROVED | "Deploy Contract (Phase 4)" |
| CONTRACT_DEPLOYED | "Mint Tokens (Phase 5)" |
| ACTIVE | View funding progress (no actions) |

### 14.3 Monitoring Active Offerings

For ACTIVE assets, the card shows:
- Amount raised and funding percentage
- Number of investors
- Tokens remaining
- Offering close date

---

## 15. Trading Monitoring (Admin Guide)

### 15.1 Viewing the Order Book

1. Navigate to **Trading** in the admin sidebar
2. Select a trading pair from the tabs (BTC/tKES, ETH/tKES, BTC/USDC, USDC/tKES)
3. The order book displays:
   - **Bids (Green):** Buy orders sorted by highest price first
   - **Asks (Red):** Sell orders sorted by lowest price first
   - Price and quantity for each level

### 15.2 What to Monitor

- **Spread:** Gap between best bid and best ask — wider spread = less liquidity
- **Depth:** Number of orders at each price level
- **Concentration:** Watch for large orders that could move the market
- **Unusual patterns:** Rapid order placement/cancellation (potential manipulation)

---

## 16. Account Settings & Profile

### 16.1 Viewing Your Profile (Mobile App)

The **Settings** tab displays your complete profile, all populated from your KCB bank data:

| Section | Fields |
|---|---|
| **Profile** | Name, CIF number, KYC level badge |
| **Account** | Phone, email, national ID, risk category |
| **Linked Bank** | Bank name, account type/number (masked), verification status |
| **Limits** | Daily transaction limit, daily usage |

### 16.2 Logging Out

1. Tap **"Sign Out"** at the bottom of Settings
2. Confirm in the alert dialog
3. Your session token and all cached data are cleared
4. You will need to re-authenticate via SSO + OTP to log back in

---

## Appendix A: Fee Schedule

| Action | Fee Rate | Minimum | Maximum | Notes |
|---|---|---|---|---|
| Deposit (KCB Bank Transfer) | 0.5% | KES 50 | - | Deducted from deposit |
| Deposit (M-Pesa) | 1.5% | KES 50 | - | Deducted from deposit |
| Deposit (Card) | 1.0% | KES 50 | - | Deducted from deposit |
| Withdrawal (KCB) | 0.5% | KES 50 | - | Deducted from withdrawal |
| Trade (Maker) | 0.1% | - | - | Of quote amount |
| Trade (Taker) | 0.2% | - | - | Of quote amount |
| USDC/tKES Trade (Maker) | 0.05% | - | - | Reduced for stablecoin |
| USDC/tKES Trade (Taker) | 0.1% | - | - | Reduced for stablecoin |
| Primary Investment | 0% | - | - | No fee on primary offerings |

**Fee formula:** `fee = max(amount * rate, minimum_fee)`

---

## Appendix B: KYC Tiers & Transaction Limits

### KYC Levels

| Level | Label | Daily Limit | Requirements | Verification Method |
|---|---|---|---|---|
| 0 | View Only | KES 10,000 | Phone number only | None |
| 1 | Basic Trading | KES 100,000 | KCB account verification | Bank KYC Inherit |
| 2 | Full Trading | KES 1,000,000 | National ID + address proof | Document Review |
| 3 | Unlimited | No limit | Full background check + source of funds | Enhanced Due Diligence |

### Deposit Limits by Method

| Method | Minimum | Maximum |
|---|---|---|
| KCB Bank Transfer | KES 500 | KES 1,000,000 |
| M-Pesa | KES 100 | KES 150,000 |
| Card | KES 500 | KES 100,000 |

---

## Appendix C: Supported Assets & Trading Pairs

### Assets

| Symbol | Name | Type | Chain | Decimals |
|---|---|---|---|---|
| BTC | Bitcoin | Crypto | BTC | 8 |
| ETH | Ethereum | Crypto | ETH | 18 |
| tKES | Tramia KES | Fiat Token | TRAMIA | 2 |
| USDC | USD Coin | Stablecoin | TRAMIA | 6 |
| USDT | Tether | Stablecoin | TRAMIA | 6 |
| KLMNI | Kilimani Heights Token | Security Token | TRAMIA | 18 |

### Trading Pairs

| Pair | Min Quantity | Min Notional | Price Precision |
|---|---|---|---|
| BTC/tKES | 0.00001 BTC | KES 500 | 0 decimals |
| ETH/tKES | 0.0001 ETH | KES 500 | 0 decimals |
| BTC/USDC | 0.00001 BTC | $10 | 2 decimals |
| USDC/tKES | 1.00 USDC | KES 100 | 2 decimals |

### Price Estimates (for portfolio valuation)

| Asset | KES Value |
|---|---|
| BTC | KES 13,000,000 |
| ETH | KES 450,000 |
| tKES | KES 1 |
| USDC | KES 129 |
| USDT | KES 129 |

---

## Appendix D: AML Risk Scoring & Thresholds

### Risk Score Composition

| Check | Points Added | Trigger |
|---|---|---|
| Sanctions Match | 100 (hard block) | Name/ID matches sanctions list |
| Large Transaction | +30 | Amount >= KES 1,000,000 |
| Hourly Velocity | +25 | 5+ transactions in 1 hour |
| Structuring | +35 | 3+ deposits in 24h between KES 900K-999K |
| High-Risk Jurisdiction | +60 | Transfer from/to sanctioned country |

### Score Blending

`blended_score = round(existing_score * 0.7 + new_score * 0.3)`

### Risk Categories

| Category | Score Range | Impact |
|---|---|---|
| LOW | 0-29 | Normal operations, no restrictions |
| MEDIUM | 30-59 | Enhanced monitoring, may trigger alerts |
| HIGH | 60-100 | Restricted operations, manual review required |

### Travel Rule Threshold

- **KES 130,000** (~USD 1,000): Originator and beneficiary data captured
- Applied to: deposits, withdrawals, and cross-border transfers

### Sanctions Lists Checked

OFAC SDN, UN Sanctions, EU Sanctions, FRC Kenya, FBI Most Wanted, Chainalysis Sanctions (for wallet addresses)

### High-Risk Jurisdictions

North Korea (KP), Iran (IR), Syria (SY), Cuba (CU), Myanmar (MM), Belarus (BY), Russia (RU), Venezuela (VE)

---

## Appendix E: State Transition Reference

### Customer Lifecycle
```
Bank SSO Login → Customer Created (from T24 data) → Wallet Provisioned → Bank Account Linked
```

### Order Lifecycle
```
NEW → OPEN → PARTIALLY_FILLED → FILLED
                    ↓
              → CANCELLED
OPEN → FILLED (immediate full match)
OPEN → CANCELLED (user cancellation)
```

### Deposit Lifecycle
```
PROCESSING → COMPLETED (T24 debit + blockchain mint + wallet credit)
PROCESSING → FAILED (error in any step)
```

### Withdrawal Lifecycle
```
PROCESSING → COMPLETED (wallet debit + blockchain burn + T24 credit)
PROCESSING → FAILED (error in any step)
```

### Tokenized Asset Lifecycle
```
DRAFT → PENDING_APPROVAL → LEGAL_REVIEW → CMA_APPROVED → CONTRACT_DEPLOYED → ACTIVE
                  ↓
            → REJECTED (back to PENDING_APPROVAL with notes)
ACTIVE → MATURED / CLOSED (when offering ends or asset lifecycle completes)
```

### AML Alert Lifecycle
```
NEW → INVESTIGATING → RESOLVED
NEW → INVESTIGATING → ESCALATED → RESOLVED
NEW → FALSE_POSITIVE
CRITICAL (sanctions) → ESCALATED (auto)
```

### Investment Lifecycle
```
Created → COMPLETED (synchronous — payment, transfer, and recording all in one step)
```

---

## Appendix F: Demo Accounts & Test Data

### Customer Accounts (Mobile App)

| Name | Phone | OTP Code | KYC | tKES Balance | Notable Assets |
|---|---|---|---|---|---|
| **Amara Osei** | +254700000001 | 123456 | Level 2 | 49,750 | 0.05 BTC, 0.5 ETH, 500 KLMNI tokens |
| **James Mwangi** | +254700000002 | 123456 | Level 3 | 100,000 | Issuer role |
| **Fatuma Hassan** | +254700000003 | 123456 | Level 2 | 0 | Wallet auto-created on first login |

### Admin Accounts (Dashboard)

| Name | Email | Password | Role |
|---|---|---|---|
| Sysadmin Bot | admin@tramia.io | TramiaAdmin2026! | Super Admin |
| Fatuma Hassan | fatuma@tramia.io | TramiaDemo2026! | Compliance Officer |
| James Mwangi | james@tramia.io | TramiaIssuer2026! | Admin |

### Pre-Seeded Data

| Category | Count | Details |
|---|---|---|
| Customers | 4 | 3 demo + 1 system bot |
| Assets | 6 | BTC, ETH, tKES, USDC, USDT, KLMNI |
| Wallets | 5 | 2 user + hot + escrow + fee |
| Bank Accounts | 2 | Amara + James (Fatuma auto-links on first login) |
| Trading Pairs | 4 | BTC/tKES, ETH/tKES, BTC/USDC, USDC/tKES |
| Open Orders | 20 | 10 buy + 10 sell on BTC/tKES |
| Tokenized Assets | 2 | Kilimani Heights (ACTIVE), Westlands Apartments (PENDING) |
| AML Alerts | 6 | Various types and severities |
| KYC Records | 4 | Historical verification records |

### New User Testing

Enter any phone number not listed above (e.g., `+254711111111`). The system will:
1. Generate a KCB profile: "KCB Customer 1111"
2. Create a new customer with KYC Level 1
3. Provision a wallet with 3 chain addresses
4. Link a generated bank account
5. Show zero balances (new user)

---

*This guide reflects the current TRAMIA platform implementation (v2.0). Banking (T24), custody (Cactus MPC), and blockchain (Besu) services operate in mock/demo mode. Business processes and compliance rules are production-representative.*
