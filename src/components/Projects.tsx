import type { RepoSnapshot } from '../lib/repoSnapshot'
import { profile } from '../data/profile'
import type { RepoMetricsMap } from '../lib/repoMetrics'
import RepoCard from './RepoCard'
import SectionHeader from './SectionHeader'

/** 开源作品集：置顶仓库列表来自 scripts/fetch-github.ts 生成的 projects.json */
export default function Projects({ repos, metrics }: { repos: RepoSnapshot[]; metrics: RepoMetricsMap }) {
  const copy = profile.projects
  return (
    <section className="site-frame home-section home-projects">
      <div id="projects" className="section-heading scroll-mt-[var(--nav-h)]">
        <SectionHeader title={copy.title} count={repos.length} />
      </div>
      <div className="section-content">
        <div id="project-list" className="project-list">
          {repos.map((repo, i) => (
            <RepoCard
              key={repo.fullName}
              repo={repo}
              title={repo.name}
              description={copy.entries[repo.name]?.description ?? profile.repoUI.fallback}
              metrics={metrics[repo.fullName] ?? repo}
              delayMs={(i % 5) * 50}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
