import projects from '../data/projects.json'
import { profile } from '../data/profile'
import { useGithubStars } from '../hooks/useGithubStars'
import ProjectCat from './ProjectCat'
import { resetTilt, tiltSurface } from '../tilt'

// 主题实验固定收尾，其余项目保持生成数据的相对顺序。
const displayedProjects = [
  ...projects.filter((project) => project.name !== 'dsh-theme-library'),
  ...projects.filter((project) => project.name === 'dsh-theme-library'),
]

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div>
      <h2 className="text-[32px] font-semibold tracking-tight md:text-[40px]">
        {title}
      </h2>
      {sub && <p className="mt-[10px] text-[14px] text-text-secondary">{sub}</p>}
    </div>
  )
}

/** 开源作品集：数据来自 scripts/fetch-github.mjs 生成的 projects.json */
export default function Projects() {
  const stars = useGithubStars()
  const copy = profile.projects
  return (
    <section className="mx-auto w-[calc(100%-56px)] max-w-[1260px] py-[48px] md:py-[64px]">
      <div id="projects" className="projects-heading scroll-mt-[40px]">
        <SectionHeader title={copy.title} sub={copy.intro} />
        <ProjectCat />
      </div>
      <div className="mt-[36px] flex flex-col gap-[12px]">
        {displayedProjects.map((p, i) => {
          const entry = copy.entries[p.name]
          return (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              onPointerMove={tiltSurface}
              onPointerLeave={resetTilt}
              onPointerCancel={resetTilt}
              className="reveal project-card group grid gap-[18px] rounded-[12px] border border-border-warm bg-bg-card p-[24px] md:grid-cols-[28px_minmax(0,1fr)_72px] md:items-start md:gap-x-[24px] md:p-[32px] xl:grid-cols-[28px_240px_minmax(0,1fr)_72px]"
              style={{ transitionDelay: `${i * 50}ms` }}
            >
              <span aria-hidden="true" className="font-mono-num text-[13px] leading-[28px] text-text-secondary">{String(i + 1).padStart(2, '0')}</span>
              <div className="min-w-0">
                <h3 className="break-words font-mono-num text-[18px] font-medium leading-[30px] tracking-tight">{p.name}</h3>
              </div>
              <p className="project-description text-[16px] leading-[29px] text-text-secondary md:col-start-2 xl:col-start-3">
                {entry?.description ?? copy.fallback}
              </p>
              <div className="flex items-center justify-between gap-[16px] text-text-secondary md:col-start-3 md:row-start-1 md:row-span-2 md:flex-col md:items-end xl:col-start-4 xl:row-span-1">
                <span className="whitespace-nowrap font-mono-num text-[13px] leading-[28px]" aria-label={`${stars[p.name]} GitHub Stars`}>☆ {stars[p.name]}</span>
                <span className="whitespace-nowrap text-[12px]">{copy.linkLabel} <span aria-hidden="true" className="project-arrow inline-block">↗</span></span>
              </div>
            </a>
          )
        })}
      </div>
    </section>
  )
}

export { SectionHeader }
