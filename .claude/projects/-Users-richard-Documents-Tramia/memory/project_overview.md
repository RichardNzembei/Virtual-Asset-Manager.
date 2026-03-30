---
name: TRAMIA Platform Overview
description: Digital assets infrastructure platform bridging KCB banking with blockchain trading and RWA tokenization in Kenya
type: project
---

**TRAMIA** is a regulated virtual assets infrastructure platform targeting the Kenyan market.

**Core Capabilities:**
- Traditional banking bridge (KCB Bank via Temenos T24)
- Digital wallets with MPC custody (Cactus)
- DEX trading with in-memory order matching engine
- Real-world asset (RWA) tokenization (ERC-3643 security tokens on Besu)
- Full AML/KYC/compliance framework with on-chain audit logging
- Sanctions screening (OFAC, UN, EU, FRC Kenya)

**Tech Stack:**
- Monorepo with npm workspaces
- Backend: NestJS + TypeORM + MySQL (`apps/api`)
- Mobile: React Native / Expo (`apps/mobile`)
- Admin: Next.js + Tailwind (`apps/admin`)
- Shared types/constants: `packages/shared`
- Blockchain: Hyperledger Besu (currently mock services)
- Custody: Cactus MPC (currently mock)
- Banking: T24 (currently mock)

**Database:** MySQL (`tramia_dev`), TypeORM with synchronize=true (demo mode)

**Key Business Rules:**
- Fiat bridge: KES deposits → T24 debit + tKES mint; withdrawals reverse
- Trading fees: maker 0.1%, taker 0.2%
- Tokenization: 6-phase workflow with on-chain multi-sig verification (legal, financial, compliance)
- AML risk score < 50 = auto-approve, 50+ = manual review, 100 = hard block (sanctions)
- All balance updates use pessimistic locking + idempotency keys
- Travel rule applied for transactions > 130k KES

**Why:** This is an early-stage showcase/demo platform. All integrations are mocked.

**How to apply:** When working on this project, be aware that services are mocks — changes should maintain the mock patterns until real integrations are added. The platform is Kenya-focused (KES currency, KCB bank, CMA regulatory references).
