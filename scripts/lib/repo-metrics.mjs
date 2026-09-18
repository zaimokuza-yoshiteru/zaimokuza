// 构建时共用的仓库指标采集：projects.json 与 starred.json 因此保持同一份字段结构，
// 页面上的「开源作品」卡片与「观测」详情可以共用同一个数据源。
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

export const TOP_LANGUAGES = 5
export const MAX_WEEKS = 52
/** 贡献者按提交数取前 100 名作为样本，页面上会标注样本大小。 */
export const CONTRIBUTOR_SAMPLE = 100
export const RELEASE_SAMPLE = 100
export const COMMIT_SAMPLE = 12

export function gh(args) {
  return execFileSync('gh', args, { encoding: 'utf8' })
}

/** 同步等待：统计类接口首次请求会让 GitHub 现场计算，需要隔几秒重试。 */
function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

/** 取不到数据时返回 null，让调用方决定降级方式；stderr 静音以免 404 刷屏。 */
export function tryApi(path, jq) {
  try {
    const args = ['api', path]
    if (jq) args.push('--jq', jq)
    // 发布列表这类响应体很容易超过 execFileSync 默认的 1MB 上限，直接放开。
    return JSON.parse(execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }))
  } catch {
    return null
  }
}

/** 统计接口在仓库首次被访问时返回 202 + 空对象 `{}`，只有数组才算计算完成；放弃时明确告警，避免日历静默变空。 */
export function tryStatsApi(path, attempts = 5, delayMs = 5000) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const data = tryApi(path)
    if (Array.isArray(data)) return data
    if (attempt < attempts - 1) sleepSync(delayMs)
  }
  console.warn(`stats unavailable after ${attempts} attempts: ${path}`)
  return null
}

/** 结果只有一页时 GitHub 不返回 Link 头，此时按返回条数判断总数。 */
export function totalCount(path) {
  const out = gh(['api', path, '-i'])
  const last = out.match(/[?&]page=(\d+)>;\s*rel="last"/)
  if (last) return Number(last[1])
  const body = out.slice(out.search(/\r?\n\r?\n/) + 1).trim()
  return body && body !== '[]' ? 1 : 0
}

/** 语言按字节降序取前几名；占比不足 0.05% 的语言只会显示成 0%，直接略去。 */
export function topLanguages(languages) {
  const total = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0)
  return Object.entries(languages)
    .filter(([, bytes]) => total > 0 && bytes / total >= 0.0005)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_LANGUAGES)
    .map(([name, bytes]) => ({ name, bytes }))
}

/** 优先取正式发布；只有预览版时退回最新一条并标记。 */
export function latestRelease(fullName) {
  const stable = tryApi(`repos/${fullName}/releases/latest`)
  const picked = stable ?? (tryApi(`repos/${fullName}/releases?per_page=1`) ?? [])[0]
  if (!picked) return null
  return {
    tag: picked.tag_name,
    publishedAt: picked.published_at ?? null,
    prerelease: Boolean(picked.prerelease),
  }
}

/**
 * 仓库刚创建时前面全是空周，按存活周数截断，曲线与贡献日历只覆盖真实存在的区间。
 * 保留每周的 `days`（周日在前），观测据此画出逐日热力图。
 */
export function activityWindow(fullName, createdAt) {
  const activity = tryStatsApi(`repos/${fullName}/stats/commit_activity`)
  if (!Array.isArray(activity)) return []
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
export function punchCard(fullName) {
  const data = tryStatsApi(`repos/${fullName}/stats/punch_card`)
  if (!Array.isArray(data)) return null
  const cells = new Array(7 * 24).fill(0)
  for (const [weekday, hour, count] of data) {
    if (Number.isInteger(weekday) && weekday >= 0 && weekday < 7 && Number.isInteger(hour) && hour >= 0 && hour < 24) {
      cells[weekday * 24 + hour] += Number(count) || 0
    }
  }
  return cells.some((count) => count > 0) ? cells : null
}

/** 贡献者按提交数降序取前 100 名，渲染时再决定展示多少以及一半提交落在第几人。 */
export function contributorList(fullName) {
  const list = tryApi(`repos/${fullName}/contributors?per_page=${CONTRIBUTOR_SAMPLE}`)
  if (!Array.isArray(list)) return null
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
export function releaseList(fullName) {
  // 只保留展示需要的字段，避免整段 release 正文进入仓库里的 JSON 快照。
  const list = tryApi(
    `repos/${fullName}/releases?per_page=${RELEASE_SAMPLE}`,
    '[.[] | {tag_name, name, published_at, prerelease}]',
  )
  if (!Array.isArray(list)) return null
  const releases = list
    .filter((entry) => entry && entry.published_at)
    .map((entry) => ({
      tag: entry.tag_name ?? '',
      name: (entry.name ?? '').trim(),
      publishedAt: entry.published_at,
      prerelease: Boolean(entry.prerelease),
    }))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
  return releases.length > 0 ? releases : null
}

/** 默认分支上的最近提交，作者取提交者账号，未关联账号时退回提交里的署名。 */
export function recentCommits(fullName) {
  const list = tryApi(
    `repos/${fullName}/commits?per_page=${COMMIT_SAMPLE}`,
    '[.[] | {sha, message: .commit.message, author: .author.login, avatar_url: .author.avatar_url, name: .commit.author.name, date: .commit.author.date}]',
  )
  if (!Array.isArray(list)) return null
  const commits = list.map((entry) => ({
    sha: (entry.sha ?? '').slice(0, 7),
    message: (entry.message ?? '').split('\n')[0].trim(),
    author: entry.author ?? entry.name ?? '',
    avatarUrl: entry.avatar_url ?? '',
    date: entry.date ?? '',
  }))
  return commits.length > 0 ? commits : null
}

/** 采集单个仓库的全部展示字段；仓库不可用时返回 null。 */
export function collectRepo(fullName) {
  const repo = tryApi(`repos/${fullName}`)
  if (!repo) return null
  const allLanguages = tryApi(`repos/${fullName}/languages`) ?? {}
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
    activity: activityWindow(fullName, repo.created_at),
    punchCard: punchCard(fullName),
  }
}

/** 统一缩进与结尾换行，保证生成的 JSON 有稳定的 diff。 */
export function writeJson(path, value) {
  fs.mkdirSync('src/data', { recursive: true })
  fs.writeFileSync(path, JSON.stringify(value, null, 2) + '\n')
}
