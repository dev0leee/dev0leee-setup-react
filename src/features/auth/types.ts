export interface User {
  id: string
  email: string
  name: string
}

export type AuthStatus = 'booting' | 'authenticated' | 'anonymous'
