// src/components/info/InfoSection.tsx

import React, { useEffect, useState } from 'react'

import { useInfoRecords } from '../../hooks/useInfoRecords'
import { AddInfoForm } from './AddInfoForm'
import { useConfirm } from '../../context/ConfirmDialogContext'
import { EntryAttachments } from '../upload/EntryAttachments'
import { EntryAttachmentSummary } from '../upload/EntryAttachmentSummary'

interface InfoSectionProps {
  packetId: string
  scope: 'personA' | 'personB' | 'shared'
}

export function InfoSection({ packetId, scope }: InfoSectionProps) {
  const {
    records,
    loading,
    saving,
    error,
    successMessage,
    loadRecords,
    saveRecord,
    deleteRecord,
    clearMessages,
  } = useInfoRecords(packetId, scope)
  const confirm = useConfirm()
  const [expandedAttachments, setExpandedAttachments] = useState<string | null>(null)

  useEffect(() => {
    loadRecords()
  }, [loadRecords])

  // Auto-clear success message after 4 seconds
  useEffect(() => {
    if (!successMessage) return
    const timer = setTimeout(clearMessages, 4000)
    return () => clearTimeout(timer)
  }, [successMessage, clearMessages])

  return (
    <div>
      <h2>Information</h2>

      <p>
        Store identity documents, government IDs, and other critical personal records.
        If something happens to you, this section helps others find what they need.
      </p>

      {/* Persistent feedback — never silent */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            background: '#fff0f0',
            border: '1px solid #ffcccc',
            borderRadius: 4,
            padding: '12px 16px',
            marginBottom: 16,
            color: '#cc0000',
          }}
        >
          <strong>Error:</strong> {error}
          <button onClick={clearMessages} style={{ marginLeft: 12, fontSize: 12 }}>
            Dismiss
          </button>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          aria-live="polite"
          style={{
            background: '#f0fff4',
            border: '1px solid #b2f5c8',
            borderRadius: 4,
            padding: '12px 16px',
            marginBottom: 16,
            color: '#1a7340',
          }}
        >
          ✓ {successMessage}
        </div>
      )}

      {/* Add form */}
      <AddInfoForm saving={saving} onSave={saveRecord} />

      <hr />

      {/* Records list */}
      <h3>Saved Records</h3>

      {loading && <p>Loading records...</p>}

      {!loading && records.length === 0 && (
        <p style={{ color: '#888' }}>
          No information saved yet. Add your first record above.
        </p>
      )}

      {!loading && records.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {records.map((record) => (
            <li
              key={record.id}
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: 6,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: 11,
                      color: '#888',
                      letterSpacing: 0.5,
                    }}
                  >
                    {record.category}
                  </span>
                  <h4 style={{ margin: '4px 0' }}>{record.title}</h4>
                  {record.notes && !record.notes.startsWith('{') && (
                    <p style={{ margin: 0, fontSize: 14, color: '#555' }}>{record.notes}</p>
                  )}
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: '#aaa' }}>
                    Saved {new Date(record.created_at).toLocaleDateString()}
                  </p>
                  <EntryAttachmentSummary
                    packetId={packetId}
                    sectionKey="info"
                    recordId={record.id}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                  <button
                    onClick={() =>
                      setExpandedAttachments((c) => (c === record.id ? null : record.id))
                    }
                    style={{ fontSize: 12, color: '#1a3a5c', fontWeight: 600 }}
                    aria-expanded={expandedAttachments === record.id}
                  >
                    {expandedAttachments === record.id ? 'Hide attachments' : 'Manage attachments'}
                  </button>
                  <button
                    onClick={async () => {
                      const ok = await confirm({
                        title: 'Delete this record?',
                        description: 'This will also remove any attached documents. This action cannot be undone.',
                      })
                      if (ok) deleteRecord(record.id)
                    }}
                    style={{ fontSize: 12, color: '#cc0000' }}
                    aria-label={`Delete ${record.title}`}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {expandedAttachments === record.id && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #eee' }}>
                  <EntryAttachments
                    packetId={packetId}
                    sectionKey="info"
                    recordId={record.id}
                    scope={scope}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
