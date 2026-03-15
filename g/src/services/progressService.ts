import { doc, serverTimestamp, setDoc } from 'firebase/firestore'

import { getFirebaseServices } from '@/firebase/config'
import type { GameState } from '@/types/models'

const STORAGE_KEY = 'gamekids-state-v1'

export function loadStoredSnapshot(): GameState | null {
  if (typeof window === 'undefined') {
    return null
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY)

  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as GameState
  } catch {
    return null
  }
}

export function persistSnapshot(snapshot: GameState) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
}

export async function syncSnapshot(snapshot: GameState) {
  const services = getFirebaseServices()

  if (!services || !snapshot.currentUser) {
    return
  }

  await setDoc(
    doc(services.firestore, 'gameState', snapshot.currentUser.id),
    {
      ...snapshot,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}
