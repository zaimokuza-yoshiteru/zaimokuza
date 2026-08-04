import { useEffect, useRef } from 'react'

/**
 * 内容区通过 cursor:none 隐藏系统光标，
 * 由 JS 绘制 .cursor-dot（6px 黑点）+ .cursor-ring（32px 圆环，缓动跟随）。
 * 悬停链接/按钮时圆环放大到 80px；悬停 hero 区域时光标隐藏（反色遮罩接管）。
 */
export default function CustomCursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    const dot = dotRef.current
    const ring = ringRef.current
    let targetX = -100
    let targetY = -100
    let ringX = -100
    let ringY = -100
    let raf = 0

    const onMove = (e) => {
      targetX = e.clientX
      targetY = e.clientY
      dot.style.opacity = '1'
      dot.style.left = `${targetX}px`
      dot.style.top = `${targetY}px`
    }
    const onOver = (e) => {
      const interactive = e.target.closest?.('a, button, [role="button"]')
      const hero = e.target.closest?.('[data-cursor="hero"]')
      ring.classList.toggle('cursor-button', !!interactive)
      // hero 区域由反色遮罩充当光标
      const hide = !!hero
      dot.style.opacity = hide ? '0' : '1'
      ring.style.opacity = hide ? '0' : '1'
    }
    const loop = () => {
      ringX += (targetX - ringX) * 0.18
      ringY += (targetY - ringY) * 0.18
      ring.style.left = `${ringX}px`
      ring.style.top = `${ringY}px`
      raf = requestAnimationFrame(loop)
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseover', onOver, { passive: true })
    raf = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      <div ref={dotRef} className="cursor-dot" style={{ opacity: 0 }} />
      <div ref={ringRef} className="cursor-ring" style={{ opacity: 0 }} />
    </>
  )
}
