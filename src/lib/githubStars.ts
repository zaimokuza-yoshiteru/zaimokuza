export type StarCounts = Record<string, number>

const CACHE_TTL = 15 * 60 * 1000

interface StarCache {
  fetchedAt: number
  stars: StarCounts
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStarCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function readCache(key: string): StarCache | undefined {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? 'null')
    if (!isRecord(value) || typeof value.fetchedAt !== 'number' || !Number.isFinite(value.fetchedAt)
      || value.fetchedAt > Date.now() || !isRecord(value.stars)
      || !Object.values(value.stars).every(isStarCount)) return
    return { fetchedAt: value.fetchedAt, stars: value.stars as StarCounts }
  } catch {
    // 隐私模式、存储被禁用或缓存损坏时，仍可直接请求公开 API。
    return
  }
}

/** 静态页面在访客浏览器中执行，不需要服务端或客户端令牌。 */
export async function refreshGithubStars(
  username: string,
  projectNames: string[],
  signal: AbortSignal,
  onUpdate: (stars: StarCounts) => void,
): Promise<void> {
  const cacheKey = `github-stars:v1:${username}`
  const cache = readCache(cacheKey)
  if (cache) {
    onUpdate(cache.stars)
    if (Date.now() - cache.fetchedAt < CACHE_TTL && projectNames.every((name) => name in cache.stars)) return
  }

  const stars: StarCounts = {}
  // 仓库列表一次最多返回 100 个；分页到已覆盖展示项目或到达列表末尾。
  for (let page = 1; page <= 10; page++) {
    const response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&type=owner&sort=full_name&page=${page}`,
      { signal, headers: { Accept: 'application/vnd.github+json' }, credentials: 'omit' },
    )
    if (!response.ok) throw new Error(`GitHub API: ${response.status}`)
    const repos: unknown = await response.json()
    if (!Array.isArray(repos)) throw new Error('Invalid GitHub response')
    for (const repo of repos) {
      if (isRecord(repo) && typeof repo.name === 'string' && projectNames.includes(repo.name)
        && isStarCount(repo.stargazers_count)) stars[repo.name] = repo.stargazers_count
    }
    if (repos.length < 100 || projectNames.every((name) => name in stars)) break
  }

  if (signal.aborted || Object.keys(stars).length === 0) return
  onUpdate(stars)
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ fetchedAt: Date.now(), stars }))
  } catch {
    // 缓存写入失败不会影响本次已获取的计数。
  }
}
