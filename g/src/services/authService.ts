import { signInWithPopup, signOut } from 'firebase/auth'

import { getFirebaseServices } from '@/firebase/config'
import type { AppUser } from '@/types/models'

const demoUser: AppUser = {
  id: 'demo-parent',
  name: 'הורה בדמו',
  email: 'parent@demo.gamekids',
}

export async function signInWithGoogle(): Promise<AppUser> {
  const services = getFirebaseServices()

  if (!services) {
    await new Promise((resolve) => {
      window.setTimeout(resolve, 350)
    })

    return demoUser
  }

  const result = await signInWithPopup(services.auth, services.googleProvider)

  return {
    id: result.user.uid,
    name: result.user.displayName ?? 'הורה',
    email: result.user.email ?? '',
    photoUrl: result.user.photoURL ?? undefined,
  }
}

export async function signOutCurrentUser() {
  const services = getFirebaseServices()

  if (!services) {
    return
  }

  await signOut(services.auth)
}
