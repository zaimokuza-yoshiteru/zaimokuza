import type { RepoMetrics } from '../lib/repoMetrics'
import type { RepoSnapshot } from '../lib/repoSnapshot'
import RepoFacts, { ReleaseChip } from './RepoFacts'

export type RepoCardRepo = RepoSnapshot

interface RepoCardProps {
  repo: RepoSnapshot
  /** 卡片标题：作品区用仓库名。 */
  title: string
  description: string
  metrics: RepoMetrics
  delayMs: number
}

/** 「开源作品」的仓库卡片；整张卡片就是跳转链接，不再单独放置链接行。 */
export default function RepoCard({ repo, title, description, metrics, delayMs }: RepoCardProps) {
  return (
    <a
      href={repo.url}
      target="_blank"
      rel="noopener noreferrer"
      className="reveal project-row starred-card"
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      <div className="starred-head">
        <h3 className="break-words font-mono-num text-[17px] font-medium leading-[30px] tracking-tight">{title}</h3>
        {repo.release && <ReleaseChip release={repo.release} />}
      </div>
      <RepoFacts repo={repo} description={description} metrics={metrics} />
    </a>
  )
}
