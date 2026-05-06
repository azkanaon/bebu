'use client'

import { ReactNode, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  children: ReactNode
  selector?: string
}

// Fungsi kosong untuk langganan (tidak diperlukan untuk cek client-side)
const emptySubscribe = () => () => {}

export default function ClientPortal({ children, selector = 'body' }: Props) {
  // useSyncExternalStore adalah cara resmi React 18+ untuk sinkronisasi
  // antara server-side dan client-side secara aman.
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true, // Apa yang dirembalikan di Client
    () => false, // Apa yang dikembalikan di Server
  )

  if (!isClient) return null

  const target = document.querySelector(selector)
  if (!target) return null

  return createPortal(children, target)
}
