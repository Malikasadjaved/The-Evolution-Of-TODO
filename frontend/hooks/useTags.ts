/**
 * React Query Hooks for Tag Management (Phase 9 - User Story 7)
 *
 * Provides hooks for CRUD operations on tags with automatic caching,
 * optimistic updates, and error handling.
 *
 * Features:
 * - useTags: Fetch all tags for a user
 * - useCreateTag: Create new tag with optimistic update
 * - useDeleteTag: Delete tag with optimistic update
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchWithAuth } from '@/lib/api'
import type { Tag } from '@/types/api'

// ============================================================================
// Query Keys
// ============================================================================

const tagKeys = {
  all: ['tags'] as const,
  lists: () => [...tagKeys.all, 'list'] as const,
  list: (userId: string) => [...tagKeys.lists(), userId] as const,
}

// ============================================================================
// API Functions
// ============================================================================

async function fetchTags(userId: string): Promise<Tag[]> {
  return fetchWithAuth<Tag[]>(`/api/${userId}/tags`)
}

async function createTag(
  userId: string,
  data: { name: string }
): Promise<Tag> {
  return fetchWithAuth<Tag>(`/api/${userId}/tags`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

async function deleteTag(userId: string, tagId: number): Promise<void> {
  return fetchWithAuth<void>(`/api/${userId}/tags/${tagId}`, {
    method: 'DELETE',
  })
}

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Fetch all tags for a user
 *
 * @param userId - User ID to fetch tags for
 * @returns Query result with tags array
 *
 * @example
 * const { data: tags, isLoading } = useTags(userId)
 */
export function useTags(userId: string | undefined) {
  return useQuery({
    queryKey: tagKeys.list(userId || ''),
    queryFn: () => fetchTags(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Create a new tag
 *
 * Features:
 * - Optimistic update (immediately shows new tag)
 * - Automatic rollback on error
 * - Cache invalidation on success
 *
 * @returns Mutation object with mutate/mutateAsync functions
 *
 * @example
 * const createTag = useCreateTag()
 * await createTag.mutateAsync({
 *   userId: 'user_123',
 *   name: 'Work',
 * })
 */
export function useCreateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, name }: { userId: string; name: string }) =>
      createTag(userId, { name }),
    onMutate: async ({ userId, name }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: tagKeys.list(userId) })

      // Snapshot previous value
      const previousTags = queryClient.getQueryData<Tag[]>(tagKeys.list(userId))

      // Optimistically update cache
      if (previousTags) {
        const optimisticTag: Tag = {
          id: Date.now(), // Temporary ID
          user_id: userId,
          name,
          created_at: new Date().toISOString(),
        }
        queryClient.setQueryData<Tag[]>(tagKeys.list(userId), [
          ...previousTags,
          optimisticTag,
        ])
      }

      return { previousTags }
    },
    onError: (_error, { userId }, context) => {
      // Rollback on error
      if (context?.previousTags) {
        queryClient.setQueryData(tagKeys.list(userId), context.previousTags)
      }
    },
    onSuccess: (_data, { userId }) => {
      // Invalidate cache to refetch with real data
      queryClient.invalidateQueries({ queryKey: tagKeys.list(userId) })
    },
  })
}

/**
 * Delete a tag
 *
 * Features:
 * - Optimistic update (immediately removes tag from UI)
 * - Automatic rollback on error
 * - Cache invalidation on success
 *
 * @returns Mutation object with mutate/mutateAsync functions
 *
 * @example
 * const deleteTag = useDeleteTag()
 * await deleteTag.mutateAsync({
 *   userId: 'user_123',
 *   tagId: 1,
 * })
 */
export function useDeleteTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, tagId }: { userId: string; tagId: number }) =>
      deleteTag(userId, tagId),
    onMutate: async ({ userId, tagId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: tagKeys.list(userId) })

      // Snapshot previous value
      const previousTags = queryClient.getQueryData<Tag[]>(tagKeys.list(userId))

      // Optimistically update cache
      if (previousTags) {
        queryClient.setQueryData<Tag[]>(
          tagKeys.list(userId),
          previousTags.filter((tag) => tag.id !== tagId)
        )
      }

      return { previousTags }
    },
    onError: (_error, { userId }, context) => {
      // Rollback on error
      if (context?.previousTags) {
        queryClient.setQueryData(tagKeys.list(userId), context.previousTags)
      }
    },
    onSuccess: (_data, { userId }) => {
      // Invalidate cache to refetch
      queryClient.invalidateQueries({ queryKey: tagKeys.list(userId) })
    },
  })
}
