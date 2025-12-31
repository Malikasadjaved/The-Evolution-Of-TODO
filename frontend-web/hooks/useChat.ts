/**
 * React Query hooks for chat functionality.
 *
 * Features:
 * - useSendMessage: Send message to AI assistant
 * - Returns assistant response
 */

import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { ChatRequest } from '@/types/api'

// ============================================================================
// Mutations
// ============================================================================

/**
 * Send a message to the AI assistant.
 *
 * @returns Mutation with mutateAsync({ userId, message, conversationId? })
 */
export function useSendMessage() {
  return useMutation({
    mutationFn: async ({
      userId,
      message,
      conversationId,
    }: {
      userId: string
      message: string
      conversationId?: number
    }) => {
      const request: ChatRequest = {
        message,
        conversation_id: conversationId,
      }
      return api.sendChatMessage(userId, request)
    },
  })
}
