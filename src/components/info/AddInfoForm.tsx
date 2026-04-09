// src/components/info/AddInfoForm.tsx

import React, { useState, useRef } from 'react'

export const INFO_CATEGORIES = [
  { value: 'identity', label: 'Identity & Personal' },
  { value: 'government_id', label: 'Government ID / Passport' },
  { value: 'military', label: 'Military Records' },
  { value: 'education', label: 'Education & Degrees' },
  { value: 'employment', label: 'Employment History' },
  { value: 'social_media', label: 'Social Media Accounts' },
  { value: 'memberships', label: 'Memberships & Subscriptions' },
  { value: 'other', label: 'Other' },
] as const

interface AddInfoFormProps {
  saving: boolean
  onSave: (params: {
    category: string
    title: string
    notes: string
    file: File | null
  }) => Promise<boolean>
}

export function AddInfoForm({ saving, onSave }: AddInfoFormProps) {
  const [category, setCategory] = useState('')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldError(null)

    if (!category) {
      setFieldError('Please select a category.')
      return
    }

    if (!title.trim()) {
      setFieldError('Title is required.')
      return
    }

    const success = await onSave({ category, title: title.trim(), notes, file })

    if (success) {
      // Reset form on success
      setCategory('')
      setTitle('')
      setNotes('')
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null

    if (selected && selected.size > 20 * 1024 * 1024) {
      setFieldError('File must be under 20MB.')
      e.target.value = ''
      return
    }

    setFile(selected)
    setFieldError(null)
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {fieldError && (
        <div role="alert" style={{ color: 'red', marginBottom: 8 }}>
          {fieldError}
        </div>
      )}

      {/* Category */}
      <div>
        <label htmlFor="info-category">
          Category <span aria-hidden>*</span>
        </label>
        <select
          id="info-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          disabled={saving}
        >
          <option value="">Select a category</option>
          {INFO_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Title */}
      <div>
        <label htmlFor="info-title">
          Title <span aria-hidden>*</span>
        </label>
        <input
          id="info-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Social Security Card"
          required
          disabled={saving}
          maxLength={200}
        />
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="info-notes">Notes</label>
        <textarea
          id="info-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Location, instructions, or additional context..."
          rows={3}
          disabled={saving}
        />
      </div>

      {/* File */}
      <div style={{ display: 'block', marginTop: 8 }}>
        <label htmlFor="info-file">Attach Document (optional, max 20MB)</label>
        <div>
          <input
            id="info-file"
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            disabled={saving}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt"
          />
        </div>
        {file && (
          <div style={{ fontSize: 12, marginTop: 4 }}>
            {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </div>
        )}
      </div>

      <button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save Information'}
      </button>
    </form>
  )
}
