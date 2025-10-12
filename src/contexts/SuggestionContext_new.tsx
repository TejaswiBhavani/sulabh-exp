import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
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
      // TODO: Replace with actual API call to fetch suggestions
      const demoSuggestions = JSON.parse(localStorage.getItem('demo_suggestions') || '[]')
      setSuggestions(demoSuggestions)
    } catch (error) {
      console.error('Error loading suggestions:', error)
      toast.error('Failed to load suggestions')
    } finally {
      setLoading(false)
    }
  }

  const createSuggestion = async (suggestionData: Omit<Suggestion, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'votes' | 'comments'>) => {
    if (!user) {
      toast.error('Please login to create suggestions')
      return
    }

    setLoading(true)
    try {
      // TODO: Replace with actual API call
      const newSuggestion: Suggestion = {
        id: Date.now().toString(),
        userId: user.id,
        ...suggestionData,
        votes: 0,
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const currentSuggestions = JSON.parse(localStorage.getItem('demo_suggestions') || '[]')
      const updatedSuggestions = [...currentSuggestions, newSuggestion]
      localStorage.setItem('demo_suggestions', JSON.stringify(updatedSuggestions))
      
      setSuggestions(updatedSuggestions)
      toast.success('Suggestion created successfully!')
    } catch (error) {
      console.error('Error creating suggestion:', error)
      toast.error('Failed to create suggestion')
    } finally {
      setLoading(false)
    }
  }

  const updateSuggestion = async (id: string, updates: Partial<Suggestion>) => {
    setLoading(true)
    try {
      // TODO: Replace with actual API call
      const currentSuggestions = JSON.parse(localStorage.getItem('demo_suggestions') || '[]')
      const updatedSuggestions = currentSuggestions.map((suggestion: Suggestion) =>
        suggestion.id === id ? { ...suggestion, ...updates, updatedAt: new Date() } : suggestion
      )
      localStorage.setItem('demo_suggestions', JSON.stringify(updatedSuggestions))
      
      setSuggestions(updatedSuggestions)
      toast.success('Suggestion updated successfully!')
    } catch (error) {
      console.error('Error updating suggestion:', error)
      toast.error('Failed to update suggestion')
    } finally {
      setLoading(false)
    }
  }

  const deleteSuggestion = async (id: string) => {
    setLoading(true)
    try {
      // TODO: Replace with actual API call
      const currentSuggestions = JSON.parse(localStorage.getItem('demo_suggestions') || '[]')
      const updatedSuggestions = currentSuggestions.filter((suggestion: Suggestion) => suggestion.id !== id)
      localStorage.setItem('demo_suggestions', JSON.stringify(updatedSuggestions))
      
      setSuggestions(updatedSuggestions)
      toast.success('Suggestion deleted successfully!')
    } catch (error) {
      console.error('Error deleting suggestion:', error)
      toast.error('Failed to delete suggestion')
    } finally {
      setLoading(false)
    }
  }

  const voteSuggestion = async (id: string, voteType: 'up' | 'down') => {
    if (!user) {
      toast.error('Please login to vote')
      return
    }

    try {
      // TODO: Replace with actual API call
      const currentSuggestions = JSON.parse(localStorage.getItem('demo_suggestions') || '[]')
      const updatedSuggestions = currentSuggestions.map((suggestion: Suggestion) =>
        suggestion.id === id 
          ? { ...suggestion, votes: suggestion.votes + (voteType === 'up' ? 1 : -1) }
          : suggestion
      )
      localStorage.setItem('demo_suggestions', JSON.stringify(updatedSuggestions))
      
      setSuggestions(updatedSuggestions)
    } catch (error) {
      console.error('Error voting on suggestion:', error)
      toast.error('Failed to vote on suggestion')
    }
  }

  const addComment = async (suggestionId: string, comment: string) => {
    if (!user) {
      toast.error('Please login to comment')
      return
    }

    try {
      // TODO: Replace with actual API call
      const newComment = {
        id: Date.now().toString(),
        userId: user.id,
        userFullName: user.firstName + ' ' + user.lastName,
        content: comment,
        createdAt: new Date()
      }

      const currentSuggestions = JSON.parse(localStorage.getItem('demo_suggestions') || '[]')
      const updatedSuggestions = currentSuggestions.map((suggestion: Suggestion) =>
        suggestion.id === suggestionId 
          ? { ...suggestion, comments: [...suggestion.comments, newComment] }
          : suggestion
      )
      localStorage.setItem('demo_suggestions', JSON.stringify(updatedSuggestions))
      
      setSuggestions(updatedSuggestions)
      toast.success('Comment added successfully!')
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Failed to add comment')
    }
  }

  const value: SuggestionContextType = {
    suggestions,
    loading,
    loadSuggestions,
    createSuggestion,
    updateSuggestion,
    deleteSuggestion,
    voteSuggestion,
    addComment
  }

  return (
    <SuggestionContext.Provider value={value}>
      {children}
    </SuggestionContext.Provider>
  )
}