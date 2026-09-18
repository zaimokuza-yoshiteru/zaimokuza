export interface RepoMetrics {
  stars: number
  forks: number
  openIssues: number
}

export type RepoMetricsMap = Record<string, RepoMetrics>

const CACHE_KEY = 'github-repo-metrics:v1'
const CACHE_TTL = 15 * 60 * 1000
// 匿名接口每小时只有 60 次额度，「开源作品」与「观测」共用这一份预算。
const MAX_REPOS = 12

interface MetricsCache {
  fetchedAt: number
  metrics: RepoMetricsMap
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function isRepoMetrics(value: unknown): value is RepoMetrics {
  return isRecord(value) && isCount(value.stars) && isCount(value.forks) && isCount(value.openIssues)
}

function readCache(): MetricsCache | undefined {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null')
    if (!isRecord(value) || typeof value.fetchedAt !== 'number' || !Number.isFinite(value.fetchedAt)
      || value.fetchedAt > Date.now() || !isRecord(value.metrics)
      || !Object.values(value.metrics).every(isRepoMetrics)) return
    return { fetchedAt: value.fetchedAt, metrics: value.metrics as RepoMetricsMap }
  } catch {
    // 隐私模式、存储被禁用或缓存损坏时，仍可直接请求公开 API。
    return
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
  const names = fullNames.slice(0, MAX_REPOS)
  const cache = readCache()
  if (cache) {
    onUpdate(cache.metrics)
    if (Date.now() - cache.fetchedAt < CACHE_TTL && names.every((name) => name in cache.metrics)) return
  }

  const metrics: RepoMetricsMap = {}
  for (const fullName of names) {
    try {
      const response = await fetch(`https://api.github.com/repos/${fullName}`, {
        signal, headers: { Accept: 'application/vnd.github+json' }, credentials: 'omit',
      })
      if (!response.ok) continue
      const repo: unknown = await response.json()
      if (!isRecord(repo)) continue
      const candidate = {
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        openIssues: repo.open_issues_count,
      }
      if (isRepoMetrics(candidate)) metrics[fullName] = candidate
    } catch (error) {
      if (signal.aborted) throw error
    }
  }

  // 全部失败说明多半是限流或离线，保留快照与旧缓存，避免把空结果写进缓存。
  if (signal.aborted || Object.keys(metrics).length === 0) return
  onUpdate(metrics)
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ fetchedAt: Date.now(), metrics }))
  } catch {
    // 缓存写入失败不会影响本次已获取的指标。
  }
}
