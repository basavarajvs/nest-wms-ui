import { useEffect, useRef } from 'react'
import { useRouter } from '@tanstack/react-router'
import LoadingBar from 'react-top-loading-bar'
import type { LoadingBarRef } from 'react-top-loading-bar'

export function NavigationProgress() {
  const ref = useRef<LoadingBarRef>(null)
  const router = useRouter()

  useEffect(() => {
    const unsubBeforeLoad = router.subscribe('onBeforeLoad', () => {
      ref.current?.continuousStart()
    })
    const unsubResolved = router.subscribe('onResolved', () => {
      ref.current?.complete()
    })
    return () => {
      unsubBeforeLoad()
      unsubResolved()
    }
  }, [router])

  return (
    <LoadingBar
      ref={ref}
      color="hsl(var(--primary))"
      height={3}
      shadow
      waitingTime={200}
      transitionTime={300}
    />
  )
}
