---
id: 003
title: Reusable Intelligence Principle Addition
stage: constitution
date: 2025-12-06
surface: agent
model: claude-sonnet-4-5-20250929
feature: none
branch: master
user: Home
command: /sp.constitution
labels: ["constitution", "amendment", "reusable-intelligence", "agent-skills", "subagents", "slash-commands", "mcp-servers", "cloud-native-blueprints"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
  - .specify/skills/ (directory created)
  - .specify/blueprints/ (directory created)
tests:
  - null
---

## Prompt

i also want to Work Reusable intelligence -- Create and use reusable intelligence via claude code subagents and agent skills. Do i need to write this also in contitution?

[User clarification: Add as Core Principle with all capabilities - subagents, slash commands, agent skills, MCP servers. Create cloud-native blueprints via agent skills.]

## Response snapshot

Updated constitution from v2.0.0 to v2.1.0 (MINOR version bump) to add new **Core Principle IV: Reusable Intelligence & Agent-Driven Development**.

**New Principle IV mandates:**

1. **Subagents for Complex Tasks**
   - Use Task tool with Explore, Plan, and general-purpose agents
   - Launch subagents in parallel for independent tasks
   - Prefer subagents over manual multi-step operations

2. **Custom Slash Commands** (required commands to create)
   - `/test-tier <tier>`: Run tier-specific tests
   - `/build`: Build and validate application
   - `/coverage`: Generate test coverage report
   - `/lint-all`: Run all linters (black, flake8, mypy)
   - `/validate-tier <tier>`: Verify tier completion against constitution

3. **Agent Skills & Cloud-Native Blueprints**
   - Test Runner Skill, Code Analyzer Skill, Task Validator Skill
   - Data Model Generator Skill, CLI Builder Skill
   - Blueprints for CRUD operations, filtering/sorting, CLI menus
   - Skills must be self-contained, parameterized, and documented

4. **MCP Server Integration**
   - Integrate MCP servers for extended capabilities
   - Document configuration, prefer official servers
   - Thorough testing of integrations

**Project structure additions:**
- `.specify/skills/` - Agent skills (reusable AI workflows)
- `.specify/blueprints/` - Cloud-native code generation blueprints
- Updated `.specify/templates/commands/` with required slash commands

**Principle renumbering:**
- IV → V (Python Project Structure)
- V → VI (Test-First Development)
- VI → VII (User Experience & Error Handling)

## Outcome

- ✅ Impact: Elevates reusable intelligence to core principle, mandating agent-driven development practices across entire project lifecycle
- 🧪 Tests: Agent skills must have acceptance criteria; blueprints must generate code passing all quality gates
- 📁 Files: Updated .specify/memory/constitution.md (v2.0.0 → v2.1.0), created .specify/skills/ and .specify/blueprints/ directories
- 🔁 Next prompts: Create initial agent skills (test-runner, code-analyzer, task-validator, data-model-gen, cli-builder) and required slash commands
- 🧠 Reflection: Reusable intelligence principle ensures consistency, captures institutional knowledge, and accelerates development through composable AI workflows. Agent skills and blueprints will eliminate repetitive manual work.

## Evaluation notes (flywheel)

- Failure modes observed: None - principle successfully integrated with all four capability types
- Graders run and results (PASS/FAIL): Manual validation PASS (proper MINOR version bump, principle renumbering correct, directory structure created)
- Prompt variant (if applicable): N/A (constitution amendment)
- Next experiment (smallest change to try): Create first agent skill (test-runner.skill.md) to validate skill structure and ensure it integrates well with development workflow
