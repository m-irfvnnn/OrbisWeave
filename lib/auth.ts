import { FirebaseError } from 'firebase/app'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

const googleProvider = new GoogleAuthProvider()

export async function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function signupWithEmail(name: string, email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(credential.user, { displayName: name.trim() })
  return credential
}

export async function loginWithGoogle() {
  return signInWithPopup(auth, googleProvider)
}

export async function signOut() {
  return firebaseSignOut(auth)
}

export function getAuthErrorMessage(error: unknown) {
  if (!(error instanceof FirebaseError)) return 'Something went wrong. Please try again.'

  switch (error.code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'The email or password is incorrect.'
    case 'auth/email-already-in-use':
      return 'An account already exists for this email.'
    case 'auth/invalid-email':
      return 'Enter a valid email address.'
    case 'auth/weak-password':
      return 'Choose a stronger password with at least 6 characters.'
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled.'
    case 'auth/popup-blocked':
      return 'The Google sign-in window was blocked. Please allow pop-ups and try again.'
    case 'auth/network-request-failed':
      return 'Unable to connect. Check your internet connection and try again.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.'
    default:
      return 'Authentication failed. Please try again.'
  }
}
