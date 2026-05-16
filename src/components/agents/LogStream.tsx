'use client'

import { useEffect, useRef, useState } from 'react'
import type { LogLevel } from '@/types'

interface LogLine {
  id?: number
  level: LogLevel
  message: string
}

interface LogStreamProps {
  runId: string
  onDone?: (output?: string) => void
  onError?: (message: string) => void
}

const levelClasses: Record<LogLevel, string> = {
  info: 'text-white/60',
  warn: 'text-vo2-gold',
  error: 'text-[#FCA5A5]',
  success: 'text-vo2-green',
}

const levelPrefix: Record<LogLevel, string> = {
  info: '  ',
  warn: '⚠ ',
  error: '✕ ',
  success: '✓ ',
}

export function LogStream({ runId, onDone, onError }: LogStreamProps) {
  const [lines, setLines] = useState<LogLine[]>([])
  const [streamingText, setStreamingText] = useState<string>('')
  const [done, setDone] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLines([])
    setStreamingText('')
    setDone(false)

    const es = new EventSource(`/api/agents/logs/${runId}`)

    es.onmessage = (e) => {
      const data = JSON.parse(e.data as string) as Record<string, unknown>

      if (data.type === 'run_done') {
        setStreamingText('')
        setDone(true)
        onDone?.(data.output as string | undefined)
        es.close()
        return
      }

      if (data.type === 'run_error') {
        setStreamingText('')
        setDone(true)
        onError?.(data.message as string)
        es.close()
        return
      }

      // Live text chunk from claude CLI
      if (data.type === 'chunk' && data.text) {
        setStreamingText(data.text as string)
        return
      }

      // Persisted log line (info/warn/error/success)
      if (data.level && data.message) {
        setLines((prev) => [
          ...prev,
          { id: data.id as number | undefined, level: data.level as LogLevel, message: data.message as string },
        ])
      }
    }

    es.onerror = () => es.close()

    return () => es.close()
  }, [runId, onDone, onError])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [lines, streamingText])

  return (
    <div className="bg-blue-deep rounded-xl border border-white/10 overflow-hidden flex flex-col">
      {/* Terminal header */}
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/10">
        <span className="size-2.5 rounded-full bg-[#DC2626]" />
        <span className="size-2.5 rounded-full bg-vo2-gold" />
        <span className="size-2.5 rounded-full bg-vo2-green" />
        <span className="label-mono ml-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
          agent · {runId.slice(0, 8)}
        </span>
        {!done && (
          <span className="ml-auto size-1.5 rounded-full bg-blue-vo2 animate-pulse" />
        )}
      </div>

      {/* Log lines */}
      <div className="font-mono text-xs p-4 space-y-1 min-h-32 max-h-96 overflow-y-auto">
        {lines.length === 0 && !streamingText && !done && (
          <p className="text-white/30 animate-pulse">Initialisation…</p>
        )}

        {/* Status log lines */}
        {lines.map((line, i) => (
          <p key={line.id ?? i} className={levelClasses[line.level]}>
            <span className="text-white/20 mr-2 select-none">›</span>
            <span className="mr-1 select-none">{levelPrefix[line.level]}</span>
            {line.message}
          </p>
        ))}

        {/* Live streaming output from claude CLI */}
        {streamingText && (
          <div className="mt-2 pt-2 border-t border-white/10">
            <p className="text-white/30 text-[10px] uppercase tracking-widest mb-2 select-none">sortie en cours</p>
            <pre className="text-white/70 whitespace-pre-wrap leading-relaxed">{streamingText}</pre>
          </div>
        )}

        {done && <p className="text-white/20 mt-2 select-none">── fin ──</p>}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
