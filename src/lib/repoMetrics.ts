export interface RepoMetrics {
  stars: number
  forks: number
  openIssues: number
}

export type RepoMetricsMap = Record<string, RepoMetrics>

const CACHE_KEY = 'github-repo-metrics:v2'
const CACHE_TTL = 15 * 60 * 1000
// 匿名接口每小时只有 60 次额度，「开源作品」与「观测」共用这一份预算。
const MAX_REPOS = 12

interface MetricsCacheEntry {
  fetchedAt: number
  metrics: RepoMetrics
}

type MetricsCache = Record<string, MetricsCacheEntry>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function isRepoMetrics(value: unknown): value is RepoMetrics {
  return isRecord(value) && isCount(value.stars) && isCount(value.forks) && isCount(value.openIssues)
}

function readCache(): MetricsCache {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null')
    if (!isRecord(value)) return {}
    return Object.fromEntries(Object.entries(value).filter(([, entry]) =>
      isRecord(entry) && typeof entry.fetchedAt === 'number' && Number.isFinite(entry.fetchedAt)
      && entry.fetchedAt >= 0 && entry.fetchedAt <= Date.now() && isRepoMetrics(entry.metrics),
    )) as MetricsCache
  } catch {
    // 隐私模式、存储被禁用或缓存损坏时，仍可直接请求公开 API。
    return {}
  }
}

/**
 * 在访客浏览器中刷新展示仓库的 Stars、Forks 与 Issues；快照值先渲染，网络结果随后覆盖。
 * 单个仓库失败（改名、删除、限流）只跳过它自己，不影响其余仓库。
 */
export async function refreshRepoMetrics(
  fullNames: string[],
  signal: AbortSignal,
  onUpdate: (metrics: RepoMetricsMap) => void,
): Promise<void> {
  if (signal.aborted) return
  const names = [...new Set(fullNames)].slice(0, MAX_REPOS)
  if (names.length === 0) return
  const cache = readCache()
  const cached = Object.fromEntries(names.filter((name) => cache[name]).map((name) => [name, cache[name].metrics]))
  if (Object.keys(cached).length > 0) onUpdate(cached)

  const metrics: RepoMetricsMap = {}
  const refreshed: MetricsCache = {}
  for (const fullName of names) {
    if (signal.aborted) return
    // 每个仓库独立计时；切换首页和观测页不会清空另一页的缓存，也不会重复刷新新鲜条目。
    if (cache[fullName] && Date.now() - cache[fullName].fetchedAt < CACHE_TTL) continue
    try {
      const response = await fetch(`https://api.github.com/repos/${fullName}`, {
        signal, headers: { Accept: 'application/vnd.github+json' }, credentials: 'omit',
      })
      // 限流后继续请求只会消耗预算；保留本轮此前已经成功取得的结果。
      if (response.status === 403 || response.status === 429) break
      if (!response.ok) continue
      const repo: unknown = await response.json()
      if (!isRecord(repo)) continue
      const candidate = {
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        openIssues: repo.open_issues_count,
      }
      if (isRepoMetrics(candidate)) {
        metrics[fullName] = candidate
        refreshed[fullName] = { fetchedAt: Date.now(), metrics: candidate }
      }
    } catch (error) {
      if (signal.aborted) throw error
    }
  }

  // 全部失败说明多半是限流或离线，保留快照与旧缓存，避免把空结果写进缓存。
  if (signal.aborted || Object.keys(metrics).length === 0) return
  onUpdate(metrics)
  try {
    // 失败条目沿用原时间，不能因为另一仓库成功就被延长有效期。
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...readCache(), ...refreshed }))
  } catch {
    // 缓存写入失败不会影响本次已获取的指标。
  }
}
