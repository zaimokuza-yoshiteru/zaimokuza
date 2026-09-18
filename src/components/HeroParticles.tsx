import { useEffect, useRef, useState } from 'react'
import { profile } from '../data/profile'
import { createPortraitParticles, portraitOutline, portraitClipPath, stepParticles, type Particle, type ParticlePointer } from '../lib/particleField'

const portraitUrl = `${import.meta.env.BASE_URL}images/hero-portrait.jpg`

/** 原图仅用于取色，最终形象由各自拥有位置、速度和归位点的粒子绘制；
 *  只有在取色或 Canvas 不可用时才退回原图，避免正常加载时先看到照片。 */
export default function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)
  const [fallback, setFallback] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = canvas?.parentElement
    if (!canvas || !container) { setFallback(true); return }
    const context = canvas.getContext('2d')
    if (!context) { setFallback(true); return }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const coarse = window.matchMedia('(hover: none), (pointer: coarse)')
    const image = new Image()
    let points: Particle[] = []
    let extent = 0
    let frame = 0
    let lastFrame = 0
    let visible = false
    let disposed = false
    let initialized = false
    let pointer: ParticlePointer | null = null
    const canAnimate = () => !reduced.matches && !coarse.matches && visible && !document.hidden
    const draw = () => {
      context.clearRect(0, 0, extent, extent)
      context.fillStyle = '#29352f'
      for (const point of points) {
        context.globalAlpha = point.shade
        context.fillRect(point.x - point.size / 2, point.y - point.size / 2, point.size, point.size)
      }
      context.globalAlpha = 1
    }
    const stop = () => { cancelAnimationFrame(frame); frame = 0 }
    const animate = (now: number) => {
      frame = 0
      if (!canAnimate()) return
      if (now - lastFrame < 1000 / 30) { frame = requestAnimationFrame(animate); return }
      const moving = stepParticles(points, pointer, Math.min(now - lastFrame, 1000 / 30), now / 1000)
      lastFrame = now
      draw()
      // 聚合和回弹结束即休眠，下一次鼠标移动再唤醒。
      if (moving) frame = requestAnimationFrame(animate)
    }
    const wake = () => {
      if (!frame && points.length && canAnimate()) {
        lastFrame = performance.now() - 1000 / 30
        frame = requestAnimationFrame(animate)
      }
    }
    const resize = () => {
      if (!image.naturalWidth || disposed) return
      stop()
      pointer = null
      extent = container.clientWidth
      if (!extent) return
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = canvas.height = Math.round(extent * ratio)
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      const resolution = coarse.matches || extent < 360 ? 76 : 96
      const sample = document.createElement('canvas')
      sample.width = sample.height = resolution
      const sampler = sample.getContext('2d', { willReadFrequently: true })
      if (!sampler) { setFallback(true); return }
      // 花朵和纹理位于轮廓外，不进入粒子采样；回退图片也使用同一轮廓。
      sampler.beginPath()
      portraitOutline.forEach(([x, y], index) => {
        if (index === 0) sampler.moveTo(x / 300 * resolution, y / 300 * resolution)
        else sampler.lineTo(x / 300 * resolution, y / 300 * resolution)
      })
      sampler.closePath()
      sampler.clip()
      sampler.drawImage(image, 0, 0, resolution, resolution)
      points = createPortraitParticles(sampler.getImageData(0, 0, resolution, resolution).data, resolution, extent)
      // 首次入场从松散点云收拢；静态模式直接显示完整形象。
      if (!initialized && canAnimate()) {
        points.forEach((point, index) => {
          const angle = index * 2.39996
          const spread = 25 + (index % 71)
          point.x += Math.cos(angle) * spread
          point.y += Math.sin(angle) * spread
        })
      }
      initialized = true
      draw()
      setReady(true)
      wake()
    }
    const leave = () => { pointer = null; wake() }
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || !canAnimate()) return
      const bounds = container.getBoundingClientRect()
      pointer = { x: event.clientX - bounds.left, y: event.clientY - bounds.top }
      wake()
    }
    const syncVisibility = () => {
      pointer = null
      if (canAnimate()) wake()
      else stop()
    }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; syncVisibility() })
    const resizeObserver = new ResizeObserver(resize)
    observer.observe(container)
    resizeObserver.observe(container)
    container.addEventListener('pointermove', move, { passive: true })
    container.addEventListener('pointerleave', leave)
    window.addEventListener('blur', leave)
    window.addEventListener('scroll', leave, { passive: true })
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', syncVisibility)
    reduced.addEventListener('change', resize)
    coarse.addEventListener('change', resize)
    image.onload = () => {
      const bounds = container.getBoundingClientRect()
      visible = bounds.bottom > 0 && bounds.top < window.innerHeight
      resize()
    }
    image.onerror = () => setFallback(true)
    // 原图只在粒子不可用时兜底显示，正常路径下由 Canvas 绘制。
    image.src = portraitUrl
    return () => {
      disposed = true
      image.onload = null
      image.onerror = null
      stop()
      observer.disconnect()
      resizeObserver.disconnect()
      container.removeEventListener('pointermove', move)
      container.removeEventListener('pointerleave', leave)
      window.removeEventListener('blur', leave)
      window.removeEventListener('scroll', leave)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', syncVisibility)
      reduced.removeEventListener('change', resize)
      coarse.removeEventListener('change', resize)
    }
  }, [])

  return (
    <div className="hero-portrait" data-ready={ready} data-fallback={fallback} role="img" aria-label={profile.heroPortraitAlt}>
      <img src={portraitUrl} alt="" aria-hidden="true" style={{ clipPath: portraitClipPath }} />
      <canvas ref={canvasRef} aria-hidden="true" />
    </div>
  )
}
