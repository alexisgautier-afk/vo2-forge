'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/Button'
import type { Ticket, TicketStatus, TicketPriority } from '@/types'

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: 'ready', label: 'Prêt' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'review', label: 'Review' },
  { value: 'blocked', label: 'Bloqué' },
]

const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: 'low', label: 'Basse' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'high', label: 'Haute' },
  { value: 'critical', label: 'Critique' },
]

const inputCls = 'w-full h-9 px-3 text-sm rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-vo2/40 focus:border-blue-vo2 transition-colors'
const selectCls = `${inputCls} cursor-pointer`

interface TicketFormProps {
  initial?: Ticket
  onClose: () => void
}

export function TicketForm({ initial, onClose }: TicketFormProps) {
  const qc = useQueryClient()
  const isEdit = Boolean(initial)

  const [id, setId] = useState(initial?.id ?? '')
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [status, setStatus] = useState<TicketStatus>(initial?.status ?? 'ready')
  const [priority, setPriority] = useState<TicketPriority>(initial?.priority ?? 'medium')
  const [assignee, setAssignee] = useState(initial?.assignee ?? '')
  const [sprint, setSprint] = useState(initial?.sprint ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!id.trim() || !name.trim()) return
    setLoading(true)
    setError(null)

    const payload = {
      id: id.trim(), name: name.trim(),
      description: description.trim() || undefined,
      status, priority,
      assignee: assignee.trim() || undefined,
      sprint: sprint.trim() || undefined,
    }

    const res = isEdit
      ? await fetch(`/api/tickets/${initial!.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      : await fetch('/api/tickets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })

    if (!res.ok) {
      setError('Erreur lors de la sauvegarde.')
      setLoading(false)
      return
    }

    await qc.invalidateQueries({ queryKey: ['tickets'] })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label-mono block mb-1.5">ID ticket</label>
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="SMCP-42"
            disabled={isEdit}
            className={inputCls}
            required
          />
        </div>
        <div>
          <label className="label-mono block mb-1.5">Sprint</label>
          <input value={sprint} onChange={(e) => setSprint(e.target.value)} placeholder="Sprint 12" className={inputCls} />
        </div>
      </div>

      <div>
        <label className="label-mono block mb-1.5">Titre</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du ticket" className={inputCls} required />
      </div>

      <div>
        <label className="label-mono block mb-1.5">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Contexte, critères d'acceptance…"
          rows={3}
          className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-blue-vo2/40 focus:border-blue-vo2 transition-colors resize-none"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label-mono block mb-1.5">Statut</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as TicketStatus)} className={selectCls}>
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label-mono block mb-1.5">Priorité</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)} className={selectCls}>
            {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label-mono block mb-1.5">Assigné à</label>
          <input value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="Prénom" className={inputCls} />
        </div>
      </div>

      {error && <p className="text-xs text-[#DC2626]">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>Annuler</Button>
        <Button type="submit" size="sm" loading={loading}>{isEdit ? 'Enregistrer' : 'Créer'}</Button>
      </div>
    </form>
  )
}
