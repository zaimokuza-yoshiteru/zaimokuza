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
  return (
    <section className="site-frame home-section home-projects">
      <div id="projects" className="section-heading scroll-mt-[40px]">
        <SectionHeader title={copy.title} count={displayedProjects.length} />
      </div>
      <div className="section-content">
        <div id="project-list" className="project-list">
          {displayedProjects.map((p, i) => {
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
      </div>
    </section>
  )
}
