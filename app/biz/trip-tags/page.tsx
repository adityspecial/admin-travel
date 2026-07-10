'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TripTagsPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/biz') }, [])
  return null
}
