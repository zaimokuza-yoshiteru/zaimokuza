import { useEffect } from 'react'

/**
 * 滚动 reveal：IntersectionObserver 给 .reveal 元素加 .visible，
 * CSS 侧是 opacity/translateY 过渡（threshold 0.15，只触发一次）。
 */
export function useRevealOnScroll() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            io.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' },
    )
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}
