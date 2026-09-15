import { useLayoutEffect, useRef, useState } from 'react'
import projects from '../data/projects.json'
import { profile } from '../data/profile'
import { useGithubStars } from '../hooks/useGithubStars'
import SectionHeader from './SectionHeader'

// 主题实验固定收尾，其余项目保持生成数据的相对顺序。
const displayedProjects = [
  ...projects.filter((project) => project.name !== 'dsh-theme-library'),
  ...projects.filter((project) => project.name === 'dsh-theme-library'),
]

/** 开源作品集：数据来自 scripts/fetch-github.mjs 生成的 projects.json */
export default function Projects() {
  const stars = useGithubStars()
  const copy = profile.projects
  const [visibleCount, setVisibleCount] = useState(5)
  const listRef = useRef<HTMLDivElement>(null)
  const previousCount = useRef(5)
  const shown = Math.min(visibleCount, displayedProjects.length)
  useLayoutEffect(() => {
    if (visibleCount <= previousCount.current) return
    // 展开后从第一个新增作品继续阅读，键盘焦点也随之移动。
    const firstNew = listRef.current?.children[previousCount.current] as HTMLAnchorElement | undefined
    firstNew?.classList.add('visible')
    firstNew?.focus({ preventScroll: true })
    firstNew?.scrollIntoView({ block: 'nearest' })
    previousCount.current = visibleCount
  }, [visibleCount])
  return (
    <section className="site-frame home-section">
      <div id="projects" className="section-heading scroll-mt-[40px]">
        <SectionHeader title={copy.title} count={displayedProjects.length} />
      </div>
      <div className="section-content">
        <div ref={listRef} id="project-list" className="project-list">
          {displayedProjects.slice(0, visibleCount).map((p, i) => {
            const entry = copy.entries[p.name]
            return (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="reveal project-row group"
                style={{ transitionDelay: `${(i % 5) * 50}ms` }}
              >
                <div className="min-w-0">
                  <h3 className="break-words font-mono-num text-[18px] font-medium leading-[30px] tracking-tight">{p.name}</h3>
                </div>
                <p className="project-description text-[14px] leading-[26px] text-text-secondary">
                  {entry?.description ?? copy.fallback}
                </p>
                <div className="project-links text-text-secondary">
                  <span className="whitespace-nowrap font-mono-num text-[13px] leading-[28px]" aria-label={`${stars[p.name]} GitHub Stars`}>☆ {stars[p.name]}</span>
                  <span className="whitespace-nowrap text-[12px]">{copy.linkLabel} <span aria-hidden="true" className="project-arrow inline-block">↗</span></span>
                </div>
              </a>
            )
          })}
        </div>
        <div className="collection-footer">
          <p role="status">{profile.collections.shown} <span className="font-mono-num">{shown} / {displayedProjects.length}</span> {copy.unit}</p>
          {shown < displayedProjects.length ? (
            <button type="button" className="collection-more" aria-controls="project-list" onClick={() => setVisibleCount((count) => count + 5)}>
              {profile.collections.more} <span className="font-mono-num">+{Math.min(5, displayedProjects.length - shown)}</span> <span aria-hidden="true">↓</span>
            </button>
          ) : <span>{profile.collections.allShown}</span>}
        </div>
      </div>
    </section>
  )
}
