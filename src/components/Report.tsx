import { useState } from 'react'
import { Modal } from './Modal'
import { api } from '../lib/api'
import { useApp } from '../lib/app'
import { REPORT_REASONS } from '../../shared/options.js'

export function ReportModal({ uid, postId, onClose }: { uid: string; postId?: string; onClose: () => void }) {
  const { toast } = useApp()
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  async function send() {
    setBusy(true)
    try {
      await api('/api/report', { uid, postId, reason, note })
      toast('Thanks. We will look at it.')
      onClose()
    } catch (e) {
      toast((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <Modal title={postId ? 'Report this post' : 'Report this person'} onClose={onClose}>
      <div className="radio-list">
        {REPORT_REASONS.map((r) => (
          <label key={r.id} className={`radio ${reason === r.id ? 'is-on' : ''}`}>
            <input type="radio" name="reason" checked={reason === r.id} onChange={() => setReason(r.id)} />
            {r.label}
          </label>
        ))}
      </div>
      <label className="field">
        <span>More details (optional)</span>
        <textarea className="input" rows={2} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
      <div className="modal-actions">
        <button className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-danger" onClick={send} disabled={!reason || busy}>
          Report
        </button>
      </div>
    </Modal>
  )
}
