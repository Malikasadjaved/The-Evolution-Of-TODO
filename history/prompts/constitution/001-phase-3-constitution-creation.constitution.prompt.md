---
id: 001
title: Phase 3 Constitution Creation
stage: constitution
date: 2025-12-25
surface: agent
model: claude-sonnet-4.5
feature: phase-3-ai-chatbot
branch: 001-fullstack-web-app
user: system
command: /sp.constitution
labels: ["phase-3", "constitution", "mcp-architecture", "stateless", "agentic-dev"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/phase-3-constitution.md
tests:
  - null
---

## Prompt

User requested creation of Phase 3 constitution for Todo AI Chatbot project with the following requirements:

**Primary Requirements:**
1. Implement conversational interface for all Basic Level features
2. Use OpenAI Agents SDK for AI logic
3. Build MCP server with Official MCP SDK that exposes task operations as tools
4. Stateless chat endpoint that persists conversation state to database
5. AI agents use MCP tools to manage tasks (MCP tools also stateless and store state in database)

**Technology Stack:**
- Frontend: OpenAI ChatKit
- Backend: Python FastAPI
- AI Framework: OpenAI Agents SDK
- MCP Server: Official MCP SDK
- ORM: SQLModel
- Database: Neon Serverless PostgreSQL
- Authentication: Better Auth

**Architecture Principles (from Constitutional Specification v2.0):**
1. **Agentic Development Mandate**: NO manual coding - all implementation through Claude Code
2. **Radical Statelessness**: Server holds zero conversation state in memory, database is single source of truth
3. **MCP as Universal Interface**: All AI-to-application interactions flow through MCP tools only
4. **Single Endpoint Doctrine**: POST /api/chat/{user_id} for all operations
5. **Security First**: Every operation scoped by user_id, no cross-user data access

**Database Models:**
- tasks (existing from Phase 2)
- conversations (new - tracks chat sessions)
- messages (new - complete conversation history with role tracking)

**MCP Tools (5 atomic tools):**
1. add_task - Create only, no updates
2. list_tasks - Read with filtering (all/pending/completed)
3. complete_task - State transition only
4. delete_task - Removal only
5. update_task - Modifications only

**Key Deliverables:**
- Complete constitutional specification in `.specify/memory/phase-3-constitution.md`
- Comprehensive architecture documentation
- Agent behavior specification
- Security and privacy rules
- Testing strategy (Unit → Integration → E2E)
- Deployment requirements including OpenAI ChatKit domain allowlist configuration
- Success criteria and acceptance tests

## Response snapshot

Created comprehensive Phase 3 Constitution (v1.0.0) with the following structure:

**Core Principles (Section I):**
- Principle 1: Agentic Development Supremacy (NO manual coding)
- Principle 2: Radical Statelessness (server = pure function)
- Principle 3: MCP as Universal Interface (only agent-to-app connection)

**Architecture (Section II):**
- Four-layer architecture: ChatKit UI → FastAPI Endpoint → OpenAI Agent → MCP Tools → Database
- Clear separation of concerns with layer boundary rules
- No layer skipping permitted

**Database Schema (Section III):**
- Extended tasks table from Phase 2
- New conversations table for chat session tracking
- New messages table with conversation_id FK and role (user/assistant)
- Proper indexes and cascade delete constraints

**MCP Tools Specification (Section IV):**
- 5 atomic tools with complete contracts, error handling, and examples
- Critical rule: MCP tools NEVER call each other
- Agent orchestrates multi-tool workflows

**Agent Behavior (Section V):**
- Natural language understanding mandates
- Tool selection logic
- Error handling standards
- Conversational context resolution from database

**Technology Stack (Section VI):**
- Immutable technology choices table
- Forbidden substitutions list
- Dependency management requirements

**Single Endpoint (Section VII):**
- POST /api/chat/{user_id} as sole interface
- Request/response schema specifications
- Rationale for single endpoint design

**Security & Privacy (Section VIII):**
- User isolation patterns (correct vs forbidden)
- Authentication token validation
- Input validation with Pydantic
- SQL injection prevention
- Secrets management

**Testing Strategy (Section IX):**
- Test pyramid: 50+ unit tests, 15+ integration, 5+ E2E
- Coverage requirements by layer
- Specific test scenarios

**Agentic Development Workflow (Section X):**
- 5-phase workflow: Specification → Planning → Task Breakdown → Implementation → Review
- Documentation requirements (AGENTIC_DEV_LOG.md)
- Prompt engineering guidelines

**Monitoring & Observability (Section XI):**
- Structured logging standards
- Metrics to track with alert thresholds
- Performance and cost monitoring

**Deployment Requirements (Section XII):**
- Step-by-step OpenAI ChatKit domain allowlist configuration
- Common deployment pitfalls
- Environment variable reference

**Success Criteria (Section XIII):**
- 8 functional requirements with acceptance criteria
- 6 technical requirements
- Complete testing checklist

**Governance:**
- Amendment procedure with semantic versioning
- Compliance verification
- Version: 1.0.0 | Ratified: 2025-12-25

**Additional Features:**
- Quick Reference Card with core principles
- Quick Checks for common questions
- Forbidden Practices ("Never" List) with 10 critical anti-patterns
- Constitutional compliance verification checklist

## Outcome

- ✅ Impact: Created comprehensive Phase 3 constitution establishing architectural foundation for stateless AI chatbot with MCP tools
- 🧪 Tests: No tests required (documentation artifact)
- 📁 Files: Created `.specify/memory/phase-3-constitution.md` (12,000+ words, 400+ lines)
- 🔁 Next prompts:
  1. `/sp.specify` - Create Phase 3 feature specification
  2. `/sp.plan` - Generate implementation plan for MCP server and agent integration
  3. `/sp.tasks` - Break down plan into atomic implementation tasks
- 🧠 Reflection: Constitution successfully captures all critical requirements from Phase III document and Constitutional Specification v2.0. Key strengths: clear four-layer architecture, comprehensive MCP tool contracts, strong emphasis on statelessness and agentic development. Ready for implementation phase.

## Evaluation notes (flywheel)

- Failure modes observed: None - constitution creation successful on first iteration
- Graders run and results (PASS/FAIL):
  - Constitutional completeness: PASS (all 13 sections present)
  - Architectural clarity: PASS (four-layer architecture clearly defined)
  - Security coverage: PASS (user isolation, auth, input validation documented)
  - Agentic dev mandate: PASS (zero manual coding enforced)
  - Statelessness principle: PASS (clearly articulated with examples)
- Prompt variant (if applicable): Initial constitution creation - no variants yet
- Next experiment (smallest change to try): N/A - ready to proceed to specification phase
