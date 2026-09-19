// 构建时共用的仓库指标采集：projects.json 与 starred.json 因此保持同一份字段结构，
// 页面上的「开源作品」卡片与「观测」详情可以共用同一个数据源。
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import { dirname } from 'node:path'
import type { RepoSnapshot } from '../../src/lib/repoSnapshot.ts'
import { parseRepoSnapshots } from '../../src/lib/repoSource.ts'

interface GitHubRepository {
  private: boolean
  full_name: string
  name: string
  owner?: { login: string; avatar_url?: string }
  html_url: string
  description?: string | null
  homepage?: string | null
  topics?: string[]
  license?: { spdx_id?: string } | null
  default_branch?: string
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  subscribers_count?: number
  size?: number
  created_at: string
  pushed_at: string
}
interface GitHubRelease {
  tag_name?: string
  name?: string | null
  published_at?: string | null
  prerelease?: boolean
}
interface GitHubContributor { login?: string; avatar_url?: string; contributions: number }
interface GitHubCommit { sha?: string; message?: string; author?: string; avatar_url?: string; name?: string; date?: string }

export const TOP_LANGUAGES = 5
export const MAX_WEEKS = 52
/** 贡献者按提交数取前 100 名作为样本，页面上会标注样本大小。 */
export const CONTRIBUTOR_SAMPLE = 100
export const RELEASE_SAMPLE = 100
export const COMMIT_SAMPLE = 12

export function gh(args: string[]): string {
  return execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 30_000 })
}

/** 同步等待：统计类接口首次请求会让 GitHub 现场计算，需要隔几秒重试。 */
function sleepSync(ms: number) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

/** 普通接口失败必须中止同步，不能把限流或断网当成合法的空数据。 */
export function readApi<T = unknown>(path: string, jq?: string, { allowNotFound = false } = {}): T | null {
  try {
    const args = ['api', path]
    if (jq) args.push('--jq', jq)
    // 发布列表这类响应体很容易超过 execFileSync 默认的 1MB 上限，直接放开。
    const out = execFileSync('gh', args, {
      encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 30_000, stdio: ['ignore', 'pipe', 'pipe'],
    })
    // 列表及统计接口的 204 没有正文，代表确实无数据。
    return (out.trim() ? JSON.parse(out) : []) as T
  } catch (error) {
    const details = error as { stderr?: unknown; code?: string }
    const status = String(details.stderr ?? '').match(/HTTP (\d{3})/)?.[1]
    if (allowNotFound && status === '404') return null
    // 只输出路径与状态，避免错误正文或签名 URL 被带进 Actions 日志。
    throw new Error(`GitHub API failed: ${path} (${status ?? (details.code === 'ETIMEDOUT' ? 'timeout' : 'network or invalid JSON')})`)
  }
}

/** 统计接口在仓库首次被访问时返回 202 + 空对象 `{}`，只有数组才算计算完成；放弃时明确告警，避免日历静默变空。 */
export function tryStatsApi<T = unknown>(path: string, attempts = 5, delayMs = 5000): T[] | null {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    let data
    try {
      data = readApi(path)
    } catch (error) {
      console.warn(error instanceof Error ? error.message : String(error))
      return null
    }
    if (Array.isArray(data)) return data as T[]
    if (attempt < attempts - 1) sleepSync(delayMs)
  }
  console.warn(`stats unavailable after ${attempts} attempts: ${path}`)
  return null
}

/** 结果只有一页时 GitHub 不返回 Link 头，此时按返回条数判断总数。 */
export function totalCount(path: string): number {
  const out = gh(['api', path, '-i'])
  const last = out.match(/[?&]page=(\d+)>;\s*rel="last"/)
  if (last) return Number(last[1])
  const separator = /\r?\n\r?\n/.exec(out)
  if (!separator) throw new Error(`missing API response headers: ${path}`)
  const body = out.slice(separator.index + separator[0].length).trim()
  const list = body ? JSON.parse(body) : []
  if (!Array.isArray(list)) throw new Error(`invalid count response: ${path}`)
  return list.length
}

/** 语言按字节降序取前几名；占比不足 0.05% 的语言只会显示成 0%，直接略去。 */
export function topLanguages(languages: Record<string, number>) {
  const total = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0)
  return Object.entries(languages)
    .filter(([, bytes]) => total > 0 && bytes / total >= 0.0005)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_LANGUAGES)
    .map(([name, bytes]) => ({ name, bytes }))
}

/** 优先取正式发布；只有预览版时退回最新一条并标记。 */
export function latestRelease(fullName: string): RepoSnapshot['release'] {
  const stable = readApi<GitHubRelease>(`repos/${fullName}/releases/latest`, undefined, { allowNotFound: true })
  const picked = stable ?? readApi<GitHubRelease[]>(`repos/${fullName}/releases?per_page=1`)?.[0]
  if (!picked) return null
  return {
    tag: picked.tag_name ?? '',
    publishedAt: picked.published_at ?? null,
    prerelease: Boolean(picked.prerelease),
  }
}

/**
 * 仓库刚创建时前面全是空周，按存活周数截断，曲线与贡献日历只覆盖真实存在的区间。
 * 保留每周的 `days`（周日在前），观测据此画出逐日热力图。
 */
export function activityWindow(fullName: string, createdAt: string, previous: RepoSnapshot['activity'] = []): RepoSnapshot['activity'] {
  const activity = tryStatsApi<RepoSnapshot['activity'][number]>(`repos/${fullName}/stats/commit_activity`)
  if (!Array.isArray(activity)) {
    console.warn(`keeping previous activity: ${fullName}`)
    return previous
  }
  const alive = Math.max(1, Math.ceil((Date.now() - Date.parse(createdAt)) / (7 * 24 * 3600 * 1000)))
  return activity.slice(-Math.min(MAX_WEEKS, alive)).map((week) => ({
    week: week.week,
    total: week.total,
    days: week.days,
  }))
}

/**
 * 提交节律：7×24 的提交直方图，扁平存放，下标是 星期 * 24 + 小时（星期 0 为周日）。
 * 这是 GitHub 的 punch card 统计，口径为默认分支上的提交时间（UTC）。
 */
export function punchCard(fullName: string, previous: number[] | null = null): number[] | null {
  const data = tryStatsApi<[number, number, number]>(`repos/${fullName}/stats/punch_card`)
  if (!Array.isArray(data)) {
    console.warn(`keeping previous punch card: ${fullName}`)
    return previous
  }
  const cells = new Array(7 * 24).fill(0)
  for (const [weekday, hour, count] of data) {
    if (Number.isInteger(weekday) && weekday >= 0 && weekday < 7 && Number.isInteger(hour) && hour >= 0 && hour < 24) {
      cells[weekday * 24 + hour] += Number(count) || 0
    }
  }
  return cells.some((count) => count > 0) ? cells : null
}

/** 贡献者按提交数降序取前 100 名，渲染时再决定展示多少以及一半提交落在第几人。 */
export function contributorList(fullName: string): RepoSnapshot['contributorList'] {
  const list = readApi<GitHubContributor[]>(`repos/${fullName}/contributors?per_page=${CONTRIBUTOR_SAMPLE}`)
  if (!Array.isArray(list)) throw new Error(`invalid contributors: ${fullName}`)
  const contributors = list
    .filter((entry) => entry && typeof entry.contributions === 'number')
    .map((entry) => ({
      login: entry.login ?? '',
      avatarUrl: entry.avatar_url ?? '',
      contributions: entry.contributions,
    }))
    .sort((a, b) => b.contributions - a.contributions)
  return contributors.length > 0 ? contributors : null
}

/** 最近若干次发布（含预览版），按发布时间倒序；中位间隔在渲染时算。 */
export function releaseList(fullName: string): RepoSnapshot['releases'] {
  // 只保留展示需要的字段，避免整段 release 正文进入仓库里的 JSON 快照。
  const list = readApi<GitHubRelease[]>(
    `repos/${fullName}/releases?per_page=${RELEASE_SAMPLE}`,
    '[.[] | {tag_name, name, published_at, prerelease}]',
  )
  if (!Array.isArray(list)) throw new Error(`invalid releases: ${fullName}`)
  const releases = list
    .filter((entry) => entry && entry.published_at)
    .map((entry) => ({
      tag: entry.tag_name ?? '',
      name: (entry.name ?? '').trim(),
      publishedAt: entry.published_at ?? '',
      prerelease: Boolean(entry.prerelease),
    }))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
  return releases.length > 0 ? releases : null
}

/** 默认分支上的最近提交，作者取提交者账号，未关联账号时退回提交里的署名。 */
export function recentCommits(fullName: string): RepoSnapshot['commitList'] {
  const list = readApi<GitHubCommit[]>(
    `repos/${fullName}/commits?per_page=${COMMIT_SAMPLE}`,
    '[.[] | {sha, message: .commit.message, author: .author.login, avatar_url: .author.avatar_url, name: .commit.author.name, date: .commit.author.date}]',
  )
  if (!Array.isArray(list)) throw new Error(`invalid commits: ${fullName}`)
  const commits = list.map((entry) => ({
    sha: (entry.sha ?? '').slice(0, 7),
    message: (entry.message ?? '').split('\n')[0].trim(),
    author: entry.author ?? entry.name ?? '',
    avatarUrl: entry.avatar_url ?? '',
    date: entry.date ?? '',
  }))
  return commits.length > 0 ? commits : null
}

/** 普通接口失败中止整次写入；统计仍在计算或不可用时沿用该仓库的旧样本。 */
export function collectRepo(fullName: string, previous?: Pick<RepoSnapshot, 'activity' | 'punchCard'>): RepoSnapshot {
  const repo = readApi<GitHubRepository>(`repos/${fullName}`)
  // 公共快照不能收录凭据恰好有权访问的私有仓库。
  if (!repo || repo.private !== false) throw new Error(`repository is not public: ${fullName}`)
  const allLanguages = readApi<Record<string, number>>(`repos/${fullName}/languages`)
  if (!allLanguages || Array.isArray(allLanguages) || typeof allLanguages !== 'object') {
    throw new Error(`invalid languages: ${fullName}`)
  }
  const releases = releaseList(fullName)
  return {
    fullName: repo.full_name,
    name: repo.name,
    owner: repo.owner?.login ?? fullName.split('/')[0],
    url: repo.html_url,
    avatarUrl: repo.owner?.avatar_url ?? '',
    description: repo.description ?? '',
    homepage: repo.homepage ?? '',
    topics: repo.topics ?? [],
    license: repo.license?.spdx_id && repo.license.spdx_id !== 'NOASSERTION' ? repo.license.spdx_id : '',
    defaultBranch: repo.default_branch ?? '',
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    openIssues: repo.open_issues_count,
    // watchers_count 是历史遗留的 Stars 别名，真正的订阅数在 subscribers_count。
    watchers: repo.subscribers_count ?? 0,
    contributors: totalCount(`repos/${fullName}/contributors?per_page=1&anon=1`),
    commits: totalCount(`repos/${fullName}/commits?per_page=1`),
    sizeKb: repo.size ?? 0,
    createdAt: repo.created_at,
    pushedAt: repo.pushed_at,
    languages: topLanguages(allLanguages),
    languageTotal: Object.values(allLanguages).reduce((sum, bytes) => sum + bytes, 0),
    release: latestRelease(fullName),
    // 只有存在发布时才多花一次请求去取总数。
    releaseCount: releases ? totalCount(`repos/${fullName}/releases?per_page=1`) : 0,
    releases,
    contributorList: contributorList(fullName),
    commitList: recentCommits(fullName),
    activity: activityWindow(fullName, repo.created_at, previous?.activity),
    punchCard: punchCard(fullName, previous?.punchCard),
  }
}

/** 统一缩进与结尾换行，保证生成的 JSON 有稳定的 diff。 */
export function writeJson(path: string, value: RepoSnapshot[]): void {
  validateSnapshot(value)
  fs.mkdirSync(dirname(path), { recursive: true })
  const temporary = `${path}.${process.pid}.tmp`
  try {
    fs.writeFileSync(temporary, JSON.stringify(value, null, 2) + '\n')
    fs.renameSync(temporary, path)
  } finally {
    fs.rmSync(temporary, { force: true })
  }
}

/** 按仓库名读取旧样本，避免统计接口暂时不可用时用空数据覆盖。 */
export function readPrevious(path: string): Map<string, RepoSnapshot> {
  if (!fs.existsSync(path)) return new Map()
  return new Map(validateSnapshot(JSON.parse(fs.readFileSync(path, 'utf8'))).map((repo) => [repo.fullName.toLowerCase(), repo]))
}

/** 采集端与浏览器共用运行时校验，外部 JSON 不能只靠类型断言。 */
export function validateSnapshot(value: unknown): RepoSnapshot[] {
  const parsed = parseRepoSnapshots(value)
  if (!parsed) throw new Error('invalid or empty repository snapshot')
  return parsed
}
