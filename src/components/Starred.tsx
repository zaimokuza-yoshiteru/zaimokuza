import starred from '../data/starred.json'
import { profile } from '../data/profile'
import type { RepoMetricsMap } from '../lib/repoMetrics'
import { homeHref, starredHref } from '../lib/navigation'
import RepoObservatory from './RepoObservatory'
import SectionHeader from './SectionHeader'

/**
 * 观测：独立页面而非首页卡片。
 * 顶部仓库列表用于切换，正文整页展开，深链接形如 #/starred/<owner>/<repo>。
 */
export default function Starred({ metrics, slug }: { metrics: RepoMetricsMap; slug: string }) {
  const copy = profile.starred
  const current = slug ? starred.find((repo) => repo.fullName === slug) : starred[0]
  return (
    <section className="site-frame starred-archive">
      <a className="back-link" href={homeHref()}><span aria-hidden="true">←</span> {profile.nav.home}</a>
      <div className="section-heading">
        <SectionHeader title={copy.title} count={starred.length} level={1} />
      </div>
      <nav className="repo-switcher reveal" aria-label={copy.switchLabel}>
        {starred.map((repo) => (
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
