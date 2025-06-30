import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { Suggestion, SuggestionContextType } from '../types'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const SuggestionContext = createContext<SuggestionContextType | undefined>(undefined)

export const useSuggestions = () => {
  const context = useContext(SuggestionContext)
  if (context === undefined) {
    throw new Error('useSuggestions must be used within a SuggestionProvider')
  }
  return context
}

interface SuggestionProviderProps {
  children: ReactNode
}

export const SuggestionProvider: React.FC<SuggestionProviderProps> = ({ children }) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  // Load suggestions when user changes
  useEffect(() => {
    if (user) {
      loadSuggestions()
    } else {
      setSuggestions([])
    }
  }, [user])

  const loadSuggestions = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('suggestions')
        .select(`
          *,
          suggestion_supports(*),
          suggestion_comments(
            *,
            profiles!suggestion_comments_user_id_fkey(first_name, last_name)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedSuggestions: Suggestion[] = data.map(suggestion => ({
        id: suggestion.id,
        userId: suggestion.user_id,
        title: suggestion.title,
        description: suggestion.description,
        category: suggestion.category,
        status: suggestion.status,
        supportCount: suggestion.support_count,
        createdAt: new Date(suggestion.created_at),
        updatedAt: new Date(suggestion.updated_at),
        supports: suggestion.suggestion_supports.map((support: any) => ({
          id: support.id,
          suggestionId: support.suggestion_id,
          userId: support.user_id,
          createdAt: new Date(support.created_at)
        })),
        comments: suggestion.suggestion_comments.map((comment: any) => ({
          id: comment.id,
          suggestionId: comment.suggestion_id,
          userId: comment.user_id,
          comment: comment.comment,
          createdAt: new Date(comment.created_at),
          user: comment.profiles ? {
            firstName: comment.profiles.first_name,
            lastName: comment.profiles.last_name
          } : undefined
        }))
      }))

      setSuggestions(formattedSuggestions)
    } catch (error) {
      console.error('Error loading suggestions:', error)
      toast.error('Failed to load suggestions')
    } finally {
      setLoading(false)
    }
  }

  const submitSuggestion = async (suggestionData: Omit<Suggestion, 'id' | 'userId' | 'supportCount' | 'createdAt' | 'updatedAt' | 'supports' | 'comments'>): Promise<string> => {
    if (!user) throw new Error('User not authenticated')

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('suggestions')
        .insert({
          user_id: user.id,
          title: suggestionData.title,
          description: suggestionData.description,
          category: suggestionData.category,
          status: suggestionData.status
        })
        .select()
        .single()

      if (error) throw error

      // Reload suggestions to get the updated list
      await loadSuggestions()

      toast.success('Suggestion submitted successfully!')
      return data.id
    } catch (error: any) {
      console.error('Error submitting suggestion:', error)
      toast.error('Failed to submit suggestion')
      throw new Error(error.message || 'Failed to submit suggestion')
    } finally {
      setLoading(false)
    }
  }

  const updateSuggestion = async (id: string, updates: Partial<Suggestion>): Promise<void> => {
    setLoading(true)
    try {
      const updateData: any = {}
      
      if (updates.title) updateData.title = updates.title
      if (updates.description) updateData.description = updates.description
      if (updates.category) updateData.category = updates.category
      if (updates.status) updateData.status = updates.status

      const { error } = await supabase
        .from('suggestions')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      // Reload suggestions to get the updated list
      await loadSuggestions()
      toast.success('Suggestion updated successfully!')
    } catch (error: any) {
      console.error('Error updating suggestion:', error)
      toast.error('Failed to update suggestion')
      throw new Error(error.message || 'Failed to update suggestion')
    } finally {
      setLoading(false)
    }
  }

  const getSuggestion = (id: string): Suggestion | undefined => {
    return suggestions.find(suggestion => suggestion.id === id)
  }

  const getSuggestionsByUser = (userId: string): Suggestion[] => {
    return suggestions.filter(suggestion => suggestion.userId === userId)
  }

  const supportSuggestion = async (suggestionId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { error } = await supabase
        .from('suggestion_supports')
        .insert({
          suggestion_id: suggestionId,
          user_id: user.id
        })

      if (error) throw error

      // Reload suggestions to get updated support count
      await loadSuggestions()
      toast.success('Support added successfully!')
    } catch (error: any) {
      console.error('Error supporting suggestion:', error)
      toast.error('Failed to support suggestion')
      throw new Error(error.message || 'Failed to support suggestion')
    }
  }

  const unsupportSuggestion = async (suggestionId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { error } = await supabase
        .from('suggestion_supports')
        .delete()
        .eq('suggestion_id', suggestionId)
        .eq('user_id', user.id)

      if (error) throw error

      // Reload suggestions to get updated support count
      await loadSuggestions()
      toast.success('Support removed successfully!')
    } catch (error: any) {
      console.error('Error unsupporting suggestion:', error)
      toast.error('Failed to remove support')
      throw new Error(error.message || 'Failed to remove support')
    }
  }

  const addComment = async (suggestionId: string, comment: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated')

    try {
      const { error } = await supabase
        .from('suggestion_comments')
        .insert({
          suggestion_id: suggestionId,
          user_id: user.id,
          comment: comment
        })

      if (error) throw error

      // Reload suggestions to get updated comments
      await loadSuggestions()
      toast.success('Comment added successfully!')
    } catch (error: any) {
      console.error('Error adding comment:', error)
      toast.error('Failed to add comment')
      throw new Error(error.message || 'Failed to add comment')
    }
  }

  const updateComment = async (commentId: string, comment: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('suggestion_comments')
        .update({ comment })
        .eq('id', commentId)

      if (error) throw error

      // Reload suggestions to get updated comments
      await loadSuggestions()
      toast.success('Comment updated successfully!')
    } catch (error: any) {
      console.error('Error updating comment:', error)
      toast.error('Failed to update comment')
      throw new Error(error.message || 'Failed to update comment')
    }
  }

  const deleteComment = async (commentId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('suggestion_comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error

      // Reload suggestions to get updated comments
      await loadSuggestions()
      toast.success('Comment deleted successfully!')
    } catch (error: any) {
      console.error('Error deleting comment:', error)
      toast.error('Failed to delete comment')
      throw new Error(error.message || 'Failed to delete comment')
    }
  }

  const value: SuggestionContextType = {
    suggestions,
    submitSuggestion,
    updateSuggestion,
    getSuggestion,
    getSuggestionsByUser,
    supportSuggestion,
    unsupportSuggestion,
    addComment,
    updateComment,
    deleteComment,
    loading
  }

  return (
    <SuggestionContext.Provider value={value}>
      {children}
    </SuggestionContext.Provider>
  )
}