import { useEffect, useRef } from 'react'
import lottie from 'lottie-web'
import type { AnimationItem } from 'lottie-web'
import { profile } from '../data/profile'
import { resetTilt, tiltSurface } from '../tilt'

/** 真实文案默认中文，反色遮罩复用同一布局显示英文。 */
export function HeroText({ language = 'zh' }: { language?: 'zh' | 'en' }) {
  return (
    <div lang={language === 'zh' ? 'zh-CN' : 'en'} className="hero-journal">
      <header className="hero-journal-meta hero-fade-in">
        <div><h1>{profile.heroTitle[language]}</h1><p className="hero-role">{profile.heroRole[language]}</p></div>
        <p>{profile.location[language]}</p>
      </header>
      <figure className="hero-journal-figure hero-fade-in" style={{ animationDelay: '0.2s' }}>
        <blockquote className="journal-quote-body">
          {/* 原文连续呈现，不再把首句拆成标题。 */}
          <div className="hero-quote grid">
            {(['zh', 'en'] as const).map((locale) => (
              <p key={locale} lang={locale === 'zh' ? 'zh-CN' : 'en'} aria-hidden={locale !== language || undefined}
                className={`col-start-1 row-start-1 ${locale !== language ? 'hero-quote-spacer invisible' : ''}`}>
                {profile.bio[locale]}
              </p>
            ))}
          </div>
        </blockquote>
        <figcaption className="journal-quote-source text-text-secondary">
          <span aria-hidden="true" />{profile.quoteSource[language]}
        </figcaption>
      </figure>
    </div>
  )
}

export default function Hero() {
  const earthRef = useRef<HTMLDivElement>(null)

  // 地球 Lottie 动画（hover 上浮效果见 index.css 的 .hero-earth 规则）
  useEffect(() => {
    const container = earthRef.current
    if (!container) return
    let anim: AnimationItem | undefined
    let cancelled = false
    let visible = false
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => {
      if (!anim) return
      if (motion.matches || !visible || document.hidden) anim.pause()
      else anim.play()
    }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync() })
    observer.observe(container)
    motion.addEventListener('change', sync)
    document.addEventListener('visibilitychange', sync)
    // 路径带 BASE_URL，兼容 GitHub Pages 子路径部署
    fetch(`${import.meta.env.BASE_URL}lottie/earth/data.json`)
      .then((r) => r.json())
      .then((animationData) => {
        if (cancelled) return
        anim = lottie.loadAnimation({
          container,
          renderer: 'svg',
          loop: true,
          autoplay: false,
          animationData,
          assetsPath: `${import.meta.env.BASE_URL}lottie/earth/images/`,
        })
        sync()
      })
      .catch((e) => console.error('[EarthLottie] load failed', e))
    return () => {
      cancelled = true
      observer.disconnect()
      motion.removeEventListener('change', sync)
      document.removeEventListener('visibilitychange', sync)
      anim?.destroy()
    }
  }, [])

  return (
    <section className="home-hero">
      <div className="site-frame hero-layout">
        <div className="hero-content" data-cursor="hero">
          <HeroText />
        </div>
        <div className="hero-earth hero-earth-journal hero-fade-in" style={{ animationDelay: '0.9s' }}
          onPointerMove={tiltSurface} onPointerLeave={resetTilt} onPointerCancel={resetTilt}>
          <div ref={earthRef} className="hero-earth-inner" />
        </div>
      </div>
    </section>
  )
}
