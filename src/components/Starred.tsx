import { profile } from '../data/profile'
import type { RepoMetricsMap } from '../lib/repoMetrics'
import type { RepoSnapshot } from '../lib/repoSnapshot'
import { starredHref } from '../lib/navigation'
import RepoObservatory from './RepoObservatory'
import SectionHeader from './SectionHeader'

/**
 * 观测：独立页面而非首页卡片。
 * 顶部仓库列表用于切换，正文整页展开，深链接形如 #/starred/<owner>/<repo>。
 * repos 由 App 传入：构建快照先渲染，远端快照到达后替换。
 */
export default function Starred({ repos, metrics, slug }: {
  repos: RepoSnapshot[]
  metrics: RepoMetricsMap
  slug: string
}) {
  const copy = profile.starred
  const current = slug ? repos.find((repo) => repo.fullName === slug) : repos[0]
  return (
    <section className="site-frame starred-archive">
      <div className="section-heading">
        <SectionHeader title={copy.title} count={repos.length} level={1} />
      </div>
      <nav className="repo-switcher reveal" aria-label={copy.switchLabel}>
        {repos.map((repo) => (
          <a
            key={repo.fullName}
            href={starredHref(repo.fullName)}
            aria-current={repo === current ? 'page' : undefined}
            className="font-mono-num"
          >
            {repo.fullName}
          </a>
        ))}
      </nav>
      {!current ? <p className="starred-missing">{copy.notFound}</p> : (
        // key 让切换仓库时整页重新挂载，面板的入场动画因此可以重放。
        <RepoObservatory
          key={current.fullName}
          repo={current}
          description={copy.entries[current.fullName]?.description ?? profile.repoUI.fallback}
          metrics={metrics[current.fullName] ?? current}
        />
      )}
    </section>
  )
}
