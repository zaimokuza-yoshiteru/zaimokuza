import { useEffect, useRef } from 'react'
import lottie from 'lottie-web'
import { profile } from '../data/profile.js'

/** Hero 文案（真实内容与反色遮罩克隆共用）。
 *  真实文案始终英文；遮罩克隆传 zh 显示中文——黑圈内白字即为中文。 */
export function HeroText({ zh = false }) {
  return (
    <>
      {/* 中文是黑圈内的克隆文案，字符更宽，字号收小避免换行；
          mt 补偿两种字号的行高差，使「你好」与「Hi」底部对齐 */}
      <h1
        className={`font-serif-main leading-[1.08] tracking-[-0.02em] ${
          zh
            ? 'mt-[calc((clamp(36px,4.8vw,72px)-clamp(28px,3.6vw,52px))*1.08)] text-[clamp(28px,3.6vw,52px)]'
            : 'text-[clamp(36px,4.8vw,72px)]'
        }`}
      >
        {zh
          ? profile.heroTitle.zh
          : profile.heroTitle.en.split(' ').map((word, wi, arr) => {
              // 按单词分组（whitespace-nowrap），避免逐字符 span 在单词中间断行
              const offset = arr.slice(0, wi).reduce((n, w) => n + w.length + 1, 0)
              return (
                <span key={wi} className="inline-block whitespace-nowrap">
                  {[...word].map((ch, i) => (
                    <span key={i} className="hero-char" style={{ animationDelay: `${0.3 + (offset + i) * 0.06}s` }}>
                      {ch}
                    </span>
                  ))}
                  {wi < arr.length - 1 ? ' ' : null}
                </span>
              )
            })}
      </h1>
      <p className="hero-fade-in mt-[16px] font-serif-main text-[clamp(18px,2.4vw,30px)] leading-[1.3]">
        {zh ? profile.tagline.zh : profile.tagline.en}
      </p>
      <p className="hero-fade-in mt-[28px] max-w-[560px] text-[15px] leading-[28px] text-text-secondary" style={{ animationDelay: '1.1s' }}>
        {zh ? profile.bio.zh : profile.bio.en}
      </p>
      {profile.location && (
        <p className="hero-fade-in mt-[12px] font-mono-num text-[13px] text-text-secondary" style={{ animationDelay: '1.2s' }}>
          {zh ? profile.location.zh : profile.location.en}
        </p>
      )}
    </>
  )
}

export default function Hero() {
  const earthRef = useRef(null)

  // 地球 Lottie 动画（hover 上浮效果见 index.css 的 .hero-earth 规则）
  useEffect(() => {
    const container = earthRef.current
    if (!container) return
    let anim
    let cancelled = false
    // 路径带 BASE_URL，兼容 GitHub Pages 子路径部署
    fetch(`${import.meta.env.BASE_URL}lottie/earth/data.json`)
      .then((r) => r.json())
      .then((animationData) => {
        if (cancelled) return
        anim = lottie.loadAnimation({
          container,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData,
          assetsPath: `${import.meta.env.BASE_URL}lottie/earth/images/`,
        })
      })
      .catch((e) => console.error('[EarthLottie] load failed', e))
    return () => {
      cancelled = true
      anim?.destroy()
    }
  }, [])

  return (
    <section className="flex min-h-[calc(100vh-72px)] items-center py-[40px] md:py-0">
      <div className="mx-auto grid w-[calc(100%-56px)] max-w-[1260px] items-center gap-[36px] md:grid-cols-[1.05fr_1fr] md:gap-[48px]">
        <div className="hero-content" data-cursor="hero">
          <HeroText />
        </div>
        <div className="hero-earth hero-fade-in" style={{ animationDelay: '0.9s' }}>
          <div ref={earthRef} className="hero-earth-inner" />
        </div>
      </div>
    </section>
  )
}
