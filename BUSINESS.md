# The Precinct — Business Model & Product Strategy

## Core Value Proposition

AI-powered interviews that feel like conversations, not forms. The Precinct replaces SurveyMonkey/Typeform with an interviewer that adapts in real time — then opens deliberation so communities can find common ground.

**precinct.city** is a living archive of those conversations. The same place also does four civic jobs:

1. **Deliberative polling** — Informed, structured public dialogue to gauge how opinion changes before and after deliberation.
2. **Comprehensive survey** — Broad community perspectives at scale, with accessible feedback.
3. **Active elicitation** — Uncovers values, priority issues, and creative solutions through targeted engagement.
4. **Civic bridge** — Connects diverse local voices directly to policy decision-makers.

### Precinct for Government

| Record | Mandate | Partner |
|--------|---------|---------|
| **Natal Precinct Records** | Infrastructure feedback & service delivery sentiment (KZN) | DPWI — [publicworks.gov.za](http://publicworks.gov.za/) |

Demo: `?demo=government`

Climate and AI are experimental examples (same idea as a conference template), not the departmental briefing: `?demo=climate`, `?demo=ai`.

---

## User Roles

| Role | Description | Access |
|------|-------------|--------|
| **Creator** | Designs surveys, selects AI model, shares links, views results | Full platform access |
| **Respondent** | Fills surveys via shared link, sees personal summary when done | Interview-only view (no builder, no model config) |
| **Admin** | Manages team, billing, API keys | Org-level settings |

---

## Monetization Tiers

### 1. Free Tier — `precinct:free`
- **3 surveys/month**, max 10 responses each
- Base Fast model only (GPT-OSS 20B)
- Basic question types (MC, Scale, Text, Yes/No)
- No AB_TEST or Matrix
- The Precinct branding on respondent view
- No export

### 2. Pro — `precinct:pro` — $29/mo per seat
- **Unlimited surveys**, max 500 responses each
- All 4 AI models (Fast, Reasoning, Thinking, Pro)
- All question types including AB_TEST tournaments
- Voice transcription (Whisper)
- CSV/JSON export
- Custom branding (logo, colors)
- Response analytics dashboard
- Priority support

### 3. Team — `precinct:team` — $79/mo (up to 5 seats, $15/additional)
- Everything in Pro
- **Unlimited responses**
- Shared survey library across team
- Role-based access (Creator, Viewer, Admin)
- API access for programmatic survey creation
- Webhook integrations (Slack, Zapier)
- SSO (Google, Microsoft)

### 4. Enterprise — `precinct:enterprise` — Custom pricing
- Everything in Team
- **Dedicated AI model fine-tuning** on company tone/style
- On-premise deployment option
- Custom integrations (Salesforce, HubSpot)
- SLA guarantees
- Dedicated account manager
- Audit logs & compliance (SOC2, GDPR)

---

## Revenue Streams

### Primary
1. **SaaS Subscriptions** — Monthly/annual platform access
2. **Per-response pricing** — For high-volume users beyond tier limits (e.g., $0.02/response overage)

### Secondary
3. **AI Model Credits** — Thinking (Qwen) and Pro (GPT-OSS 120B) use more compute; charge premium for heavy usage
4. **White-label licensing** — Companies embed The Precinct in their own product (custom branding, API-only)
5. **Marketplace** — Sell pre-built survey templates (industry-specific playbooks)

### Future
6. **Precinct Insights** — AI-generated analysis reports from survey data ($5-15/report)
7. **Panel Recruitment** — Connect creators with respondent panels (commission-based)

---

## Payment Implementation Plan

### Phase 1: Foundation (Current)
- [ ] Shareable survey links (respondent view)
- [ ] Response collection & storage
- [ ] Basic results dashboard
- No payments, all features available

### Phase 2: Stripe Integration
- [ ] `stripe.com/billing` for subscription management
- [ ] Stripe Checkout for upgrade flow
- [ ] Usage metering for per-response billing
- [ ] Customer portal for self-serve billing management

**Stripe Products to Create:**
```
precinct_pro_monthly    → $29/mo
precinct_pro_annual     → $290/yr (save 17%)
precinct_team_monthly   → $79/mo
precinct_team_annual    → $790/yr
precinct_response_pack  → $10 for 500 additional responses
```

### Phase 3: Enterprise
- [ ] Custom quotes via sales flow
- [ ] Annual contracts with invoicing
- [ ] Volume discounts on AI model usage

---

## Key Metrics to Track

| Metric | Target |
|--------|--------|
| Survey creation → share conversion | >60% |
| Share → first response | >40% |
| Free → Pro upgrade | >5% |
| Monthly churn (Pro) | <5% |
| Avg responses per survey | >25 |
| NPS | >50 |

---

## Competitive Positioning

| Feature | Typeform | SurveyMonkey | Google Forms | **The Precinct** |
|---------|----------|--------------|--------------|------------|
| AI-generated surveys | ❌ | Basic | ❌ | ✅ Advanced |
| Conversational interview | ❌ | ❌ | ❌ | ✅ |
| AB_TEST tournaments | ❌ | ❌ | ❌ | ✅ |
| Voice input | ❌ | ❌ | ❌ | ✅ |
| Multi-model selection | ❌ | ❌ | ❌ | ✅ |
| Real-time adaptation | ❌ | ❌ | ❌ | ✅ |
| Free tier | Limited | Limited | ✅ | ✅ |
| Pricing | $25-83/mo | $25-75/mo | Free | $29-79/mo |

---

## Go-to-Market

1. **Launch on Product Hunt** — "AI that interviews your users for you"
2. **Academic/Research segment** — Free tier for .edu emails, partner with research labs
3. **UX Research teams** — Replace moderated user interviews with AI
4. **HR/Recruiting** — AI-conducted candidate feedback surveys
5. **Content marketing** — "Survey design is broken" thought leadership

---

## Technical Architecture for Sharing

```
Creator Flow:
  Build Survey → Generate Link → Share
  
Respondent Flow:
  Open Link → AI Interview → Submit → See Summary
  
Data Flow:
  Responses stored per survey ID
  Creator dashboard aggregates responses
  Export as CSV/JSON
```

### Link Format
```
https://precinct.city/s/<survey-id>       # Production (with backend)
https://app.com/#/respond/<base64-data>   # MVP (client-only, no backend)
```

---

## Notes

- **API Keys**: In production, AI calls should route through a backend proxy to protect API keys. Current client-side implementation is for development only.
- **Data Privacy**: Respondent data should be encrypted at rest. Survey responses should not be tied to identifiable information unless the creator explicitly collects it.
- **GDPR**: Need consent flows for EU respondents, data deletion requests, export functionality.
