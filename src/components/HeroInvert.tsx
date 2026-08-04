import { useEffect, useRef } from 'react'
import { HeroText } from './Hero'

/**
 * Hero 反色遮罩：fixed 黑层内嵌白色 HeroText 克隆，
 * clip-path 圆形随鼠标缓动展开，只在圆内显示"黑底白字"。
 * 每帧同步克隆与真实文案的屏幕位置（body 滚动时保持对齐）。
 */
export default function HeroInvert() {
  const layerRef = useRef<HTMLDivElement>(null)
  const cloneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    const layer = layerRef.current
    const clone = cloneRef.current
    const real = document.querySelector('.hero-content[data-cursor="hero"]')
    if (!layer || !clone || !real) return

    let mouseX = -300
    let mouseY = -300
    let x = -300
    let y = -300
    let r = 0
    let raf = 0
    const R_MAX = 95

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }

    const loop = () => {
      const rect = real.getBoundingClientRect()
      const pad = 120
      const heroGone = rect.bottom < -pad || rect.top > window.innerHeight + pad
      const inside =
        !heroGone &&
        mouseX > rect.left - pad &&
        mouseX < rect.right + pad &&
        mouseY > rect.top - pad &&
        mouseY < rect.bottom + pad
      const targetR = inside ? R_MAX : 0
      x += (mouseX - x) * 0.14
      y += (mouseY - y) * 0.14
      r += (targetR - r) * 0.12
      if (targetR === 0 && r < 0.5) r = 0
      layer.style.clipPath = `circle(${r}px at ${x}px ${y}px)`
      clone.style.transform = `translate(${rect.left}px, ${rect.top}px)`
      clone.style.width = `${rect.width}px`
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    raf = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div ref={layerRef} className="hero-invert" style={{ inset: 0, clipPath: 'circle(0px at -300px -300px)' }} aria-hidden="true">
      <div ref={cloneRef} className="hero-content" style={{ position: 'absolute', left: 0, top: 0 }}>
        <HeroText zh />
      </div>
    </div>
  )
}
