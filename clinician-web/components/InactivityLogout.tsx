"use client" // 1 hour

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "../lib/supabase-browser"

const TIMEOUT_MS = 60 * 60 * 1000

export default function InactivityLogout({
  redirectTo = "/login",
}: {
  redirectTo?: string
}) {
  const router = useRouter()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const reset = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push(redirectTo)
        router.refresh()
      }, TIMEOUT_MS)
    }

    const events: string[] = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "click",
    ]
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    reset()

    return () => {
      events.forEach((e) => window.removeEventListener(e, reset))
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [redirectTo, router])

  return null
}
