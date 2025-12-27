# Frontend Chatbot (Phase 3)

**AI-Powered Task Management Chatbot Interface**

## Overview

This is the frontend for Phase 3 of the Todo Application - an AI chatbot interface that allows users to manage tasks through natural language conversations.

## Architecture

- **Framework**: Next.js 16+ with TypeScript
- **UI Library**: OpenAI ChatKit (React components for chat interfaces)
- **Backend**: Connects to FastAPI backend at `/api/chat/{user_id}`
- **Authentication**: JWT tokens from Better Auth (shared with Phase 2)
- **Database**: Shared Neon PostgreSQL with Phase 2

## Features

- Natural language task creation ("Add a task to buy groceries tomorrow")
- Conversational task queries ("Show me high priority tasks")
- Context-aware interactions ("Mark the first one as complete")
- Multi-turn task creation workflows
- Real-time chat interface with typing indicators

## Directory Structure

```
frontend-chatbot/
├── src/
│   ├── components/     # React components (ChatInterface, MessageList, InputBox)
│   ├── lib/            # API client, utilities
│   ├── pages/          # Next.js pages (index.tsx for main chat)
│   └── types/          # TypeScript interfaces (ChatRequest, ChatResponse)
├── public/             # Static assets
├── .env.local.example  # Environment variable template
├── package.json        # Dependencies
└── tsconfig.json       # TypeScript configuration
```

## Constitution

This frontend follows the Phase 3 constitution principles:
- **Stateless**: No client-side task state (server is source of truth)
- **Single Endpoint**: All interactions via POST /api/chat/{user_id}
- **Type-Safe**: TypeScript interfaces aligned with backend Pydantic models
- **Error Handling**: Graceful handling of 401, 403, 503 errors

## Development

Setup instructions will be added in Task T005 (Initialize package.json).

## Specification

See `specs/002-ai-chatbot-mcp/spec.md` for complete requirements.
