import type { PointerEvent } from 'react'

/** 仅精细指针启用轻微倾斜，CSS 负责与页面一致的缓动。 */
export function tiltSurface(event: PointerEvent<HTMLElement>) {
  if (event.pointerType !== 'mouse' || !window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return
  const element = event.currentTarget
  const rect = element.getBoundingClientRect()
  const x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2))
  const y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2))
  element.style.setProperty('--tilt-x', `${-y * 1.8}deg`)
  element.style.setProperty('--tilt-y', `${x * 1.8}deg`)
}

export function resetTilt(event: PointerEvent<HTMLElement>) {
  event.currentTarget.style.setProperty('--tilt-x', '0deg')
  event.currentTarget.style.setProperty('--tilt-y', '0deg')
}
