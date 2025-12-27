# mypy: ignore-errors
"""
Chat endpoint for AI chatbot with MCP architecture.

Handles natural language conversation for task management.

Constitution: .specify/memory/phase-3-constitution.md (v1.1.0)
Spec: specs/002-ai-chatbot-mcp/spec.md Section 4.1

Endpoint: POST /api/{user_id}/chat
Request: {"message": str, "conversation_id": Optional[int]}
Response: {"message": str, "conversation_id": int}

Flow:
1. Authenticate JWT token (extract user_id from token)
2. Verify token user_id matches URL user_id (403 if mismatch)
3. Load or create conversation
4. Store user message in database
5. Load conversation history
6. Call OpenAI Agent with context
7. Store assistant response in database
8. Return assistant message and conversation_id

Implementation: Task T028 (Phase 3: User Story 1)
"""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from src.api.auth import get_current_user
from src.api.db import get_session
from src.api.models import Conversation, Message, MessageRole
from src.api.schemas.chat import ChatRequest, ChatResponse
from src.api.services.agent import call_openai_agent
from mcp.utils.conversation_manager import ConversationManager
from mcp.utils.logger import StructuredLogger

router = APIRouter()
logger = StructuredLogger(service_name="chat-api")


@router.post("/api/{user_id}/chat", response_model=ChatResponse)
async def chat(
    user_id: str,
    request: ChatRequest,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> ChatResponse:
    """
    Handle chat message and return assistant response.

    This endpoint:
    1. Authenticates user via JWT token
    2. Enforces user isolation (token user_id must match URL user_id)
    3. Creates or loads conversation
    4. Stores user message
    5. Calls OpenAI Agent with conversation context
    6. Stores assistant response
    7. Returns assistant message

    Args:
        user_id: User ID from URL path
        request: Chat request with message and optional conversation_id
        current_user: User ID from JWT token (dependency injection)
        session: Database session (dependency injection)

    Returns:
        ChatResponse with assistant message and conversation_id

    Raises:
        HTTPException 401: Invalid or missing JWT token
        HTTPException 403: Token user_id doesn't match URL user_id
        HTTPException 404: Conversation not found
        HTTPException 422: Invalid request body
        HTTPException 500: OpenAI API error or internal error

    Example:
        POST /api/user_123/chat
        Headers: {"Authorization": "Bearer <jwt_token>"}
        Body: {"message": "Add a task to buy groceries"}
        Response: {
            "message": "I've created a task to buy groceries.",
            "conversation_id": 42
        }
    """
    # Step 1: Authorization check (user_id from token must match URL)
    if user_id != current_user:
        logger.warning(
            event="authorization_failed",
            message="Token user_id does not match URL user_id",
            url_user_id=user_id,
            token_user_id=current_user,
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You can only access your own conversations",
        )

    logger.info(
        event="chat_request_received",
        message="Processing chat message",
        user_id=user_id,
        conversation_id=request.conversation_id,
        message_length=len(request.message),
    )

    try:
        # Step 2: Load or create conversation
        conversation = _get_or_create_conversation(
            session=session, user_id=user_id, conversation_id=request.conversation_id
        )

        # Step 3: Store user message
        user_message = Message(
            conversation_id=conversation.id,
            user_id=user_id,
            role=MessageRole.USER,
            content=request.message,
            created_at=datetime.utcnow(),
        )
        session.add(user_message)
        session.commit()

        logger.info(
            event="user_message_stored",
            message="User message stored in database",
            user_id=user_id,
            conversation_id=conversation.id,
            message_id=user_message.id,
        )

        # Step 4: Load conversation history for context
        conversation_manager = ConversationManager(session=session)
        conversation_history = conversation_manager.load_conversation_history(
            conversation_id=conversation.id
        )

        # Step 5: Call OpenAI Agent
        try:
            assistant_response = call_openai_agent(
                session=session,
                user_id=user_id,
                conversation_history=conversation_history,
                user_message=request.message,
            )
        except Exception as e:
            logger.error(
                event="openai_agent_failed",
                message="OpenAI Agent call failed",
                user_id=user_id,
                conversation_id=conversation.id,
                error=str(e),
                error_type=type(e).__name__,
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "error": "Chat service temporarily unavailable",
                    "message": "Our AI assistant is currently unavailable. Please try again later or use the web interface.",
                },
            )

        # Step 6: Store assistant response
        assistant_message = Message(
            conversation_id=conversation.id,
            user_id=user_id,
            role=MessageRole.ASSISTANT,
            content=assistant_response,
            created_at=datetime.utcnow(),
        )
        session.add(assistant_message)
        session.commit()

        logger.info(
            event="assistant_message_stored",
            message="Assistant response stored in database",
            user_id=user_id,
            conversation_id=conversation.id,
            message_id=assistant_message.id,
            response_length=len(assistant_response),
        )

        # Step 7: Return response
        return ChatResponse(message=assistant_response, conversation_id=conversation.id)

    except HTTPException:
        # Re-raise HTTP exceptions (already logged above)
        raise

    except Exception as e:
        # Catch-all for unexpected errors
        logger.error(
            event="chat_endpoint_error",
            message="Unexpected error in chat endpoint",
            user_id=user_id,
            error=str(e),
            error_type=type(e).__name__,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error"
        )


def _get_or_create_conversation(
    session: Session, user_id: str, conversation_id: Optional[int]
) -> Conversation:
    """
    Load existing conversation or create new one.

    Args:
        session: Database session
        user_id: User identifier (for isolation check)
        conversation_id: Optional existing conversation ID

    Returns:
        Conversation object (existing or newly created)

    Raises:
        HTTPException 404: Conversation not found
        HTTPException 403: Conversation belongs to different user
    """
    if conversation_id is not None:
        # Load existing conversation
        statement = select(Conversation).where(Conversation.id == conversation_id)
        conversation = session.exec(statement).first()

        if conversation is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Conversation not found: {conversation_id}",
            )

        # Verify conversation belongs to current user (user isolation)
        if conversation.user_id != user_id:
            logger.warning(
                event="conversation_access_denied",
                message="User attempted to access another user's conversation",
                requesting_user_id=user_id,
                conversation_owner_id=conversation.user_id,
                conversation_id=conversation_id,
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Conversation not found or you don't have permission",
            )

        return conversation

    else:
        # Create new conversation
        conversation = Conversation(
            user_id=user_id, created_at=datetime.utcnow(), updated_at=datetime.utcnow()
        )
        session.add(conversation)
        session.commit()
        session.refresh(conversation)

        logger.info(
            event="conversation_created",
            message="New conversation created",
            user_id=user_id,
            conversation_id=conversation.id,
        )

        return conversation
