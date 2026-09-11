# Multi-Agent Engineering Lifecycle Workflow

This document establishes the orchestrated workflow for building, reviewing, verifying, and shipping the **AnonMsg** anonymous messaging platform using the downloaded agents and skills from `alirezarezvani/claude-skills`.

```mermaid
flowchart TD
    subgraph Research & Product
        UXR[cs-ux-researcher<br/>Anonymity Psychology & Competitor Analysis] --> PM[cs-product-manager<br/>IEEE 830 SRS & Spec Ground Truth]
        PM --> PO[cs-agile-product-owner<br/>User Stories & Acceptance Criteria]
    end

    subgraph Architecture & Engineering
        PO --> ARCH[cs-engineering-lead<br/>Architecture, Data Models, Security & Rate Limiting]
        ARCH --> BE[cs-backend-engineer<br/>Node/Express + SQLite, Auth & Message APIs]
        ARCH --> FE[cs-frontend-engineer<br/>React Tabs, Compose Dialog, Glassmorphism Inbox]
        BE & FE --> FS[cs-fullstack-engineer<br/>Integration, Session Management & Card Exporter]
    end

    subgraph QA, Review & Delivery
        FS --> KARPATHY[cs-karpathy-reviewer<br/>Simplicity, Code Smells & Robustness Audit]
        FS --> TESTS[playwright-pro & api-test-suite-builder<br/>E2E Browser & API Contract Tests]
        KARPATHY & TESTS --> PMO[cs-project-manager<br/>Verification, Sign-off & Delivery Report]
    end
```

## Agent Responsibilities Matrix

| Agent / Skill | Primary Responsibility | Key Deliverables |
|---|---|---|
| **`cs-ux-researcher`** | UX heuristics, sender anonymity dynamics, recipient satisfaction, abusive behavior mitigation. | UX Research Findings, User Empathy Maps, Screen Hierarchy. |
| **`cs-product-manager`** | Product requirements baseline, user journeys, functional & non-functional specifications. | `docs/SRS.md` |
| **`cs-engineering-lead`** | System architecture, relational data schema, security, abuse prevention, API contracts. | `docs/ARCHITECTURE.md` |
| **`cs-frontend-engineer`** | High-fidelity UI implementation, glassmorphic design system, responsive tabs, modals, micro-animations. | `src/components/*`, `src/index.css` |
| **`cs-backend-engineer`** | REST endpoints, SQLite data access layer, password hashing (bcrypt), token verification, rate limiters. | `server/*` |
| **`cs-fullstack-engineer`** | Client-server wiring, optimistic UI updates, social story card generator, seed profiles. | `src/App.jsx`, `server/index.js` |
| **`cs-karpathy-reviewer`** | Code audit for minimal complexity, zero unnecessary dependencies, idiomatic patterns, resilience. | Code Quality Review |
| **`playwright-pro`** | Automated browser walkthroughs, interaction verification, visual integrity checks. | E2E Browser Testing |
| **`cs-project-manager`** | Project progress orchestration, delivery validation, walkthrough documentation. | `walkthrough.md` |
