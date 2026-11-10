import { supabase } from "./supabase"
import type { RealtimeChannel } from "@supabase/supabase-js"

// Hard cap: Supabase free tier allows 200 concurrent realtime connections per project.
// We limit per-client to prevent one session from exhausting the pool.
const MAX_CHANNELS = 15

const channels = new Map<string, RealtimeChannel>()

type PgChangeEvent = "INSERT" | "UPDATE" | "DELETE" | "*"

interface PgListener {
  event: PgChangeEvent
  schema: string
  table: string
  filter?: string
  callback: (payload: unknown) => void
}

/**
 * Subscribe to a named realtime channel. If a channel with this key already
 * exists it is reused — prevents duplicate subscriptions across re-renders.
 * Returns a cleanup function that removes the channel when done.
 */
export function subscribeToChannel(key: string, listeners: PgListener[]): () => void {
  if (channels.has(key)) {
    return () => unsubscribeFromChannel(key)
  }

  if (channels.size >= MAX_CHANNELS) {
    const [oldestKey] = channels.keys()
    unsubscribeFromChannel(oldestKey)
  }

  let ch: RealtimeChannel = supabase.channel(key)
  for (const l of listeners) {
    ch = ch.on(
      "postgres_changes",
      { event: l.event, schema: l.schema, table: l.table, filter: l.filter } as any,
      l.callback,
    )
  }
  ch.subscribe()
  channels.set(key, ch)

  return () => unsubscribeFromChannel(key)
}

function unsubscribeFromChannel(key: string): void {
  const ch = channels.get(key)
  if (!ch) return
  supabase.removeChannel(ch)
  channels.delete(key)
}

/** Call on sign-out to remove all active subscriptions. */
export function unsubscribeAll(): void {
  channels.forEach((ch) => supabase.removeChannel(ch))
  channels.clear()
}

export function activeChannelCount(): number {
  return channels.size
}
