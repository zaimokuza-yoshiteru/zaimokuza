/**
 * 提交活动的纯计算：由构建时采集的逐周数据推导日历、连续天数与趋势。
 * 单独成文件是为了让 scripts/test-repo-metrics.mjs 能直接跑这些公式。
 */

/** 一周的提交活动。`week` 是该周周日的 Unix 秒，`days` 按周日 → 周六排列。 */
export interface ActivityWeek {
  week: number
  total: number
  days: number[]
}

export interface ActivityDay {
  /** YYYY-MM-DD（UTC），与 GitHub 的统计口径一致。 */
  date: string
  commits: number
}

export interface ActivityStats {
  /** 采集到的周数，也是日历的列数。 */
  weeks: number
  /** 这段区间内的提交总数。 */
  commits: number
  activeDays: number
  longestStreak: number
  currentStreak: number
  busiest: ActivityDay | null
  /** 区间内的日均提交数。 */
  perDay: number
  /** 区间内的周均提交数。 */
  perWeek: number
  /** 后半段相对前半段的变化百分比；前半段为 0 时无法比较，返回 null。 */
  trend: number | null
  days: ActivityDay[]
  weekTotals: number[]
}

const DAY_SECONDS = 86_400
const DAY_MS = DAY_SECONDS * 1000
const KB = 1024
/** 贡献日历固定 53 列，与 GitHub 的年度网格一致。 */
export const CALENDAR_WEEKS = 53

function isoDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toISOString().slice(0, 10)
}

/** 逐周展开成逐日序列，顺序即时间顺序。 */
export function activityDays(activity: ActivityWeek[]): ActivityDay[] {
  const days: ActivityDay[] = []
  for (const week of activity) {
    week.days.forEach((commits, index) => {
      days.push({ date: isoDate(week.week + index * DAY_SECONDS), commits })
    })
  }
  return days
}

function longestRun(days: ActivityDay[]): number {
  let best = 0
  let run = 0
  for (const day of days) {
    run = day.commits > 0 ? run + 1 : 0
    if (run > best) best = run
  }
  return best
}

/** 结尾处的连续提交天数；最近一天没有提交就算 0。 */
function currentRun(days: ActivityDay[]): number {
  let run = 0
  for (let index = days.length - 1; index >= 0 && days[index].commits > 0; index -= 1) run += 1
  return run
}

/** 前后各取一半比较，避免把单周的尖峰读成趋势。 */
function halfTrend(weekTotals: number[]): number | null {
  const half = Math.floor(weekTotals.length / 2)
  if (half < 2) return null
  const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length
  const first = mean(weekTotals.slice(0, half))
  if (first === 0) return null
  return Math.round(((mean(weekTotals.slice(weekTotals.length - half)) - first) / first) * 100)
}

export function activityStats(activity: ActivityWeek[]): ActivityStats {
  const days = activityDays(activity)
  const weekTotals = activity.map((week) => week.total)
  const commits = weekTotals.reduce((sum, total) => sum + total, 0)
  let busiest: ActivityDay | null = null
  for (const day of days) {
    if (day.commits > 0 && (!busiest || day.commits > busiest.commits)) busiest = day
  }
  return {
    weeks: activity.length,
    commits,
    activeDays: days.filter((day) => day.commits > 0).length,
    longestStreak: longestRun(days),
    currentStreak: currentRun(days),
    busiest,
    perDay: days.length > 0 ? commits / days.length : 0,
    perWeek: activity.length > 0 ? Math.round(commits / activity.length) : 0,
    trend: halfTrend(weekTotals),
    days,
    weekTotals,
  }
}

/**
 * 贡献日历是「最近 53 周」的时间轴，新仓库前面补空列，最新一周才能贴住右边缘。
 * 只影响展示：统计口径仍基于真实存在的周，补出来的空列不参与均值。
 */
export function alignWeeks(activity: ActivityWeek[], columns = CALENDAR_WEEKS): ActivityWeek[] {
  const padding = Math.max(0, columns - activity.length)
  if (padding === 0) return activity
  const first = activity[0]?.week ?? Math.floor(Date.now() / DAY_MS / 7) * 7 * DAY_SECONDS
  const lead: ActivityWeek[] = []
  for (let index = padding; index > 0; index -= 1) {
    lead.push({ week: first - index * 7 * DAY_SECONDS, total: 0, days: [0, 0, 0, 0, 0, 0, 0] })
  }
  return [...lead, ...activity]
}

/** 居中滑动平均，用来在柱状图上叠一条趋势线。 */
export function movingAverage(values: number[], window = 3): number[] {
  const radius = Math.floor(window / 2)
  return values.map((_, index) => {
    const from = Math.max(0, index - radius)
    const to = Math.min(values.length - 1, index + radius)
    let sum = 0
    for (let cursor = from; cursor <= to; cursor += 1) sum += values[cursor]
    return sum / (to - from + 1)
  })
}

/** 每周首日进入新月份时给该列一个标签，其余为 null。 */
export function monthLabels(activity: ActivityWeek[]): (string | null)[] {
  let previous = -1
  return activity.map((week) => {
    const month = new Date(week.week * 1000).getUTCMonth()
    if (month === previous) return null
    previous = month
    return `${month + 1}月`
  })
}

/** 体积按 KB / MB / GB 展示，与 GitHub 的语言统计口径一致。 */
export function formatBytes(bytes: number): string {
  const mb = bytes / (KB * KB)
  if (mb >= KB) return `${(mb / KB).toFixed(1)} GB`
  if (mb >= 1) return `${mb >= 100 ? Math.round(mb) : mb.toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / KB))} KB`
}

export function formatSize(kb: number): string {
  return formatBytes(kb * KB)
}

/** 与某个时间点相差的整天数；无法解析时返回 Infinity。 */
export function daysSince(iso: string, now = Date.now()): number {
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return Number.POSITIVE_INFINITY
  return Math.floor((now - then) / DAY_MS)
}

/** 提交节律的读数：高峰格、最安静的连续几小时、周末与工作时段占比。 */
export interface RhythmStats {
  /** 参与统计的提交数，punch card 的样本上限是 2 万。 */
  total: number
  /** 单格最大值，用来定热力色阶。 */
  peak: number
  peakWeekday: number
  peakHour: number
  /** 最安静的连续窗口，起点小时与窗口长度。 */
  quietFrom: number
  quietHours: number
  quietShare: number
  weekendShare: number
  workShare: number
}

const QUIET_HOURS = 6
/** 工作时间段：周一至周五 9 点到 18 点。 */
const WORK_FROM = 9
const WORK_TO = 18
/** 7×24 的直方图下标是 星期 * 24 + 小时，星期 0 为周日。 */
export const HOURS_PER_DAY = 24
export const DAYS_PER_WEEK = 7

function cellsOf(card: number[]): number[] {
  const size = DAYS_PER_WEEK * HOURS_PER_DAY
  return Array.from({ length: size }, (_, index) => card[index] ?? 0)
}

/**
 * 滑动比较每一段连续 6 小时，取提交最少的窗口。
 * 跨周末的深夜时段也能被选中，因此窗口是「环形」的。
 */
export function quietWindow(cells: number[], hours = QUIET_HOURS): { from: number; share: number } {
  const size = cells.length
  const total = cells.reduce((sum, value) => sum + value, 0)
  let bestFrom = 0
  let bestSum = Number.POSITIVE_INFINITY
  for (let from = 0; from < HOURS_PER_DAY; from += 1) {
    let sum = 0
    for (let hour = from; hour < from + hours; hour += 1) {
      for (let day = 0; day < DAYS_PER_WEEK; day += 1) sum += cells[(day * HOURS_PER_DAY + (hour % HOURS_PER_DAY)) % size]
    }
    if (sum < bestSum) {
      bestSum = sum
      bestFrom = from
    }
  }
  return { from: bestFrom, share: total > 0 ? bestSum / total : 0 }
}

export function rhythmStats(card: number[]): RhythmStats {
  const cells = cellsOf(card)
  const total = cells.reduce((sum, value) => sum + value, 0)
  let peak = 0
  let peakWeekday = 0
  let peakHour = 0
  cells.forEach((value, index) => {
    if (value > peak) {
      peak = value
      peakWeekday = Math.floor(index / HOURS_PER_DAY)
      peakHour = index % HOURS_PER_DAY
    }
  })
  const weekend = cells.reduce((sum, value, index) => {
    const day = Math.floor(index / HOURS_PER_DAY)
    return day === 0 || day === 6 ? sum + value : sum
  }, 0)
  const work = cells.reduce((sum, value, index) => {
    const day = Math.floor(index / HOURS_PER_DAY)
    const hour = index % HOURS_PER_DAY
    const weekday = day >= 1 && day <= 5
    return weekday && hour >= WORK_FROM && hour < WORK_TO ? sum + value : sum
  }, 0)
  const quiet = quietWindow(cells)
  return {
    total,
    peak,
    peakWeekday,
    peakHour,
    quietFrom: quiet.from,
    quietHours: QUIET_HOURS,
    quietShare: quiet.share,
    weekendShare: total > 0 ? weekend / total : 0,
    workShare: total > 0 ? work / total : 0,
  }
}

/** 相邻两次发布间隔的中位数（天）；发布少于两次时无法计算。 */
export function medianReleaseInterval(releases: { publishedAt: string }[]): number | null {
  if (releases.length < 2) return null
  const stamps = releases
    .map((release) => Date.parse(release.publishedAt))
    .filter((stamp) => !Number.isNaN(stamp))
    .sort((a, b) => a - b)
  if (stamps.length < 2) return null
  const gaps: number[] = []
  for (let index = 1; index < stamps.length; index += 1) gaps.push((stamps[index] - stamps[index - 1]) / DAY_MS)
  gaps.sort((a, b) => a - b)
  const middle = Math.floor(gaps.length / 2)
  return gaps.length % 2 === 1 ? gaps[middle] : (gaps[middle - 1] + gaps[middle]) / 2
}

/** 中位间隔转成人话：不到一天 / N 天 / N 周 / N 个月。 */
export function formatInterval(days: number): string {
  if (days < 1) return '不到 1 天'
  if (days < 14) return `${Math.round(days)} 天`
  if (days < 60) return `${Math.round(days / 7)} 周`
  return `${Math.round(days / 30)} 个月`
}

/**
 * 攒够一半提交需要多少人：按提交数降序累加，返回人数与前三人占比。
 * 这比「前 N 人」更能说明一个项目是靠少数人还是靠社区推动。
 */
export function contributorShare(contributors: { contributions: number }[]): {
  halfCount: number
  topThreeShare: number
  total: number
} {
  const sorted = [...contributors].sort((a, b) => b.contributions - a.contributions)
  const total = sorted.reduce((sum, entry) => sum + entry.contributions, 0)
  let running = 0
  let halfCount = 0
  for (const entry of sorted) {
    running += entry.contributions
    halfCount += 1
    if (running >= total / 2) break
  }
  const topThree = sorted.slice(0, 3).reduce((sum, entry) => sum + entry.contributions, 0)
  return { halfCount, topThreeShare: total > 0 ? topThree / total : 0, total }
}

/** 相对时间：刚刚 / N 分钟前 / N 小时前 / N 天前 / N 个月前 / N 年前。 */
export function relativeTime(iso: string, now = Date.now()): string {
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return ''
  const minutes = Math.floor((now - then) / 60_000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} 天前`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} 个月前`
  return `${Math.floor(months / 12)} 年前`
}

/** 大数按中文习惯缩写成「万」，万位以下补千位分隔符：20000 → 2.0万，6031 → 6,031。 */
export function formatCompact(value: number): string {
  if (value >= 10_000) return `${(value / 10_000).toFixed(1)}万`
  return value.toLocaleString('en-US')
}

/** 百分比统一保留一位小数，避免 0.0% 与 0% 混用。 */
export function formatShare(share: number): string {
  return `${(share * 100).toFixed(1)}%`
}

/**
 * 发布名与标签往往只是同一版本的两种写法（前缀不同、数字一致），
 * 数字完全相同说明没有新信息，返回空串表示不必重复展示。
 */
export function releaseTitle(tag: string, name: string | null | undefined): string {
  const label = (name ?? '').trim()
  if (!label) return ''
  const digits = (value: string) => value.replace(/\D/g, '')
  return digits(label) === digits(tag) ? '' : label
}
