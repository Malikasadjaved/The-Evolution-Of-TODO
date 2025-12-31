"""
Integration Tests for Phase 3

This package contains integration tests for:
- Chat endpoint (POST /api/chat/{user_id})
- Agent orchestration (multi-tool workflows)
- Phase 2 integration (tasks created via chatbot visible in web UI)
- Database operations across conversations and messages

Test Coverage: 15+ integration tests per spec.md
Test Approach: Real database transactions with rollback fixtures

Constitution: .specify/memory/phase-3-constitution.md (v1.1.0)
"""
