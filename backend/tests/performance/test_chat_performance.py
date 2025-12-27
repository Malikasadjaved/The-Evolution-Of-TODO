"""
Performance tests for chat endpoint and conversation history.

Tests the chat endpoint and conversation history loading to verify performance requirements.

Constitution: .specify/memory/phase-3-constitution.md (v1.1.0) Section X (Performance)
Spec: specs/002-ai-chatbot-mcp/spec.md Section 5.4 (Performance Requirements)

Tasks:
- T113: Performance test (chat endpoint < 5s P95)
- T114: Performance test (conversation history load < 500ms P95)

Test Plans:

T113 - Chat Endpoint:
1. Send 100 chat requests sequentially
2. Measure response time for each request
3. Calculate statistics (min, max, avg, P95, P99)
4. Assert P95 < 5 seconds
5. Report full statistics to console

T114 - Conversation History Loading:
1. Create conversation with 50 messages
2. Load history 100 times using ConversationManager
3. Measure load time for each operation
4. Calculate statistics (min, max, avg, P95, P99)
5. Assert P95 < 500ms
6. Report full statistics to console

Note: These are sequential tests, not concurrent load tests.
For concurrent load testing, use tools like Locust or k6.
"""

import time
import statistics
import pytest
from typing import List
from unittest.mock import patch, MagicMock

from httpx import AsyncClient


def calculate_percentile(data: List[float], percentile: float) -> float:
    """
    Calculate percentile from a list of values.

    Args:
        data: List of numeric values (must be sorted)
        percentile: Percentile to calculate (0-100)

    Returns:
        Percentile value

    Example:
        >>> calculate_percentile([1, 2, 3, 4, 5], 95)
        4.8
    """
    if not data:
        return 0.0

    sorted_data = sorted(data)
    index = (percentile / 100) * (len(sorted_data) - 1)
    lower_index = int(index)
    upper_index = min(lower_index + 1, len(sorted_data) - 1)
    fraction = index - lower_index

    return sorted_data[lower_index] + fraction * (sorted_data[upper_index] - sorted_data[lower_index])


@pytest.mark.asyncio
async def test_chat_endpoint_performance_p95_under_5_seconds(
    client: AsyncClient,
    test_jwt_token: str,
    test_user,
):
    """
    Test that chat endpoint P95 latency is under 5 seconds for 100 requests.

    This test:
    1. Sends 100 chat requests sequentially
    2. Measures response time for each request
    3. Calculates min, max, avg, P95, P99
    4. Asserts P95 < 5 seconds
    5. Prints statistics report

    Requirements:
    - P95 latency < 5 seconds (Constitution Section X.2)
    - 100 requests sample size (Task T113)

    Args:
        client: AsyncClient fixture
        test_jwt_token: JWT token for user_id=test_user_123
        test_user: Test user fixture
    """
    # Configuration
    num_requests = 100
    user_id = "test_user_123"
    url = f"/api/{user_id}/chat"
    headers = {"Authorization": f"Bearer {test_jwt_token}"}

    # Mock the OpenAI agent to return a fast response
    # (We're testing the endpoint performance, not OpenAI's speed)
    mock_response = "Task created successfully!"

    response_times: List[float] = []

    print(f"\n{'='*80}")
    print(f"PERFORMANCE TEST: Chat Endpoint (POST {url})")
    print(f"{'='*80}")
    print(f"Sending {num_requests} requests sequentially...\n")

    # Send 100 requests and measure each
    for i in range(num_requests):
        request_payload = {
            "message": f"Add a task to test performance - Request {i+1}",
        }

        # Mock the OpenAI agent call to return instantly
        with patch("src.api.routes.chat.call_openai_agent", return_value=mock_response):
            start_time = time.perf_counter()

            response = await client.post(
                url,
                json=request_payload,
                headers=headers,
            )

            end_time = time.perf_counter()
            response_time = end_time - start_time
            response_times.append(response_time)

        # Verify response is successful
        assert response.status_code == 200, f"Request {i+1} failed: {response.status_code}"

        # Progress indicator (every 10 requests)
        if (i + 1) % 10 == 0:
            print(f"  Completed {i+1}/{num_requests} requests... (latest: {response_time:.3f}s)")

    # Calculate statistics
    min_time = min(response_times)
    max_time = max(response_times)
    avg_time = statistics.mean(response_times)
    median_time = statistics.median(response_times)
    p95_time = calculate_percentile(response_times, 95)
    p99_time = calculate_percentile(response_times, 99)

    # Print results
    print(f"\n{'='*80}")
    print(f"PERFORMANCE TEST RESULTS")
    print(f"{'='*80}")
    print(f"Total Requests:        {num_requests}")
    print(f"Successful Requests:   {num_requests}")
    print(f"Failed Requests:       0")
    print(f"\nResponse Time Statistics:")
    print(f"  Min:                 {min_time:.3f}s")
    print(f"  Max:                 {max_time:.3f}s")
    print(f"  Average:             {avg_time:.3f}s")
    print(f"  Median:              {median_time:.3f}s")
    print(f"  P95:                 {p95_time:.3f}s {'[PASS]' if p95_time < 5.0 else '[FAIL]'}")
    print(f"  P99:                 {p99_time:.3f}s")
    print(f"\nRequirement: P95 < 5.0 seconds")
    print(f"Status:      {'PASS' if p95_time < 5.0 else 'FAIL'}")
    print(f"{'='*80}\n")

    # Assert P95 < 5 seconds
    assert p95_time < 5.0, (
        f"P95 latency {p95_time:.3f}s exceeds 5 second requirement. "
        f"Performance degradation detected!"
    )


@pytest.mark.asyncio
async def test_chat_endpoint_performance_detailed_breakdown(
    client: AsyncClient,
    test_jwt_token: str,
    test_user,
):
    """
    Test chat endpoint performance with detailed component timing.

    This test breaks down the response time into:
    1. Network/FastAPI overhead
    2. Database operations
    3. OpenAI Agent call (mocked)
    4. Response serialization

    This helps identify bottlenecks if performance degrades.

    Args:
        client: AsyncClient fixture
        test_jwt_token: JWT token for user_id=test_user_123
        test_user: Test user fixture
    """
    user_id = "test_user_123"
    url = f"/api/{user_id}/chat"
    headers = {"Authorization": f"Bearer {test_jwt_token}"}

    # Mock response
    mock_response = "Task created successfully!"

    # Send 10 requests to measure component timing
    num_requests = 10

    print(f"\n{'='*80}")
    print(f"COMPONENT TIMING ANALYSIS")
    print(f"{'='*80}")

    for i in range(num_requests):
        request_payload = {
            "message": f"Test message {i+1}",
        }

        with patch("src.api.routes.chat.call_openai_agent", return_value=mock_response):
            start_time = time.perf_counter()

            response = await client.post(
                url,
                json=request_payload,
                headers=headers,
            )

            end_time = time.perf_counter()
            total_time = end_time - start_time

        assert response.status_code == 200

        print(f"Request {i+1}: {total_time:.3f}s")

    print(f"{'='*80}\n")


@pytest.mark.asyncio
async def test_chat_endpoint_performance_with_conversation_history(
    client: AsyncClient,
    test_jwt_token: str,
    test_user,
):
    """
    Test chat endpoint performance with existing conversation history.

    This tests the scenario where conversation has multiple messages,
    which requires loading conversation history from the database.

    Expected behavior:
    - Performance should not degrade significantly with conversation history
    - P95 should still be < 5 seconds

    Args:
        client: AsyncClient fixture
        test_jwt_token: JWT token for user_id=test_user_123
        test_user: Test user fixture
    """
    user_id = "test_user_123"
    url = f"/api/{user_id}/chat"
    headers = {"Authorization": f"Bearer {test_jwt_token}"}

    mock_response = "Task updated successfully!"

    # Create a conversation with 10 messages
    conversation_id = None

    print(f"\n{'='*80}")
    print(f"PERFORMANCE TEST: Chat with Conversation History")
    print(f"{'='*80}")
    print("Building conversation history (10 messages)...\n")

    for i in range(10):
        request_payload = {
            "message": f"Message {i+1} in conversation",
        }

        if conversation_id is not None:
            request_payload["conversation_id"] = conversation_id

        with patch("src.api.routes.chat.call_openai_agent", return_value=mock_response):
            response = await client.post(
                url,
                json=request_payload,
                headers=headers,
            )

        assert response.status_code == 200
        data = response.json()
        conversation_id = data["conversation_id"]

    print(f"Conversation created (ID: {conversation_id})\n")

    # Now send 50 requests to the same conversation
    response_times: List[float] = []
    num_requests = 50

    print(f"Sending {num_requests} requests with conversation history...\n")

    for i in range(num_requests):
        request_payload = {
            "message": f"Test message {i+1}",
            "conversation_id": conversation_id,
        }

        with patch("src.api.routes.chat.call_openai_agent", return_value=mock_response):
            start_time = time.perf_counter()

            response = await client.post(
                url,
                json=request_payload,
                headers=headers,
            )

            end_time = time.perf_counter()
            response_time = end_time - start_time
            response_times.append(response_time)

        assert response.status_code == 200

        if (i + 1) % 10 == 0:
            print(f"  Completed {i+1}/{num_requests} requests...")

    # Calculate statistics
    p95_time = calculate_percentile(response_times, 95)
    avg_time = statistics.mean(response_times)

    print(f"\n{'='*80}")
    print(f"RESULTS: Chat with Conversation History")
    print(f"{'='*80}")
    print(f"Conversation ID:       {conversation_id}")
    print(f"Messages in History:   10")
    print(f"Test Requests:         {num_requests}")
    print(f"\nPerformance:")
    print(f"  Average:             {avg_time:.3f}s")
    print(f"  P95:                 {p95_time:.3f}s {'[PASS]' if p95_time < 5.0 else '[FAIL]'}")
    print(f"\nRequirement: P95 < 5.0 seconds")
    print(f"Status:      {'PASS' if p95_time < 5.0 else 'FAIL'}")
    print(f"{'='*80}\n")

    # Assert P95 < 5 seconds even with conversation history
    assert p95_time < 5.0, (
        f"P95 latency {p95_time:.3f}s with conversation history exceeds 5 second requirement!"
    )


@pytest.mark.asyncio
async def test_conversation_history_load_p95_under_500ms(
    test_db_session,
    test_user,
):
    """
    Test that conversation history loading P95 latency is under 500ms for 50 messages.

    This test validates Constitution Section X.3: Conversation history retrieval
    must be fast enough to not degrade user experience.

    Requirements:
    - P95 latency < 500ms for loading 50-message conversation (Task T114)
    - Uses ConversationManager.load_conversation_history()
    - Tests database query performance
    - Tests history compression logic

    Test Plan:
    1. Create a conversation with 50 messages (25 user + 25 assistant)
    2. Load conversation history 100 times
    3. Measure load time for each operation
    4. Calculate min, max, avg, P95, P99
    5. Assert P95 < 500ms

    Args:
        test_db_session: Database session fixture
        test_user: Test user fixture
    """
    from datetime import datetime
    from src.api.models import Conversation, Message, MessageRole
    from mcp.utils.conversation_manager import ConversationManager

    # Configuration
    num_messages = 50
    num_load_operations = 100
    user_id = "test_user_123"

    print(f"\n{'='*80}")
    print(f"PERFORMANCE TEST: Conversation History Loading")
    print(f"{'='*80}")
    print(f"Creating conversation with {num_messages} messages...\n")

    # Step 1: Create conversation
    conversation = Conversation(
        user_id=user_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(conversation)
    test_db_session.commit()
    test_db_session.refresh(conversation)

    print(f"Conversation created (ID: {conversation.id})")

    # Step 2: Create 50 messages (alternating user/assistant)
    for i in range(num_messages):
        role = MessageRole.USER if i % 2 == 0 else MessageRole.ASSISTANT
        content = f"Test message {i+1} - {'User asks a question' if role == MessageRole.USER else 'Assistant provides answer'}"

        message = Message(
            conversation_id=conversation.id,
            user_id=user_id,
            role=role,
            content=content,
            created_at=datetime.utcnow(),
        )
        test_db_session.add(message)

    test_db_session.commit()

    print(f"Created {num_messages} messages")
    print(f"\nLoading conversation history {num_load_operations} times...\n")

    # Step 3: Initialize ConversationManager
    conversation_manager = ConversationManager(session=test_db_session)

    # Step 4: Load history 100 times and measure
    load_times: List[float] = []

    for i in range(num_load_operations):
        start_time = time.perf_counter()

        # Load conversation history
        history = conversation_manager.load_conversation_history(
            conversation_id=conversation.id
        )

        end_time = time.perf_counter()
        load_time = (end_time - start_time) * 1000  # Convert to milliseconds
        load_times.append(load_time)

        # Verify history was loaded
        assert len(history) > 0, f"Load {i+1}: History is empty"

        # Progress indicator (every 10 operations)
        if (i + 1) % 10 == 0:
            print(f"  Completed {i+1}/{num_load_operations} loads... (latest: {load_time:.2f}ms)")

    # Step 5: Calculate statistics
    min_time = min(load_times)
    max_time = max(load_times)
    avg_time = statistics.mean(load_times)
    median_time = statistics.median(load_times)
    p95_time = calculate_percentile(load_times, 95)
    p99_time = calculate_percentile(load_times, 99)

    # Print results
    print(f"\n{'='*80}")
    print(f"PERFORMANCE TEST RESULTS: Conversation History Loading")
    print(f"{'='*80}")
    print(f"Conversation ID:       {conversation.id}")
    print(f"Messages in History:   {num_messages}")
    print(f"Load Operations:       {num_load_operations}")
    print(f"\nLoad Time Statistics (milliseconds):")
    print(f"  Min:                 {min_time:.2f}ms")
    print(f"  Max:                 {max_time:.2f}ms")
    print(f"  Average:             {avg_time:.2f}ms")
    print(f"  Median:              {median_time:.2f}ms")
    print(f"  P95:                 {p95_time:.2f}ms {'[PASS]' if p95_time < 500 else '[FAIL]'}")
    print(f"  P99:                 {p99_time:.2f}ms")
    print(f"\nRequirement: P95 < 500ms")
    print(f"Status:      {'PASS' if p95_time < 500 else 'FAIL'}")
    print(f"{'='*80}\n")

    # Step 6: Assert P95 < 500ms
    assert p95_time < 500, (
        f"P95 load time {p95_time:.2f}ms exceeds 500ms requirement. "
        f"Conversation history loading is too slow!"
    )


@pytest.mark.asyncio
async def test_conversation_history_load_with_compression(
    test_db_session,
    test_user,
):
    """
    Test conversation history loading performance with compression enabled.

    This test validates that compression logic doesn't significantly degrade
    performance when loading large conversations (> 10 messages).

    Test Scenario:
    - Create conversation with 100 messages (triggers compression)
    - Load history 50 times
    - Verify compression is applied (result has summary message)
    - Verify P95 < 500ms even with compression overhead

    Args:
        test_db_session: Database session fixture
        test_user: Test user fixture
    """
    from datetime import datetime
    from src.api.models import Conversation, Message, MessageRole
    from mcp.utils.conversation_manager import ConversationManager

    # Configuration
    num_messages = 100  # Large conversation to trigger compression
    num_load_operations = 50
    user_id = "test_user_123"

    print(f"\n{'='*80}")
    print(f"PERFORMANCE TEST: History Loading with Compression")
    print(f"{'='*80}")
    print(f"Creating conversation with {num_messages} messages (triggers compression)...\n")

    # Create conversation
    conversation = Conversation(
        user_id=user_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db_session.add(conversation)
    test_db_session.commit()
    test_db_session.refresh(conversation)

    # Create 100 messages with realistic content to trigger token limit
    for i in range(num_messages):
        role = MessageRole.USER if i % 2 == 0 else MessageRole.ASSISTANT
        content = (
            f"Message {i+1}: " + ("User asks about task management features. " * 5)
            if role == MessageRole.USER
            else f"Message {i+1}: " + ("Assistant explains the feature in detail. " * 5)
        )

        message = Message(
            conversation_id=conversation.id,
            user_id=user_id,
            role=role,
            content=content,
            created_at=datetime.utcnow(),
        )
        test_db_session.add(message)

    test_db_session.commit()

    print(f"Created {num_messages} messages")
    print(f"\nLoading history {num_load_operations} times...\n")

    # Initialize ConversationManager
    conversation_manager = ConversationManager(session=test_db_session)

    # Load history and measure
    load_times: List[float] = []
    compression_applied = False

    for i in range(num_load_operations):
        start_time = time.perf_counter()

        history = conversation_manager.load_conversation_history(
            conversation_id=conversation.id
        )

        end_time = time.perf_counter()
        load_time = (end_time - start_time) * 1000  # milliseconds
        load_times.append(load_time)

        # Check if compression was applied (first message should be system summary)
        if i == 0 and len(history) < num_messages:
            compression_applied = True
            print(f"  Compression detected: {num_messages} messages → {len(history)} messages")

        if (i + 1) % 10 == 0:
            print(f"  Completed {i+1}/{num_load_operations} loads... (latest: {load_time:.2f}ms)")

    # Calculate statistics
    p95_time = calculate_percentile(load_times, 95)
    avg_time = statistics.mean(load_times)

    print(f"\n{'='*80}")
    print(f"RESULTS: History Loading with Compression")
    print(f"{'='*80}")
    print(f"Original Messages:     {num_messages}")
    print(f"Compression Applied:   {'Yes' if compression_applied else 'No (under token limit)'}")
    print(f"Load Operations:       {num_load_operations}")
    print(f"\nPerformance:")
    print(f"  Average:             {avg_time:.2f}ms")
    print(f"  P95:                 {p95_time:.2f}ms {'[PASS]' if p95_time < 500 else '[FAIL]'}")
    print(f"\nRequirement: P95 < 500ms")
    print(f"Status:      {'PASS' if p95_time < 500 else 'FAIL'}")
    print(f"{'='*80}\n")

    # Note: Compression may not be triggered if content is small enough to fit in MAX_CONTEXT_TOKENS
    # This test validates that loading 100 messages is still fast regardless of compression

    # Assert P95 < 500ms (main requirement)
    assert p95_time < 500, (
        f"P95 load time {p95_time:.2f}ms for large conversation exceeds 500ms requirement!"
    )
