# Claude Code Development Guide

> **📘 For Developers Using Claude Code**
> This file contains development guidelines and rules for contributing to this project using Claude Code.

## Overview

This project was built using [Claude Code](https://claude.ai/code), an AI-powered development tool that specializes in **Spec-Driven Development (SDD)** and **Test-Driven Development (TDD)**.

### What is Claude Code?

Claude Code is an AI assistant that helps developers:
- Plan and architect features before coding
- Write tests first (TDD approach)
- Generate clean, well-documented code
- Maintain high code quality standards
- Follow consistent development workflows

---

## For Contributors

If you want to contribute to this project using Claude Code, follow these guidelines:

### Quick Start for Claude Code Users

1. **Install Claude Code:** Download from https://claude.ai/code
2. **Open this project:** `cd` into the project directory
3. **Read the constitution:** Check `.specify/memory/constitution.md` for project principles
4. **Follow TDD:** Always write tests before implementation
5. **Use specs:** Create spec documents in `specs/` before coding features

---

## Development Workflow (Claude Code Specific)

This file contains the complete development rules and guidelines for working with Claude Code on this project.

## Task context

**Your Surface:** You operate on a project level, providing guidance to users and executing development tasks via a defined set of tools.

**Your Success is Measured By:**
- All outputs strictly follow the user intent.
- Prompt History Records (PHRs) are created automatically and accurately for every user prompt.
- Architectural Decision Record (ADR) suggestions are made intelligently for significant decisions.
- All changes are small, testable, and reference code precisely.

## Core Guarantees (Product Promise)

- Record every user input verbatim in a Prompt History Record (PHR) after every user message. Do not truncate; preserve full multiline input.
- PHR routing (all under `history/prompts/`):
  - Constitution → `history/prompts/constitution/`
  - Feature-specific → `history/prompts/<feature-name>/`
  - General → `history/prompts/general/`
- ADR suggestions: when an architecturally significant decision is detected, suggest: "📋 Architectural decision detected: <brief>. Document? Run `/sp.adr <title>`." Never auto‑create ADRs; require user consent.

## Development Guidelines

### 1. Authoritative Source Mandate:
Agents MUST prioritize and use MCP tools and CLI commands for all information gathering and task execution. NEVER assume a solution from internal knowledge; all methods require external verification.

### 2. Execution Flow:
Treat MCP servers as first-class tools for discovery, verification, execution, and state capture. PREFER CLI interactions (running commands and capturing outputs) over manual file creation or reliance on internal knowledge.

### 3. Knowledge capture (PHR) for Every User Input.
After completing requests, you **MUST** create a PHR (Prompt History Record).

**When to create PHRs:**
- Implementation work (code changes, new features)
- Planning/architecture discussions
- Debugging sessions
- Spec/task/plan creation
- Multi-step workflows

**PHR Creation Process:**

1) Detect stage
   - One of: constitution | spec | plan | tasks | red | green | refactor | explainer | misc | general

2) Generate title
   - 3–7 words; create a slug for the filename.

2a) Resolve route (all under history/prompts/)
  - `constitution` → `history/prompts/constitution/`
  - Feature stages (spec, plan, tasks, red, green, refactor, explainer, misc) → `history/prompts/<feature-name>/` (requires feature context)
  - `general` → `history/prompts/general/`

3) Prefer agent‑native flow (no shell)
   - Read the PHR template from one of:
     - `.specify/templates/phr-template.prompt.md`
     - `templates/phr-template.prompt.md`
   - Allocate an ID (increment; on collision, increment again).
   - Compute output path based on stage:
     - Constitution → `history/prompts/constitution/<ID>-<slug>.constitution.prompt.md`
     - Feature → `history/prompts/<feature-name>/<ID>-<slug>.<stage>.prompt.md`
     - General → `history/prompts/general/<ID>-<slug>.general.prompt.md`
   - Fill ALL placeholders in YAML and body:
     - ID, TITLE, STAGE, DATE_ISO (YYYY‑MM‑DD), SURFACE="agent"
     - MODEL (best known), FEATURE (or "none"), BRANCH, USER
     - COMMAND (current command), LABELS (["topic1","topic2",...])
     - LINKS: SPEC/TICKET/ADR/PR (URLs or "null")
     - FILES_YAML: list created/modified files (one per line, " - ")
     - TESTS_YAML: list tests run/added (one per line, " - ")
     - PROMPT_TEXT: full user input (verbatim, not truncated)
     - RESPONSE_TEXT: key assistant output (concise but representative)
     - Any OUTCOME/EVALUATION fields required by the template
   - Write the completed file with agent file tools (WriteFile/Edit).
   - Confirm absolute path in output.

4) Use sp.phr command file if present
   - If `.**/commands/sp.phr.*` exists, follow its structure.
   - If it references shell but Shell is unavailable, still perform step 3 with agent‑native tools.

5) Shell fallback (only if step 3 is unavailable or fails, and Shell is permitted)
   - Run: `.specify/scripts/bash/create-phr.sh --title "<title>" --stage <stage> [--feature <name>] --json`
   - Then open/patch the created file to ensure all placeholders are filled and prompt/response are embedded.

6) Routing (automatic, all under history/prompts/)
   - Constitution → `history/prompts/constitution/`
   - Feature stages → `history/prompts/<feature-name>/` (auto-detected from branch or explicit feature context)
   - General → `history/prompts/general/`

7) Post‑creation validations (must pass)
   - No unresolved placeholders (e.g., `{{THIS}}`, `[THAT]`).
   - Title, stage, and dates match front‑matter.
   - PROMPT_TEXT is complete (not truncated).
   - File exists at the expected path and is readable.
   - Path matches route.

8) Report
   - Print: ID, path, stage, title.
   - On any failure: warn but do not block the main command.
   - Skip PHR only for `/sp.phr` itself.

### 4. Explicit ADR suggestions
- When significant architectural decisions are made (typically during `/sp.plan` and sometimes `/sp.tasks`), run the three‑part test and suggest documenting with:
  "📋 Architectural decision detected: <brief> — Document reasoning and tradeoffs? Run `/sp.adr <decision-title>`"
- Wait for user consent; never auto‑create the ADR.

### 5. Human as Tool Strategy
You are not expected to solve every problem autonomously. You MUST invoke the user for input when you encounter situations that require human judgment. Treat the user as a specialized tool for clarification and decision-making.

**Invocation Triggers:**
1.  **Ambiguous Requirements:** When user intent is unclear, ask 2-3 targeted clarifying questions before proceeding.
2.  **Unforeseen Dependencies:** When discovering dependencies not mentioned in the spec, surface them and ask for prioritization.
3.  **Architectural Uncertainty:** When multiple valid approaches exist with significant tradeoffs, present options and get user's preference.
4.  **Completion Checkpoint:** After completing major milestones, summarize what was done and confirm next steps. 

## Default policies (must follow)
- Clarify and plan first - keep business understanding separate from technical plan and carefully architect and implement.
- Do not invent APIs, data, or contracts; ask targeted clarifiers if missing.
- Never hardcode secrets or tokens; use `.env` and docs.
- Prefer the smallest viable diff; do not refactor unrelated code.
- Cite existing code with code references (start:end:path); propose new code in fenced blocks.
- Keep reasoning private; output only decisions, artifacts, and justifications.

### Execution contract for every request
1) Confirm surface and success criteria (one sentence).
2) List constraints, invariants, non‑goals.
3) Produce the artifact with acceptance checks inlined (checkboxes or tests where applicable).
4) Add follow‑ups and risks (max 3 bullets).
5) Create PHR in appropriate subdirectory under `history/prompts/` (constitution, feature-name, or general).
6) If plan/tasks identified decisions that meet significance, surface ADR suggestion text as described above.

### Minimum acceptance criteria
- Clear, testable acceptance criteria included
- Explicit error paths and constraints stated
- Smallest viable change; no unrelated edits
- Code references to modified/inspected files where relevant

## Architect Guidelines (for planning)

Instructions: As an expert architect, generate a detailed architectural plan for [Project Name]. Address each of the following thoroughly.

1. Scope and Dependencies:
   - In Scope: boundaries and key features.
   - Out of Scope: explicitly excluded items.
   - External Dependencies: systems/services/teams and ownership.

2. Key Decisions and Rationale:
   - Options Considered, Trade-offs, Rationale.
   - Principles: measurable, reversible where possible, smallest viable change.

3. Interfaces and API Contracts:
   - Public APIs: Inputs, Outputs, Errors.
   - Versioning Strategy.
   - Idempotency, Timeouts, Retries.
   - Error Taxonomy with status codes.

4. Non-Functional Requirements (NFRs) and Budgets:
   - Performance: p95 latency, throughput, resource caps.
   - Reliability: SLOs, error budgets, degradation strategy.
   - Security: AuthN/AuthZ, data handling, secrets, auditing.
   - Cost: unit economics.

5. Data Management and Migration:
   - Source of Truth, Schema Evolution, Migration and Rollback, Data Retention.

6. Operational Readiness:
   - Observability: logs, metrics, traces.
   - Alerting: thresholds and on-call owners.
   - Runbooks for common tasks.
   - Deployment and Rollback strategies.
   - Feature Flags and compatibility.

7. Risk Analysis and Mitigation:
   - Top 3 Risks, blast radius, kill switches/guardrails.

8. Evaluation and Validation:
   - Definition of Done (tests, scans).
   - Output Validation for format/requirements/safety.

9. Architectural Decision Record (ADR):
   - For each significant decision, create an ADR and link it.

### Architecture Decision Records (ADR) - Intelligent Suggestion

After design/architecture work, test for ADR significance:

- Impact: long-term consequences? (e.g., framework, data model, API, security, platform)
- Alternatives: multiple viable options considered?
- Scope: cross‑cutting and influences system design?

If ALL true, suggest:
📋 Architectural decision detected: [brief-description]
   Document reasoning and tradeoffs? Run `/sp.adr [decision-title]`

Wait for consent; never auto-create ADRs. Group related decisions (stacks, authentication, deployment) into one ADR when appropriate.

## Basic Project Structure

- `.specify/memory/constitution.md` — Project principles (Phase 1 - preserved)
- `.specify/memory/phase-2-constitution.md` — Phase 2 constitution (v1.1.0 - ACTIVE)
- `specs/<feature>/spec.md` — Feature requirements
- `specs/<feature>/plan.md` — Architecture decisions
- `specs/<feature>/tasks.md` — Testable tasks with cases
- `history/prompts/` — Prompt History Records
- `history/adr/` — Architecture Decision Records
- `.specify/` — SpecKit Plus templates and scripts (Phase 1)
- `.spec-kit/agents.yaml` — Phase 2 agent and skill configurations

## Agent-Assisted Development (Phase 2 - CRITICAL)

**The project MUST use specialized agents for validation, auditing, and code generation per Phase 2 Constitution Section XIII.**

All agent and skill definitions are in `.spec-kit/agents.yaml`.

### Agent vs Skill Usage

| Type | Purpose | When to Use | Command Pattern |
|------|---------|-------------|-----------------|
| **Skill** | Generate boilerplate code | Before manual implementation | `"Use the <skill_name> skill to generate <file>"` |
| **Agent** | Validate existing code | After implementation | `"Create the <agent_name> agent and RUN it"` |

### Available Agents

#### 1. Spec Validator Agent
**Purpose:** Validate specifications before implementation
**Triggers:**
- Before starting implementation
- After spec updates
- During /sp.clarify workflow

**Validation Rules:**
- All API endpoints have database models
- JWT flow is consistent across all specs
- All endpoints document auth requirements
- Error responses are specified with status codes
- Validation rules are defined for all inputs
- User isolation enforced in all CRUD specs

**Usage:** `"Create the spec_validator agent and run it on specs/001-fullstack-web-app/spec.md"`

#### 2. Security Auditor Agent
**Purpose:** Audit implementation for security vulnerabilities
**Triggers:**
- After implementing authentication (JWT middleware)
- After implementing API endpoints
- Before deployment to production
- After any auth-related code changes

**Audit Checks:**
- JWT verification present on ALL protected endpoints
- Token user_id matches URL user_id check is present
- Database queries filter by token user_id (NEVER URL user_id)
- No hardcoded BETTER_AUTH_SECRET in source code
- Proper 401 vs 403 error responses (401: missing token, 403: wrong user)
- CORS configuration allows only frontend origin
- No SQL injection vulnerabilities (SQLModel parameterized queries used)

**Usage:** `"Create the security_auditor agent and run it on backend/src/api/"`

#### 3. API Contract Validator Agent
**Purpose:** Ensure frontend-backend API alignment
**Triggers:**
- After backend API implementation
- After frontend API client implementation
- After API spec changes
- Before integration testing

**Validation Checks:**
- Endpoint paths match spec exactly (e.g., /api/{user_id}/tasks)
- Request payload types align (TypeScript ↔ Pydantic)
- Response payload types align
- Frontend handles all documented error codes (401, 403, 404, 422, 500)
- Authorization: Bearer <token> header included in all protected requests
- TypeScript interfaces match Pydantic models (Task, User, Tag)

**Usage:** `"Create the api_contract_validator agent and run it to check frontend/backend alignment"`

### Available Skills

#### 1. JWT Middleware Generator
**Purpose:** Generate FastAPI JWT verification middleware following constitution Section VI (5-step JWT flow)

**Output Files:** `backend/src/api/auth.py`

**Pattern:**
1. Extract token from "Authorization: Bearer <token>" header
2. Verify signature using BETTER_AUTH_SECRET (from environment)
3. Check token expiration (reject if expired → 401)
4. Decode payload to extract user_id and email
5. Raise HTTPException 401 on any verification failure
6. Return user_id for use in route handlers

**Usage:** `"Use the jwt_middleware_generator skill to generate backend/src/api/auth.py"`

#### 2. API Client Generator
**Purpose:** Generate type-safe frontend API client with automatic JWT attachment

**Output Files:** `frontend/lib/api.ts`, `frontend/types/api.ts`

**Pattern:**
1. Auto-attach JWT token from localStorage to all requests
2. Type-safe request/response using TypeScript interfaces
3. Handle 401 Unauthorized → redirect to /login
4. Handle 403 Forbidden → show error toast
5. Handle network errors → show retry option
6. Debounce search requests (300ms delay)
7. Provide methods for all API endpoints (getTasks, createTask, updateTask, etc.)

**Usage:** `"Use the api_client_generator skill to generate frontend/lib/api.ts"`

### Agent Creation Timeline

1. **Constitution Phase** (✅ Completed): Agents specified in `.spec-kit/agents.yaml`
2. **Spec Writing Phase** (✅ Completed): Detailed specs created
3. **Agent Creation Phase** (Next): Create Spec Validator Agent, run on specs
4. **Implementation Phase**: Use skills to generate boilerplate (auth.py, api.ts)
5. **Audit Phase**: Create and run Security Audit Agent
6. **Integration Phase**: Create and run API Contract Agent

### Rationale
Agents automate validation, catch security issues early, and ensure frontend-backend alignment. Skills accelerate boilerplate generation following constitution patterns.

## Code Standards
See `.specify/memory/phase-2-constitution.md` for Phase 2 code quality, testing, performance, security, and architecture principles.
See `.specify/memory/constitution.md` for Phase 1 principles (preserved for reference).
