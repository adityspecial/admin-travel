'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export function withAuthGuard<P extends object>(Component: React.ComponentType<P>) {
  return function ProtectedComponent(props: P) {
    const [isAuthed, setIsAuthed] = useState(false)
    const router = useRouter()

    useEffect(() => {
      const token = sessionStorage.getItem('admin_dev_token')
      if (!token) {
        router.push('/login')
        return
      }
      setIsAuthed(true)
    }, [router])

    if (!isAuthed) return <div>Checking authentication...</div>
    return <Component {...props} />
  }
}
