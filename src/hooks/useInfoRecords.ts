// src/hooks/useInfoRecords.ts

import { useState, useCallback } from 'react'

import {
  fetchInfoRecords,
  saveInfoRecord,
  deleteInfoRecord,
  InfoRecord,
} from '../services/infoService'

export interface InfoRecordState {
  records: InfoRecord[]
  loading: boolean
  saving: boolean
  error: string | null
  successMessage: string | null
}

export function useInfoRecords(packetId: string, scope: 'personA' | 'personB' | 'shared') {
  const [state, setState] = useState<InfoRecordState>({
    records: [],
    loading: false,
    saving: false,
    error: null,
    successMessage: null,
  })

  const clearMessages = useCallback(() => {
    setState((s) => ({ ...s, error: null, successMessage: null }))
  }, [])

  const loadRecords = useCallback(async () => {
    if (!packetId) return

    setState((s) => ({ ...s, loading: true, error: null }))

    try {
      const records = await fetchInfoRecords(packetId)
      setState((s) => ({ ...s, records, loading: false }))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load records.'
      setState((s) => ({ ...s, loading: false, error: msg }))
    }
  }, [packetId])

  const saveRecord = useCallback(
    async (params: {
      category: string
      title: string
      notes: string
      file: File | null
    }) => {
      if (!packetId) {
        setState((s) => ({ ...s, error: 'No packet found. Please reload.' }))
        return false
      }

      setState((s) => ({ ...s, saving: true, error: null, successMessage: null }))

      const result = await saveInfoRecord({
        packetId,
        scope,
        category: params.category,
        title: params.title,
        notes: params.notes,
        file: params.file,
      })

      if (result.error) {
        setState((s) => ({
          ...s,
          saving: false,
          error: result.error,
        }))
        return false
      }

      // Prepend the new record to the top of the list (optimistic update)
      setState((s) => ({
        ...s,
        saving: false,
        successMessage: 'Information saved successfully.',
        records: [result.record, ...s.records],
      }))

      return true
    },
    [packetId, scope]
  )

  const deleteRecord = useCallback(
    async (recordId: string) => {
      setState((s) => ({ ...s, error: null, successMessage: null }))

      const { success, error } = await deleteInfoRecord(recordId, packetId)

      if (!success) {
        setState((s) => ({ ...s, error: error ?? 'Failed to delete record.' }))
        return false
      }

      setState((s) => ({
        ...s,
        successMessage: 'Record deleted.',
        records: s.records.filter((r) => r.id !== recordId),
      }))

      return true
    },
    [packetId]
  )

  return {
    ...state,
    loadRecords,
    saveRecord,
    deleteRecord,
    clearMessages,
  }
}
