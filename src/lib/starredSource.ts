import type { RepoSnapshot } from './repoSnapshot'

/**
 * 观测数据的规范地址。由 .github/workflows/refresh-starred.yml 每 12 小时刷新并提交，
 * 访客浏览器读到的因此比构建快照新；读取失败时静默退回构建快照。
 *
 * 指向 raw.githubusercontent.com 而不是本站路径：本站的文件只随部署更新，
 * 而这里要的正是「不重新部署也能拿到新数据」。
 */
export const STARRED_REMOTE_URL =
  'https://raw.githubusercontent.com/zaimokuza-yoshiteru/zaimokuza/main/src/data/starred.json'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isText(value: unknown): value is string {
  return typeof value === 'string'
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

/** 可选样本：null 表示采集失败，两种形态都合法，因此不能用 isCount 直接判断。 */
function isOptionalArray(value: unknown, check: (item: unknown) => boolean): boolean {
  return value === null || (Array.isArray(value) && value.every(check))
}

function isRelease(value: unknown): boolean {
  return isRecord(value)
    && isText(value.tag)
    && (value.publishedAt === null || isText(value.publishedAt))
    && typeof value.prerelease === 'boolean'
}

/** `week` 是该周周日的 Unix 秒，`days` 固定 7 天，与 repoActivity.ts 的口径一致。 */
function isActivityWeek(value: unknown): boolean {
  return isRecord(value) && isCount(value.week) && isCount(value.total)
    && Array.isArray(value.days) && value.days.length === 7 && value.days.every(isCount)
}

function isLanguage(value: unknown): boolean {
  return isRecord(value) && isText(value.name) && isCount(value.bytes)
}

function isContributor(value: unknown): boolean {
  return isRecord(value) && isText(value.login) && isText(value.avatarUrl) && isCount(value.contributions)
}

function isReleaseSample(value: unknown): boolean {
  return isRecord(value) && isText(value.tag) && isText(value.name)
    && (value.publishedAt === null || isText(value.publishedAt))
    && typeof value.prerelease === 'boolean'
}

function isCommit(value: unknown): boolean {
  return isRecord(value) && isText(value.sha) && isText(value.message)
    && isText(value.author) && isText(value.avatarUrl) && isText(value.date)
}

/**
 * 逐字段校验快照：缺字段或类型不符会让整份远端数据作废。
 * 校验宁可严一点——退回构建快照只是数据旧一些，渲染出 NaN 或空面板才是真的坏掉。
 * activity 允许为空数组：仓库建站不足一周时本来就没有整周数据。
 */
function isRepoSnapshot(value: unknown): value is RepoSnapshot {
  if (!isRecord(value)) return false
  return isText(value.fullName) && value.fullName.includes('/')
    && isText(value.name) && isText(value.owner) && isText(value.url)
    && isText(value.avatarUrl) && isText(value.description) && isText(value.homepage)
    && isText(value.license) && isText(value.defaultBranch)
    && isCount(value.stars) && isCount(value.forks) && isCount(value.openIssues)
    && isCount(value.watchers) && isCount(value.contributors) && isCount(value.commits)
    && isCount(value.sizeKb) && isCount(value.languageTotal) && isCount(value.releaseCount)
    && isText(value.createdAt) && isText(value.pushedAt)
    && Array.isArray(value.topics) && value.topics.every(isText)
    && Array.isArray(value.languages) && value.languages.every(isLanguage)
    && Array.isArray(value.activity) && value.activity.every(isActivityWeek)
    && (value.release === null || isRelease(value.release))
    && (value.punchCard === null || (Array.isArray(value.punchCard) && value.punchCard.every(isCount)))
    && isOptionalArray(value.releases, isReleaseSample)
    && isOptionalArray(value.contributorList, isContributor)
    && isOptionalArray(value.commitList, isCommit)
}

/** 远端数据必须是非空数组且每一项都通过校验，否则返回 null 交由调用方保留快照。 */
export function parseStarredSnapshot(payload: unknown): RepoSnapshot[] | null {
  if (!Array.isArray(payload) || payload.length === 0) return null
  return payload.every(isRepoSnapshot) ? (payload as RepoSnapshot[]) : null
}

/**
 * 拉取最新快照。网络错误、被墙、超时、非 200、格式不符都返回 null，
 * 因此调用方不需要区分失败原因，一律保留构建快照即可。
 */
export async function fetchStarredSnapshot(signal: AbortSignal): Promise<RepoSnapshot[] | null> {
  try {
    const response = await fetch(STARRED_REMOTE_URL, { signal, credentials: 'omit' })
    if (!response.ok) return null
    return parseStarredSnapshot(await response.json())
  } catch {
    return null
  }
}
