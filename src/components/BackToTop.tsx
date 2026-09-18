import { useEffect, useState } from 'react'

interface BackToTopProps {
  label: string
  focusTargetId?: string
}

export default function BackToTop({ label, focusTargetId }: BackToTopProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let frame: number | undefined
    const updateVisibility = () => {
      frame = undefined
      setVisible(window.scrollY > 400)
    }
    // 合并同一帧内的滚动事件，只在越过阈值时触发重新渲染。
    const onScroll = () => {
      if (frame === undefined) frame = window.requestAnimationFrame(updateVisibility)
    }
    updateVisibility()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame !== undefined) window.cancelAnimationFrame(frame)
    }
  }, [])

  const backToTop = () => {
    // 先移交键盘焦点，再滚动到页面顶部，避免焦点跳转改变滚动终点。
    if (focusTargetId) document.getElementById(focusTargetId)?.focus({ preventScroll: true })
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' })
  }

  return <button
    type="button"
    title={label}
    aria-label={label}
    aria-hidden={!visible}
    tabIndex={visible ? 0 : -1}
    disabled={!visible}
    onClick={backToTop}
    className={`fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] z-40 flex h-12 w-12 items-center justify-center rounded-chip border border-border-warm bg-bg-card text-text-primary shadow-[0_4px_20px_rgba(31,35,41,0.08)] transition-[opacity,transform,background-color,color,visibility] duration-300 ease-out-strong hover:-translate-y-1 hover:bg-text-primary hover:text-bg-card focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text-primary motion-reduce:transform-none motion-reduce:transition-none ${visible ? 'visible translate-y-0 opacity-100' : 'invisible translate-y-2 opacity-0 pointer-events-none'}`}
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 19V5m-6 6 6-6 6 6" />
    </svg>
  </button>
}
