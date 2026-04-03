import { doc, serverTimestamp, setDoc } from 'firebase/firestore'

import { getFirebaseServices } from '@/firebase/config'
import type { ExperienceMode, GameState } from '@/types/models'

const LEGACY_STORAGE_KEY = 'gamekids-state-v1'
const MODE_STORAGE_KEY = 'gamekids-experience-mode-v1'
const SNAPSHOT_STORAGE_KEYS: Record<ExperienceMode, string> = {
  admin: 'gamekids-admin-state-v1',
  player: 'gamekids-player-state-v1',
}

export function loadStoredExperienceMode(): ExperienceMode | null {
  if (typeof window === 'undefined') {
    return null
  }

  const rawValue = window.localStorage.getItem(MODE_STORAGE_KEY)

  return rawValue === 'admin' || rawValue === 'player' ? rawValue : null
}

export function persistExperienceMode(mode: ExperienceMode) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(MODE_STORAGE_KEY, mode)
}

export function loadStoredSnapshot(mode: ExperienceMode): GameState | null {
  if (typeof window === 'undefined') {
    return null
  }

  const rawValue =
    window.localStorage.getItem(SNAPSHOT_STORAGE_KEYS[mode]) ??
    (mode === 'admin' ? window.localStorage.getItem(LEGACY_STORAGE_KEY) : null)

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

  persistExperienceMode(snapshot.experienceMode)
  window.localStorage.setItem(SNAPSHOT_STORAGE_KEYS[snapshot.experienceMode], JSON.stringify(snapshot))
}

export async function syncSnapshot(snapshot: GameState) {
  const services = getFirebaseServices()

  if (!services || !snapshot.currentUser || snapshot.experienceMode !== 'player') {
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
