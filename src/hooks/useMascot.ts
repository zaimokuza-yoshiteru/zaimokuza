import { useEffect, useRef, useState } from 'react'

/** 只在可见且前台时播放角色动画，点击反馈由原生按钮兼容键盘和触屏。 */
export function useMascot() {
  const ref = useRef<HTMLButtonElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [visible, setVisible] = useState(false)
  const [active, setActive] = useState(false)
  useEffect(() => {
    let intersects = false
    const sync = () => setVisible(intersects && !document.hidden)
    const observer = new IntersectionObserver(([entry]) => { intersects = entry.isIntersecting; sync() })
    if (ref.current) observer.observe(ref.current)
    document.addEventListener('visibilitychange', sync)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', sync)
      clearTimeout(timer.current)
    }
  }, [])
  const greet = () => {
    setActive(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setActive(false), 1200)
  }
  return { ref, visible, active, greet }
}
