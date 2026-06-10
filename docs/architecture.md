# VakilAI — Full System Architecture
**By Adeyas Technologies Private Limited**
Last updated: June 2026

---

## 1. Product Overview

VakilAI is an AI-powered legal compliance platform built specifically for Indian businesses. It converts India's complex regulatory landscape (DPDP Act, GST, Companies Act, FEMA, Labour Laws, SEBI) into structured, actionable compliance intelligence — delivered in hours at a fraction of traditional legal costs.

**Core Value Proposition:**
- DPDP Act compliance assessment in < 2 hours (vs 6 months traditionally)
- ₹15,000 vs ₹5,00,000 for a lawyer-conducted compliance audit
- Always current — AI monitors regulatory changes automatically
- Built on Indian law corpus — not generic LLM

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                            │
│  ┌──────────────────┐    ┌──────────────────────────────┐  │
│  │  Marketing Site  │    │      SaaS Application        │  │
│  │  vakilai.in      │    │      app.vakilai.in          │  │
│  │  (Next.js/Static)│    │      (Next.js 14 + TS)       │  │
│  └────────┬─────────┘    └──────────────┬───────────────┘  │
└───────────┼──────────────────────────────┼─────────────────┘
            │                              │
┌───────────▼──────────────────────────────▼─────────────────┐
│                      API GATEWAY                            │
│              api.vakilai.in (Node.js / Express)             │
│  • Rate limiting (100 req/min per user)                     │
│  • JWT auth validation                                      │
│  • Request logging (Sentry)                                 │
└──────┬──────────────┬──────────────┬──────────────┬────────┘
       │              │              │              │
┌──────▼───┐  ┌───────▼───┐  ┌──────▼────┐  ┌────▼───────┐
│  User    │  │ Assessment │  │   AI /    │  │  Report    │
│  Service │  │  Service   │  │  Query    │  │  Service   │
│          │  │            │  │  Service  │  │            │
│ Auth     │  │ DPDP scan  │  │ RAG + LLM │  │ PDF gen    │
│ Profile  │  │ GST check  │  │ Law query │  │ Email send │
│ Billing  │  │ Gap report │  │ Monitoring│  │ Export     │
└──────┬───┘  └───────┬───┘  └──────┬────┘  └────┬───────┘
       │              │              │              │
┌──────▼──────────────▼──────────────▼──────────────▼───────┐
│                    DATA LAYER                               │
│                                                            │
│  ┌────────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  PostgreSQL     │  │   Pinecone   │  │    Redis      │  │
│  │  (Supabase)    │  │  Vector DB   │  │   (Cache)     │  │
│  │                │  │              │  │               │  │
│  │  users         │  │  Law corpus  │  │  Sessions     │  │
│  │  assessments   │  │  Circulars   │  │  Rate limits  │  │
│  │  reports       │  │  Case law    │  │  AI responses │  │
│  │  subscriptions │  │  FAQs        │  │               │  │
│  │  audit_logs    │  │              │  │               │  │
│  └────────────────┘  └──────────────┘  └───────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

### Frontend — Marketing Site
| Layer | Technology | Reason |
|-------|-----------|--------|
| Framework | Next.js 14 (Static Export) | SEO, performance, CDN-friendly |
| Styling | Tailwind CSS | Rapid iteration |
| Animations | Framer Motion | Premium feel |
| Forms | React Hook Form | Validation, UX |
| Deployment | Vercel | Zero-config, free tier |

### Frontend — Application
| Layer | Technology | Reason |
|-------|-----------|--------|
| Framework | Next.js 14 (App Router) | Full-stack, RSC, caching |
| Language | TypeScript | Type safety for complex data |
| Styling | Tailwind CSS + shadcn/ui | Speed + consistency |
| State | Zustand | Lightweight, no boilerplate |
| Data fetching | TanStack Query | Caching, background refresh |
| Charts | Recharts | Compliance score viz |
| PDF Preview | react-pdf | Report display in-app |
| Deployment | Vercel | Edge network, ISR |

### Backend — API
| Layer | Technology | Reason |
|-------|-----------|--------|
| Runtime | Node.js 20 LTS | Ecosystem, team familiarity |
| Framework | Express.js + Zod | Validation, type-safe routes |
| Auth | Clerk | Social login, India phone OTP |
| ORM | Prisma | Type-safe DB queries |
| Queue | BullMQ + Redis | Async assessment processing |
| Storage | AWS S3 (Mumbai region) | Indian data residency |
| Email | Resend | Developer-friendly, reliable |
| Payments | Razorpay | Indian cards, UPI, EMI |
| Monitoring | Sentry + PostHog | Errors + product analytics |
| Deployment | Railway.app | Simple, scalable |

### AI / Intelligence Layer
| Layer | Technology | Reason |
|-------|-----------|--------|
| Primary LLM | Anthropic Claude 3.5 Sonnet | Best reasoning for legal text |
| Fallback LLM | OpenAI GPT-4o | Redundancy |
| Orchestration | LangChain (Python) | RAG pipeline, chains |
| Vector DB | Pinecone | Scalable semantic search |
| Embeddings | OpenAI text-embedding-3-large | Best legal text embeddings |
| Law Corpus | Custom curated (see §6) | Indian law specificity |
| Report Gen | Python + WeasyPrint | PDF generation from HTML |
| Deployment | Railway (Python service) | Separate scaling from API |

### Infrastructure
| Component | Service | Config |
|-----------|---------|--------|
| DNS | Cloudflare | vakilai.in |
| CDN | Cloudflare | Assets, DDoS protection |
| App hosting | Vercel + Railway | Auto-scaling |
| DB | Supabase | PostgreSQL, row-level security |
| Secrets | Doppler | Environment management |
| CI/CD | GitHub Actions | Deploy on push to main |
| Uptime | Better Uptime | Alert on downtime |

---

## 4. Database Schema

```sql
-- Users & Auth
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  clerk_id TEXT UNIQUE NOT NULL,
  company_id UUID REFERENCES companies(id),
  role TEXT DEFAULT 'member', -- owner | admin | member
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  gstin TEXT,
  cin TEXT,
  industry TEXT,
  employee_count TEXT,
  plan TEXT DEFAULT 'free', -- free | startup | growth | enterprise
  subscription_status TEXT DEFAULT 'active',
  razorpay_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessments
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  type TEXT NOT NULL, -- dpdp | gst | startup_legal | custom
  status TEXT DEFAULT 'pending', -- pending | processing | completed | failed
  score INTEGER, -- 0-100
  input_data JSONB NOT NULL,
  result JSONB,
  report_url TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Compliance Items
CREATE TABLE compliance_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  assessment_id UUID REFERENCES assessments(id),
  title TEXT NOT NULL,
  description TEXT,
  regulation TEXT NOT NULL,
  severity TEXT NOT NULL, -- critical | high | medium | low
  status TEXT DEFAULT 'open', -- open | in_progress | resolved | accepted
  due_date DATE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  type TEXT NOT NULL, -- privacy_policy | dpa | tos | nda | board_resolution
  version INTEGER DEFAULT 1,
  content TEXT,
  s3_url TEXT,
  generated_by TEXT, -- ai | manual
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compliance Calendar
CREATE TABLE compliance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  title TEXT NOT NULL,
  regulation TEXT,
  due_date DATE NOT NULL,
  recurrence TEXT, -- none | monthly | quarterly | annual
  status TEXT DEFAULT 'pending',
  notes TEXT,
  is_system BOOLEAN DEFAULT false, -- system-generated vs user-added
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Query History
CREATE TABLE legal_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) NOT NULL,
  user_id UUID REFERENCES users(id),
  query TEXT NOT NULL,
  response TEXT,
  sources JSONB, -- [{title, section, url}]
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Log
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. API Endpoints

### Authentication
```
POST /auth/webhook          Clerk webhook for user creation
GET  /auth/me               Current user + company
```

### Assessments
```
POST /assessments           Create new assessment
GET  /assessments           List company assessments
GET  /assessments/:id       Get assessment + results
GET  /assessments/:id/report Download report PDF
```

### Compliance Items
```
GET  /compliance-items           List all open items
PATCH /compliance-items/:id      Update status
GET  /compliance-items/score     Get overall compliance score
```

### Documents
```
POST /documents/privacy-policy   Generate privacy policy
POST /documents/dpa              Generate Data Processing Agreement
GET  /documents                  List all documents
GET  /documents/:id/download     Download document
```

### Calendar
```
GET  /calendar/events            List all events (with filters)
POST /calendar/events            Create custom event
PATCH /calendar/events/:id       Update event
GET  /calendar/upcoming          Next 30 days
```

### Legal Query (AI)
```
POST /query                 Submit legal query (streams response)
GET  /query/history         Past queries
GET  /query/:id             Get specific query + response
```

### Billing
```
GET  /billing/plans         Available plans + pricing
POST /billing/subscribe     Create Razorpay subscription
POST /billing/webhook       Razorpay webhook
GET  /billing/usage         Current usage vs plan limits
```

---

## 6. AI / Law Corpus Strategy

### Data Sources (Priority Order)
1. **DPDP Act 2023** + Draft Rules 2025 (official MeitY source)
2. **GST Acts** — CGST, IGST, SGST + 2000+ circulars/notifications
3. **Companies Act 2013** + MCA circulars
4. **IT Act 2000** + amendments
5. **FEMA 1999** + RBI master circulars
6. **Labour Laws** — EPF, ESIC, Shops & Establishments, Maternity Benefit
7. **SEBI Regulations** — LODR, AIF, PMS
8. **Income Tax Act** — Relevant sections for startups

### RAG Pipeline
```
Raw Documents
     │
     ▼
Document Loader (LangChain)
     │  PDF / HTML / XML parsing
     ▼
Text Chunker
     │  1000 tokens per chunk, 200 overlap
     │  Preserve section structure
     ▼
Metadata Tagger
     │  {act, section, date, amendment_no}
     ▼
Embedding (OpenAI text-embedding-3-large)
     │
     ▼
Pinecone Vector DB
     │  Namespace per regulation category
     ▼
Query Time:
  User Query
     │
     ▼
  Query Rewriter (Claude)
     │  Expand acronyms, identify regulation
     ▼
  Semantic Search (Pinecone k=8)
     │
     ▼
  Reranker (Cohere or cross-encoder)
     │  Top 4 most relevant chunks
     ▼
  Answer Generation (Claude Sonnet)
     │  With citations to source sections
     ▼
  Response + Sources
```

### Assessment Engine
```
User Input (JSON)
     │
     ▼
Rule Engine (deterministic checks)
     │  E.g., "collects health data AND no DPO = CRITICAL gap"
     │  100+ rules covering all DPDP requirements
     ▼
AI Narrative Layer (Claude)
     │  Generates plain-English explanations
     │  Prioritises gaps by business risk
     ▼
Score Calculation
     │  Weighted: Critical=20pts, High=10pts, Medium=5pts, Low=2pts
     │  Max 100 (all compliant)
     ▼
Report Generation (WeasyPrint → PDF)
     │  Executive summary + detailed findings + remediation plan
     ▼
Email Delivery (Resend) + S3 Storage
```

---

## 7. Security Architecture

### Data Security
- All data encrypted at rest (AES-256, AWS KMS)
- All transit via TLS 1.3
- Indian data residency (AWS ap-south-1 Mumbai)
- Row-Level Security in Supabase (companies cannot see each other's data)
- PII fields encrypted at application layer (assessment responses)

### Authentication & Authorization
- Clerk for identity (supports Google, Microsoft, phone OTP)
- JWT with 15-minute expiry + refresh tokens
- Role-based access: Owner > Admin > Member
- API key support for enterprise integrations

### Compliance (Eating Our Own Dogfood)
- VakilAI itself is DPDP Act compliant (of course)
- ISO 27001 roadmap (Year 1 target)
- SOC 2 Type II (Year 2 target)
- GDPR compliant for EU customers
- Grievance Officer designated as required by DPDP Act

---

## 8. Pricing & Business Model

| Plan | Price | Target | Key Limits |
|------|-------|--------|-----------|
| Free | ₹0 | Validation | 1 DPDP assessment, basic report |
| Startup | ₹3,000/mo | < Series A | 2 assessments/mo, policy gen, calendar |
| Growth | ₹12,000/mo | Series A-C | Unlimited assessments, GST intel, legal query (100 queries/mo) |
| Enterprise | ₹50,000/mo | Listed/Large | Custom integrations, SLA, dedicated manager |
| Audit Report | ₹15,000 one-time | Any | Full DPDP audit PDF (no subscription) |

**Unit Economics Target (Year 2):**
- CAC: ₹8,000 (inbound-led, content marketing)
- LTV: ₹1,80,000 (15-month average retention × ₹12,000 ARPU)
- LTV:CAC ratio: 22.5× (excellent for SaaS)
- Gross margin: 78% (LLM costs ~8%, infra ~14%)

---

## 9. Go-To-Market Strategy

### Phase 1 — Validation (Now → Month 2)
- Target: 10 paying customers, ₹1.5L revenue
- Channel: Founder's personal network, cold outreach to 100 startups
- Offer: Free DPDP audit report (₹15K value) → convert to subscription
- Message: "Your company must comply with DPDP Act by Q3 2026 — we'll tell you exactly what to fix"

### Phase 2 — Traction (Month 3–6)
- Target: 50 customers, ₹5L MRR
- Channels: Content marketing (DPDP guides, SEO), startup communities (YC India, Antler, 100X.VC networks), CA/lawyer referral program (20% commission)
- Product: Self-serve onboarding, automated assessments

### Phase 3 — Scale (Month 7–18)
- Target: 300 customers, ₹30L MRR
- Channels: Enterprise sales team (2 people), partnership with Big4 CA firms
- Product: Full platform (GST + legal stack)
- Fundraising: ₹3-5 crore seed round at ₹25-30 crore valuation

---

## 10. Development Roadmap

### Sprint 1 (Weeks 1-2): Foundation
- [ ] Next.js project setup (app router, TypeScript, Tailwind)
- [ ] Supabase setup (schema migration, RLS policies)
- [ ] Clerk auth integration
- [ ] Basic API skeleton (Express + Prisma)
- [ ] CI/CD pipeline (GitHub Actions → Vercel/Railway)

### Sprint 2 (Weeks 3-4): Core AI
- [ ] Law corpus ingestion pipeline (DPDP Act first)
- [ ] Pinecone setup + embedding pipeline
- [ ] Basic RAG query endpoint
- [ ] Assessment rule engine (DPDP rules only — 50+ rules)

### Sprint 3 (Weeks 5-6): MVP Features
- [ ] DPDP Assessment form (7 steps)
- [ ] Assessment processing + scoring
- [ ] PDF report generation
- [ ] Privacy policy generator
- [ ] Email delivery

### Sprint 4 (Weeks 7-8): Product Polish
- [ ] Compliance calendar
- [ ] Legal query interface (streaming)
- [ ] Dashboard with score visualization
- [ ] Razorpay payment integration
- [ ] Onboarding flow

### Sprint 5 (Weeks 9-10): Launch
- [ ] Beta with 10 design partners
- [ ] Bug fixes from beta feedback
- [ ] Marketing site live
- [ ] Public launch (Product Hunt, Twitter/X, startup communities)

---

## 11. Team & Hiring Plan

| Role | When | Type | Budget |
|------|------|------|--------|
| Legal Advisor | Month 1 | Part-time equity advisor | 0.5-1% equity |
| AI/ML Engineer | Month 2 | Contract (3 months) | ₹80-100K/month |
| Full-stack Developer | Month 3 | Full-time | ₹60-80K/month |
| Legal Domain Researcher | Month 2 | Part-time contract | ₹30-40K/month |
| Sales/BD | Month 5 | Full-time | ₹40K + commission |

**Total burn rate by Month 6:** ~₹3-3.5L/month
**Revenue target by Month 6:** ₹4-5L MRR (profitable)

---

*This document is confidential. Property of Adeyas Technologies Private Limited.*
