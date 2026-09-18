import type { CSSProperties, ReactNode } from 'react'
import { profile } from '../data/profile'
import {
  activityDays, activityStats, alignWeeks, contributorShare, daysSince, formatBytes, formatCompact,
  formatInterval, formatShare, formatSize, medianReleaseInterval, monthLabels, movingAverage,
  relativeTime, releaseTitle as releaseLabel, rhythmStats,
} from '../lib/repoActivity'
import type { RepoMetrics } from '../lib/repoMetrics'
import type { RepoRelease, RepoSnapshot } from '../lib/repoSnapshot'
import { ReleaseChip } from './RepoFacts'
import { ExternalArrow } from './ExternalArrow'

const NUMBER = new Intl.NumberFormat('en-US')
/** 星期轴只给奇数行标签，与 GitHub 的稀疏排布一致。 */
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']
/** 语言条按索引递减不透明度，用单一墨色表达占比。 */
const SEGMENT_OPACITY = [1, 0.62, 0.38, 0.22, 0.12]
const HEAT_MAX = 4
/** 贡献者与发布列表都只展示前几条，完整样本留在快照里。 */
const CONTRIBUTOR_ROWS = 8
const RELEASE_ROWS = 8

const percent = (bytes: number, total: number) => (total > 0 ? Number(((bytes / total) * 100).toFixed(1)) : 0)
const hour = (value: number) => `${String(value).padStart(2, '0')}:00`

/** 四分位分档：只统计非零值，避免个别尖峰把其余格子全压进同一档。 */
function quartiles(values: number[]): number[] {
  const positive = values.filter((value) => value > 0).sort((a, b) => a - b)
  if (positive.length === 0) return []
  const at = (q: number) => positive[Math.min(positive.length - 1, Math.floor(q * positive.length))]
  return [...new Set([at(0.25), at(0.5), at(0.75)])]
}

/** 非零日的四分位数分档，避免个别尖峰把其余日子全压进同一档。 */
function heatThresholds(days: { commits: number }[]): number[] {
  return quartiles(days.map((day) => day.commits))
}

function heatLevel(commits: number, thresholds: number[]): number {
  if (commits <= 0) return 0
  return Math.min(HEAT_MAX, 1 + thresholds.filter((threshold) => commits >= threshold).length)
}

/** 最安静的窗口可能跨过午夜，拆成一到两段才能用网格列表达。 */
function quietSegments(from: number, hours: number): { start: number; span: number }[] {
  const end = from + hours
  if (end <= 24) return [{ start: from, span: hours }]
  return [{ start: from, span: 24 - from }, { start: 0, span: end - 24 }]
}

function homepageHost(homepage: string): string {
  try {
    return new URL(homepage).host.replace(/^www\./, '')
  } catch {
    return homepage
  }
}

/** 发布名与标签往往只是同一版本的两种写法（前缀不同、数字一致），数字相同就不再重复展示。 */
function releaseTitle(release: RepoRelease): string {
  return releaseLabel(release.tag, release.name)
}

/** 面板外壳：编号、标题与右上角的一句话说明。 */
function Panel({ index, title, note, children }: { index: number; title: string; note?: string; children: ReactNode }) {
  return (
    <section className="obs-panel reveal">
      <header className="obs-panel-head">
        <span className="obs-panel-index font-mono-num" aria-hidden="true">{String(index).padStart(2, '0')}</span>
        <h3 className="obs-panel-title">{title}</h3>
        {note && <p className="obs-panel-note font-mono-num">{note}</p>}
      </header>
      {children}
    </section>
  )
}

/**
 * 观测：顶部仓库概况 + 贡献日历 / 每周提交量 / 语言构成三块面板。
 * 所有数字都来自构建时快照，只有星标、分叉和未关闭 Issue 会被访客端刷新。
 */
export default function RepoObservatory({ repo, description, metrics }: {
  repo: RepoSnapshot
  description: string
  metrics: RepoMetrics
}) {
  const copy = profile.starred
  const stats = activityStats(repo.activity)
  const calendar = alignWeeks(repo.activity)
  const calendarDays = activityDays(calendar)
  const thresholds = heatThresholds(calendarDays)
  const months = monthLabels(calendar)
  const trend = movingAverage(stats.weekTotals)
  const peak = Math.max(1, ...stats.weekTotals)
  const linePoints = trend.map((value, index) => `${(((index + 0.5) / trend.length) * 100).toFixed(2)},${(100 - (value / peak) * 100).toFixed(2)}`).join(' ')
  const days = daysSince(repo.pushedAt)
  const pushed = days <= 0 ? copy.relative.today
    : days === 1 ? copy.relative.yesterday
      : days < 7 ? `${days} ${copy.relative.daysAgo}`
        : repo.pushedAt.slice(0, 10)
  const calendarNote = stats.weeks === 0 ? '' : [
    `${copy.calendar.rangeLabel} ${stats.weeks} ${copy.calendar.weeksUnit}`,
    `${NUMBER.format(stats.commits)} ${copy.calendar.commitsUnit}`,
    stats.busiest && `${copy.calendar.busiestLabel} ${stats.busiest.date}`,
  ].filter(Boolean).join(' · ')
  const weeklyNote = [
    `${copy.weekly.averageLabel} ${NUMBER.format(stats.perWeek)} ${copy.weekly.commitsUnit}`,
    stats.trend !== null && `${stats.trend >= 0 ? copy.weekly.upLabel : copy.weekly.downLabel} ${Math.abs(stats.trend)}%`,
  ].filter(Boolean).join(' · ')
  const tags = [
    repo.languages[0]?.name,
    repo.license,
    repo.sizeKb > 0 && formatSize(repo.sizeKb),
    `${copy.tags.built} ${repo.createdAt.slice(0, 10)}`,
  ].filter(Boolean) as string[]

  // 04 / 05 提交节律：punch card 的 7×24 直方图
  const rhythm = repo.punchCard ? rhythmStats(repo.punchCard) : null
  const rhythmThresholds = repo.punchCard ? quartiles(repo.punchCard) : []
  const quietBands = rhythm ? quietSegments(rhythm.quietFrom, rhythm.quietHours) : []
  const quietRange = rhythm
    ? `${hour(rhythm.quietFrom)}–${hour((rhythm.quietFrom + rhythm.quietHours) % 24)}`
    : ''
  const rhythmNote = rhythm ? `${NUMBER.format(rhythm.total)} ${copy.calendar.commitsUnit}` : ''

  // 06 贡献者
  const contributors = repo.contributorList ?? []
  const share = contributorShare(contributors)
  const contributorPeak = Math.max(1, ...contributors.map((entry) => entry.contributions))
  const contributorNote = contributors.length > 0
    ? [
      `${copy.contributors.headPrefix} ${share.halfCount} ${copy.contributors.headPeopleUnit}`,
      `${copy.contributors.headTopPrefix} ${formatShare(share.topThreeShare)}`,
    ].join(' · ')
    : undefined

  // 07 发布节奏
  const releases = repo.releases ?? []
  const releaseMedian = medianReleaseInterval(releases)
  const releaseNote = releases.length > 0
    ? [
      `${copy.releases.headPrefix} ${NUMBER.format(releases.length)} ${copy.releases.headVersionsUnit}`,
      releaseMedian !== null && `${copy.releases.headMedianPrefix} ${formatInterval(releaseMedian)}`,
    ].filter(Boolean).join(' · ')
    : undefined
  const releaseStamps = releases.map((release) => Date.parse(release.publishedAt)).filter((stamp) => !Number.isNaN(stamp))
  const releaseFirst = releaseStamps.length > 0 ? Math.min(...releaseStamps) : 0
  const releaseLast = releaseStamps.length > 0 ? Math.max(...releaseStamps) : 0
  const releaseSpan = Math.max(1, releaseLast - releaseFirst)
  /** 每个版本在时间轴上的位置（0–100%），只有一条时贴住右端。 */
  const releaseOffset = (stamp: number) => (releaseStamps.length > 1 ? ((stamp - releaseFirst) / releaseSpan) * 100 : 100)

  // 08 最近提交
  const commits = repo.commitList ?? []
  const commitsNote = commits.length > 0 ? `${copy.commits.headPrefix} ${relativeTime(commits[0].date)}` : undefined

  return (
    <div className="obs">
      <article className="obs-repo reveal">
        <div className="obs-repo-top">
          <span className="obs-avatar" aria-hidden="true">
            <span>{repo.name.slice(0, 1).toUpperCase()}</span>
            {repo.avatarUrl && (
              <img
                src={repo.avatarUrl}
                alt=""
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={(event) => { event.currentTarget.style.display = 'none' }}
              />
            )}
          </span>
          <div className="obs-repo-id">
            <h2 className="obs-repo-name">
              <span className="obs-owner">{repo.owner}</span>
              <span className="obs-slash" aria-hidden="true">/</span>
              <span>{repo.name}</span>
            </h2>
            {repo.release && <ReleaseChip release={repo.release} />}
          </div>
          <a className="obs-open" href={repo.url} target="_blank" rel="noopener noreferrer">
            {copy.openLabel}
            <ExternalArrow />
          </a>
        </div>
        <p className="obs-repo-desc">{description}</p>
        <div className="obs-tags font-mono-num">
          {tags.map((tag) => <span key={tag}>{tag}</span>)}
          {repo.homepage && (
            <a href={repo.homepage} target="_blank" rel="noopener noreferrer">
              {`${copy.tags.site} ${homepageHost(repo.homepage)}`}
              <ExternalArrow />
            </a>
          )}
          {repo.topics.slice(0, 8).map((topic) => <span key={topic} className="obs-topic">{topic}</span>)}
        </div>
        <ul className="obs-stats">
          <li>
            <b className="font-mono-num">{NUMBER.format(metrics.stars)}</b>
            <span>{`${copy.stats.stars} · ${copy.stats.perDay} ${stats.perDay.toFixed(1)}`}</span>
          </li>
          <li><b className="font-mono-num">{NUMBER.format(metrics.forks)}</b><span>{copy.stats.forks}</span></li>
          <li><b className="font-mono-num">{NUMBER.format(repo.watchers)}</b><span>{copy.stats.watchers}</span></li>
          <li><b className="font-mono-num">{NUMBER.format(metrics.openIssues)}</b><span>{copy.stats.issues}</span></li>
          <li><b className="font-mono-num">{NUMBER.format(repo.commits)}</b><span>{copy.stats.commits}</span></li>
          <li><b className="font-mono-num">{pushed}</b><span>{copy.stats.pushed}</span></li>
        </ul>
      </article>

      <Panel index={1} title={copy.panels.calendar} note={calendarNote}>
        {stats.weeks === 0 && <p className="obs-empty">{copy.calendar.empty}</p>}
        {stats.weeks > 0 && (
          <div className="obs-calendar-wrap">
            <div className="obs-calendar" style={{ '--obs-weeks': calendar.length } as CSSProperties}>
              {calendarDays.map((day, index) => (
                <span
                  key={day.date}
                  className="obs-cell"
                  data-level={heatLevel(day.commits, thresholds)}
                  style={{ gridColumn: Math.floor(index / 7) + 2, gridRow: (index % 7) + 2 }}
                  title={`${day.date} · ${day.commits} ${copy.calendar.commitsUnit}`}
                />
              ))}
              {WEEKDAYS.map((weekday, index) => (
                <span
                  key={weekday}
                  className="obs-weekday font-mono-num"
                  aria-hidden="true"
                  style={{ gridColumn: 1, gridRow: index + 2 }}
                >
                  {index % 2 === 1 ? weekday : ''}
                </span>
              ))}
              {months.map((label, index) => (
                <span
                  key={calendarDays[index * 7]?.date ?? index}
                  className="obs-month font-mono-num"
                  aria-hidden="true"
                  style={{ gridColumn: index + 2, gridRow: 1 }}
                >
                  {label ?? ''}
                </span>
              ))}
            </div>
            <p className="obs-foot font-mono-num">
              <span>{`${stats.activeDays} ${copy.calendar.activeDaysLabel}`}</span>
              <span>{`${copy.calendar.longestLabel} ${stats.longestStreak} ${copy.calendar.daysUnit}`}</span>
              {stats.currentStreak > 0 && <span>{`${copy.calendar.currentLabel} ${stats.currentStreak} ${copy.calendar.daysUnit}`}</span>}
              <span className="obs-legend" aria-hidden="true">
                {copy.calendar.lessLabel}
                {[0, 1, 2, 3, 4].map((level) => <i key={level} data-level={level} />)}
                {copy.calendar.moreLabel}
              </span>
            </p>
          </div>
        )}
      </Panel>

      <div className="obs-split">
        <Panel index={2} title={copy.panels.weekly} note={weeklyNote}>
          <div className="obs-bars">
            {stats.weekTotals.map((total, index) => (
              <span
                key={stats.days[index * 7]?.date ?? index}
                className="obs-bar"
                style={{ height: total > 0 ? `${Math.max(1.5, (total / peak) * 100)}%` : '0' }}
                title={`${stats.days[index * 7]?.date ?? ''} · ${NUMBER.format(total)} ${copy.weekly.commitsUnit}`}
              />
            ))}
            <svg className="obs-bars-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <polyline points={linePoints} vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
        </Panel>

        <Panel index={3} title={copy.panels.languages}>
          <div className="obs-lang-bar">
            {repo.languages.map((language, index) => (
              <span
                key={language.name}
                style={{ width: `${percent(language.bytes, repo.languageTotal)}%`, opacity: SEGMENT_OPACITY[index] }}
              />
            ))}
          </div>
          <ul className="obs-lang-list font-mono-num">
            {repo.languages.map((language, index) => (
              <li key={language.name}>
                <i aria-hidden="true" style={{ opacity: SEGMENT_OPACITY[index] }} />
                <span className="obs-lang-name">{language.name}</span>
                <span className="obs-lang-size">{formatBytes(language.bytes)}</span>
                <span className="obs-lang-percent">{`${percent(language.bytes, repo.languageTotal)}%`}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {rhythm && (
        <>
          <Panel index={4} title={copy.panels.rhythm} note={rhythmNote}>
            <div className="obs-rhythm-wrap">
              <div className="obs-rhythm">
                {quietBands.map((band) => (
                  <span
                    key={band.start}
                    className="obs-rhythm-band"
                    aria-hidden="true"
                    style={{ gridColumn: `${band.start + 2} / span ${band.span}`, gridRow: '2 / span 7' }}
                  />
                ))}
                {Array.from({ length: 24 }, (_, hourIndex) => (
                  <span
                    key={`h${hourIndex}`}
                    className="obs-rhythm-hour font-mono-num"
                    aria-hidden="true"
                    style={{ gridColumn: hourIndex + 2, gridRow: 1 }}
                  >
                    {hourIndex % 3 === 0 ? String(hourIndex).padStart(2, '0') : ''}
                  </span>
                ))}
                {copy.readings.weekdayNames.map((weekday, dayIndex) => (
                  <span
                    key={weekday}
                    className="obs-rhythm-day font-mono-num"
                    aria-hidden="true"
                    style={{ gridColumn: 1, gridRow: dayIndex + 2 }}
                  >
                    {weekday}
                  </span>
                ))}
                {repo.punchCard?.map((count, index) => (
                  <span
                    key={index}
                    className="obs-rhythm-cell"
                    data-level={heatLevel(count, rhythmThresholds)}
                    style={{ gridColumn: (index % 24) + 2, gridRow: Math.floor(index / 24) + 2 }}
                    title={`${copy.readings.weekdayNames[Math.floor(index / 24)]} ${hour(index % 24)} · ${NUMBER.format(count)} ${copy.calendar.commitsUnit}`}
                  />
                ))}
              </div>
              <p className="obs-foot font-mono-num">
                <span>{`${copy.rhythm.timezone}`}</span>
                <span>{`${copy.rhythm.quietPrefix} ${rhythm.quietHours} ${copy.rhythm.quietHoursUnit} ${quietRange}（${copy.rhythm.sharePrefix} ${formatShare(rhythm.quietShare)}）`}</span>
                <span className="obs-legend" aria-hidden="true">
                  {copy.calendar.lessLabel}
                  {[0, 1, 2, 3, 4].map((level) => <i key={level} data-level={level} />)}
                  {copy.calendar.moreLabel}
                </span>
              </p>
            </div>
          </Panel>

          <Panel index={5} title={copy.panels.readings} note={copy.rhythm.timezone}>
            <dl className="obs-readings">
              <div>
                <dt>{copy.readings.peakLabel}</dt>
                <dd>
                  <b className="font-mono-num">{`${NUMBER.format(rhythm.peak)} ${copy.readings.peakUnit}`}</b>
                  <span className="font-mono-num">{`${copy.readings.weekdayNames[rhythm.peakWeekday]} ${hour(rhythm.peakHour)}`}</span>
                </dd>
              </div>
              <div>
                <dt>{`${copy.readings.quietPrefix} ${rhythm.quietHours} ${copy.readings.quietHoursUnit}`}</dt>
                <dd>
                  <b className="font-mono-num">{`${copy.readings.quietSharePrefix} ${formatShare(rhythm.quietShare)}`}</b>
                  <span className="font-mono-num">{quietRange}</span>
                </dd>
              </div>
              <div>
                <dt>{copy.readings.weekendLabel}</dt>
                <dd>
                  <b className="font-mono-num">{formatShare(rhythm.weekendShare)}</b>
                  <span>{copy.readings.weekendValue}</span>
                </dd>
              </div>
              <div>
                <dt>{copy.readings.workLabel}</dt>
                <dd>
                  <b className="font-mono-num">{formatShare(rhythm.workShare)}</b>
                  <span>{copy.readings.workValue}</span>
                </dd>
              </div>
              <div>
                <dt>{copy.readings.sampleLabel}</dt>
                <dd>
                  <b className="font-mono-num">{`${formatCompact(rhythm.total)} ${copy.readings.sampleUnit}`}</b>
                  <span>{copy.readings.sampleValue}</span>
                </dd>
              </div>
            </dl>
          </Panel>
        </>
      )}

      <Panel index={6} title={copy.panels.contributors} note={contributorNote}>
        {contributors.length === 0
          ? <p className="obs-empty">{copy.contributors.empty}</p>
          : (
            <ol className="obs-contributors">
              {contributors.slice(0, CONTRIBUTOR_ROWS).map((entry, index) => (
                <li key={entry.login || index}>
                  <span className="obs-rank font-mono-num" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                  <span className="obs-contrib-avatar" aria-hidden="true">
                    {entry.avatarUrl && (
                      <img
                        src={entry.avatarUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        onError={(event) => { event.currentTarget.style.display = 'none' }}
                      />
                    )}
                  </span>
                  <span className="obs-contrib-name font-mono-num">{entry.login}</span>
                  <span className="obs-contrib-bar" aria-hidden="true">
                    <i style={{ width: `${(entry.contributions / contributorPeak) * 100}%` }} />
                  </span>
                  <span className="obs-contrib-count font-mono-num">{`${NUMBER.format(entry.contributions)} ${copy.contributors.commitsUnit}`}</span>
                  <span className="obs-contrib-share font-mono-num">{formatShare(entry.contributions / (share.total || 1))}</span>
                </li>
              ))}
            </ol>
          )}
      </Panel>

      <Panel index={7} title={copy.panels.releases} note={releaseNote}>
        {releases.length === 0
          ? <p className="obs-empty">{copy.releases.empty}</p>
          : (
            <>
              <div className="obs-release-track" aria-hidden="true">
                {releases.map((release, index) => (
                  <span
                    key={`${release.tag}-${index}`}
                    className="obs-release-tick"
                    data-prerelease={release.prerelease ? 'true' : undefined}
                    style={{ left: `${releaseOffset(Date.parse(release.publishedAt))}%` }}
                  />
                ))}
              </div>
              <ol className="obs-release-list">
                {releases.slice(0, RELEASE_ROWS).map((release, index) => (
                  <li key={`${release.tag}-${index}`}>
                    <span className="obs-release-tag font-mono-num">{release.tag}</span>
                    <span className="obs-release-name">
                      {releaseTitle(release)}
                      {release.prerelease && <em className="obs-release-flag font-mono-num">{copy.releases.prereleaseLabel}</em>}
                    </span>
                    <span className="obs-release-time font-mono-num">{relativeTime(release.publishedAt)}</span>
                  </li>
                ))}
              </ol>
            </>
          )}
      </Panel>

      <Panel
        index={8}
        title={`${copy.panels.commits} · ${repo.defaultBranch.toUpperCase()}`}
        note={commitsNote}
      >
        {commits.length === 0
          ? <p className="obs-empty">{copy.commits.empty}</p>
          : (
            <ol className="obs-commits">
              {commits.map((commit) => (
                <li key={commit.sha}>
                  <span className="obs-commit-avatar" aria-hidden="true">
                    {commit.avatarUrl && (
                      <img
                        src={commit.avatarUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        onError={(event) => { event.currentTarget.style.display = 'none' }}
                      />
                    )}
                  </span>
                  <a
                    className="obs-commit-sha font-mono-num"
                    href={`${repo.url}/commit/${commit.sha}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {commit.sha}
                  </a>
                  <span className="obs-commit-subject">{commit.message}</span>
                  <span className="obs-commit-author font-mono-num">{commit.author}</span>
                  <span className="obs-commit-time font-mono-num">{relativeTime(commit.date)}</span>
                </li>
              ))}
            </ol>
          )}
      </Panel>
    </div>
  )
}
