import { profile } from '../data/profile'
import type { RepoMetrics } from '../lib/repoMetrics'
import type { RepoSnapshot } from '../lib/repoSnapshot'

const NUMBER = new Intl.NumberFormat('en-US')
// 语言条按索引递减不透明度，用单一墨色表达占比，避免引入与页面无关的彩色。
const SEGMENT_OPACITY = [1, 0.62, 0.38, 0.22, 0.12]

/** 提交活动的折线：x 轴按周均分，y 轴归一到峰值。 */
function Sparkline({ weeks }: { weeks: number[] }) {
  // 只有一周时没有趋势可画，但仍保留同样的高度，让上方说明文字在各卡片间对齐。
  if (weeks.length < 2) return <svg className="starred-spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true" />
  const peak = Math.max(...weeks, 1)
  const step = 100 / (weeks.length - 1)
  const points = weeks.map((total, i) => [i * step, 28 - (total / peak) * 25] as const)
  const line = points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
  return (
    <svg className="starred-spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">
      <polygon className="starred-spark-area" points={`0,30 ${line} 100,30`} />
      <polyline className="starred-spark-line" points={line} />
    </svg>
  )
}

function percent(bytes: number, total: number) {
  return Number(((bytes / total) * 100).toFixed(1))
}

/** 最新版本标签，卡片和观测详情共用；首页卡片只给版本号，不缀预览标记。 */
export function ReleaseChip({ release, showPrerelease = true }: {
  release: NonNullable<RepoSnapshot['release']>
  showPrerelease?: boolean
}) {
  const copy = profile.repoUI
  return (
    <span className="starred-release font-mono-num" aria-label={`${copy.releaseLabel} ${release.tag}`}>
      {release.tag}
      {showPrerelease && release.prerelease && <span className="starred-release-pre">{copy.prereleaseLabel}</span>}
    </span>
  )
}

/**
 * 仓库卡片正文：描述、提交活动、语言构成与规模指标。
 * 「开源作品」的两列卡片共用这份 DOM，外观差异全部交给外层容器。
 */
export default function RepoFacts({ repo, description, metrics }: {
  repo: RepoSnapshot
  description: string
  metrics: RepoMetrics
}) {
  const copy = profile.repoUI
  const weeks = repo.activity.map((week) => week.total)
  return (
    <>
      <p className="project-description text-[14px] leading-[26px] text-text-secondary">{description}</p>
      {weeks.length > 0 && (
        <div className="starred-activity">
          <div className="starred-caption font-mono-num">
            <span>{`${copy.nearLabel} ${weeks.length} ${copy.weeksUnit}${copy.activityLabel}`}</span>
            <span>{`${copy.commitsLabel} ${NUMBER.format(repo.commits)}`}</span>
          </div>
          <Sparkline weeks={weeks} />
        </div>
      )}
      {repo.languages.length > 0 && (
        <div className="starred-langs">
          <div className="starred-lang-bar">
            {repo.languages.map((lang, index) => (
              <span
                key={lang.name}
                style={{ width: `${percent(lang.bytes, repo.languageTotal)}%`, opacity: SEGMENT_OPACITY[index] }}
              />
            ))}
          </div>
          <div className="starred-lang-legend font-mono-num">
            {repo.languages.slice(0, 3).map((lang, index) => (
              <span key={lang.name}>
                <i style={{ opacity: SEGMENT_OPACITY[index] }} aria-hidden="true" />
                {`${lang.name} ${percent(lang.bytes, repo.languageTotal)}%`}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="starred-metrics font-mono-num">
        <span aria-label={`${NUMBER.format(metrics.stars)} GitHub Stars`}>{`★ ${NUMBER.format(metrics.stars)}`}</span>
        <span aria-label={`${NUMBER.format(metrics.forks)} GitHub Forks`}>{`${copy.forksLabel} ${NUMBER.format(metrics.forks)}`}</span>
        <span aria-label={`${NUMBER.format(metrics.openIssues)} open issues`}>{`${copy.issuesLabel} ${NUMBER.format(metrics.openIssues)}`}</span>
        <span>{`${copy.contributorsLabel} ${NUMBER.format(repo.contributors)}`}</span>
      </div>
    </>
  )
}
