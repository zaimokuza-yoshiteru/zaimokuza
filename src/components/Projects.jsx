import projects from '../data/projects.json'

/** 语言圆点配色（GitHub 惯例色） */
const LANG_COLORS = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Java: '#b07219',
  Python: '#3572a5', Go: '#00add8', Rust: '#dea584',
  'C++': '#f34b7d', C: '#555', HTML: '#e34c26', CSS: '#563d7c',
}

function SectionHeader({ id, title, sub }) {
  return (
    <div className="reveal">
      <h2 id={id} className="scroll-mt-[40px] text-[32px] font-semibold tracking-tight md:text-[40px]">
        {title}
      </h2>
      {sub && <p className="mt-[10px] text-[14px] text-text-secondary">{sub}</p>}
    </div>
  )
}

/** 开源作品集：数据来自 scripts/fetch-github.mjs 生成的 projects.json */
export default function Projects() {
  return (
    <section className="mx-auto w-[calc(100%-56px)] max-w-[1260px] py-[48px] md:py-[64px]">
      <SectionHeader id="projects" title="开源作品" sub="在 GitHub 上维护的开源项目，持续更新。" />
      <div className="mt-[36px] grid gap-[16px] md:grid-cols-2">
        {projects.map((p, i) => (
          <a
            key={p.name}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="reveal group rounded-[12px] border border-border-warm bg-bg-card p-[24px] transition-all duration-500 [transition-timing-function:var(--ease-out-strong)] hover:-translate-y-[4px] hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)]"
            style={{ transitionDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-mono-num text-[16px] font-medium">{p.name}</h3>
              <span className="text-[16px] text-text-secondary transition-transform duration-500 [transition-timing-function:var(--ease-out-strong)] group-hover:translate-x-[3px]">
                →
              </span>
            </div>
            <p className="mt-[10px] min-h-[44px] text-[14px] leading-[22px] text-text-secondary">
              {p.description || '暂无描述'}
            </p>
            <div className="mt-[16px] flex flex-wrap items-center gap-x-[16px] gap-y-[6px] text-[12px] text-text-secondary">
              {p.language && (
                <span className="flex items-center gap-[6px]">
                  <span className="inline-block size-[10px] rounded-full" style={{ background: LANG_COLORS[p.language] || '#999' }} />
                  {p.language}
                </span>
              )}
              <span className="font-mono-num">★ {p.stars}</span>
              {p.topics?.map((t) => (
                <span key={t} className="rounded-full bg-bg-section px-[8px] py-[2px]">{t}</span>
              ))}
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}

export { SectionHeader }
