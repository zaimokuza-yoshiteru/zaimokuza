import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  activityStats, movingAverage, monthLabels, formatBytes, formatSize, daysSince,
  alignWeeks, contributorShare, formatCompact, formatInterval, formatShare,
  medianReleaseInterval, quietWindow, relativeTime, releaseTitle, rhythmStats,
} from '../src/lib/repoActivity.ts'

const WEEK = 604_800
// 2026-01-04 是周日，正好是 GitHub 周窗口的起点。
const base = Date.UTC(2026, 0, 4) / 1000
const week = (offset: number, days: number[]) => ({ week: base + offset * WEEK, total: days.reduce((sum, n) => sum + n, 0), days })
const dates = (stats: ReturnType<typeof activityStats>) => stats.days.map((day) => day.date)

test('逐周展开成逐日，并统计总量、活跃天数与最忙的一天', () => {
  const stats = activityStats([
    week(0, [1, 0, 2, 0, 0, 3, 0]),
    week(1, [0, 0, 4, 0, 0, 0, 0]),
  ])
  assert.equal(stats.weeks, 2)
  assert.equal(stats.commits, 10)
  assert.equal(stats.activeDays, 4)
  assert.equal(stats.days.length, 14)
  assert.equal(dates(stats)[0], '2026-01-04')
  assert.equal(dates(stats)[13], '2026-01-17')
  assert.deepEqual(stats.weekTotals, [6, 4])
  assert.deepEqual(stats.busiest, { date: '2026-01-13', commits: 4 })
  assert.equal(stats.perWeek, 5)
  assert.equal(stats.perDay, 10 / 14)
})

test('连续提交天数分别统计历史最长与结尾一段', () => {
  const stats = activityStats([
    week(0, [1, 1, 1, 0, 2, 2, 2]),
    week(1, [0, 3, 3, 3, 3, 0, 0]),
  ])
  assert.equal(stats.longestStreak, 4)
  assert.equal(stats.currentStreak, 0)
  const trailing = activityStats([week(0, [0, 0, 0, 1, 1, 1, 1])])
  assert.equal(trailing.currentStreak, 4)
  assert.equal(trailing.longestStreak, 4)
})

test('趋势比较前后半段，周数不足或前半段为空时返回 null', () => {
  const rising = activityStats([
    week(0, [10, 0, 0, 0, 0, 0, 0]),
    week(1, [10, 0, 0, 0, 0, 0, 0]),
    week(2, [20, 0, 0, 0, 0, 0, 0]),
    week(3, [20, 0, 0, 0, 0, 0, 0]),
  ])
  assert.equal(rising.trend, 100)
  assert.equal(activityStats([week(0, [1, 0, 0, 0, 0, 0, 0])]).trend, null)
  assert.equal(activityStats([week(0, [0, 0, 0, 0, 0, 0, 0]), week(1, [5, 0, 0, 0, 0, 0, 0])]).trend, null)
})

test('空活动不会产生除零或假的连续天数', () => {
  const stats = activityStats([])
  assert.equal(stats.weeks, 0)
  assert.equal(stats.commits, 0)
  assert.equal(stats.perDay, 0)
  assert.equal(stats.perWeek, 0)
  assert.equal(stats.busiest, null)
  assert.equal(stats.currentStreak, 0)
  assert.equal(stats.longestStreak, 0)
})

test('滑动平均居中计算，两端按可用区间收敛', () => {
  assert.deepEqual(movingAverage([1, 2, 3, 4, 5]), [1.5, 2, 3, 4, 4.5])
  assert.deepEqual(movingAverage([4, 4, 4]), [4, 4, 4])
  assert.deepEqual(movingAverage([2], 5), [2])
  assert.deepEqual(movingAverage([]), [])
})

test('月份标签只落在每个月的第一周', () => {
  const weeks = [
    { week: Date.UTC(2025, 11, 28) / 1000, total: 0, days: [0, 0, 0, 0, 0, 0, 0] },
    { week: Date.UTC(2026, 0, 4) / 1000, total: 0, days: [0, 0, 0, 0, 0, 0, 0] },
    { week: Date.UTC(2026, 0, 11) / 1000, total: 0, days: [0, 0, 0, 0, 0, 0, 0] },
    { week: Date.UTC(2026, 1, 1) / 1000, total: 0, days: [0, 0, 0, 0, 0, 0, 0] },
  ]
  assert.deepEqual(monthLabels(weeks), ['12月', '1月', null, '2月'])
})

test('体积按 KB / MB / GB 取整，单位与 GitHub 一致', () => {
  assert.equal(formatBytes(900), '1 KB')
  assert.equal(formatBytes(1024), '1 KB')
  assert.equal(formatBytes(1024 ** 2), '1.0 MB')
  assert.equal(formatBytes(1536 * 1024), '1.5 MB')
  assert.equal(formatBytes(41 * 1024 * 1024), '41.0 MB')
  assert.equal(formatBytes(194 * 1024 * 1024), '194 MB')
  assert.equal(formatBytes(1024 ** 3), '1.0 GB')
  assert.equal(formatSize(206488), '202 MB')
})

test('最后推送按整天数换算，无法解析时给出无穷大', () => {
  const now = Date.UTC(2026, 0, 11, 12)
  assert.equal(daysSince('2026-01-11T06:00:00Z', now), 0)
  assert.equal(daysSince('2026-01-01T00:00:00Z', now), 10)
  // 时间戳在未来时给出负数，调用方按「今天」处理。
  assert.equal(daysSince('2026-01-12T12:00:00Z', now), -1)
  assert.equal(daysSince('', now), Number.POSITIVE_INFINITY)
})

test('补空列让最新一周贴住右边缘，统计口径不受影响', () => {
  const activity = [week(0, [1, 0, 0, 0, 0, 0, 0]), week(1, [2, 0, 0, 0, 0, 0, 0])]
  const aligned = alignWeeks(activity, 5)
  assert.equal(aligned.length, 5)
  assert.deepEqual(aligned.slice(0, 3).map((entry) => entry.total), [0, 0, 0])
  assert.deepEqual(aligned.slice(3).map((entry) => entry.total), [1, 2])
  // 补出来的空周必须紧邻真实数据的起点，步长是 7 天。
  assert.equal(aligned[2].week, base - WEEK)
  assert.equal(aligned[4].week, base + WEEK)
  assert.equal(activityStats(aligned).commits, 3)
  assert.equal(alignWeeks(activity, 2).length, 2)
  assert.deepEqual(alignWeeks([], 3).map((entry) => entry.total), [0, 0, 0])
})

// 下标是 星期 * 24 + 小时，星期 0 为周日。
const cell = (weekday: number, hour: number) => weekday * 24 + hour
const card = (entries: [number, number, number][]) => {
  const cells = new Array(168).fill(0)
  for (const [weekday, hour, count] of entries) cells[cell(weekday, hour)] = count
  return cells
}

test('节律读数定位高峰格、周末与工作时段占比', () => {
  const stats = rhythmStats(card([
    [2, 15, 40], // 周二 15:00，最高的一格
    [1, 10, 10], // 周一 10:00，落在工作时段
    [1, 20, 10], // 周一 20:00，工作时段之外
    [6, 12, 20], // 周六，算周末
    [0, 12, 20], // 周日，算周末
  ]))
  assert.equal(stats.total, 100)
  assert.equal(stats.peak, 40)
  assert.equal(stats.peakWeekday, 2)
  assert.equal(stats.peakHour, 15)
  assert.equal(stats.weekendShare, 0.4)
  assert.equal(stats.workShare, 0.5)
  assert.equal(stats.quietHours, 6)
})

test('最安静的窗口取连续六小时里提交最少的一段', () => {
  const cells = card([[3, 12, 100]])
  const quiet = quietWindow(cells)
  // 唯一有提交的小时是周四 12 点，安静窗口必须整体避开它。
  assert.equal(quiet.share, 0)
  assert.ok(!(quiet.from <= 12 && 12 < quiet.from + 6), `窗口 ${quiet.from} 覆盖了 12 点`)
  assert.equal(rhythmStats(cells).quietFrom, quiet.from)
  // 全空时按占比 0 处理，不会除零。
  assert.equal(quietWindow(new Array(168).fill(0)).share, 0)
})

test('中位间隔取相邻发布的中间值，发布不足两次时为 null', () => {
  const at = (day: number) => ({ publishedAt: new Date(Date.UTC(2026, 0, 1 + day)).toISOString() })
  // 间隔 1、2 天，偶数个取中间两个的平均。
  assert.equal(medianReleaseInterval([at(0), at(1), at(3)]), 1.5)
  // 间隔 2、2、6 天，奇数个取中间值。
  assert.equal(medianReleaseInterval([at(0), at(2), at(4), at(10)]), 2)
  assert.equal(medianReleaseInterval([at(0)]), null)
  assert.equal(medianReleaseInterval([]), null)
  assert.equal(formatInterval(0.4), '不到 1 天')
  assert.equal(formatInterval(3), '3 天')
  assert.equal(formatInterval(30), '4 周')
  assert.equal(formatInterval(120), '4 个月')
})

test('攒够一半提交需要的人数与前三人占比', () => {
  const share = contributorShare([
    { contributions: 40 }, { contributions: 30 }, { contributions: 20 }, { contributions: 10 },
  ])
  assert.equal(share.total, 100)
  assert.equal(share.halfCount, 2)
  assert.equal(share.topThreeShare, 0.9)
  assert.deepEqual(contributorShare([]), { halfCount: 0, topThreeShare: 0, total: 0 })
})

test('相对时间与万位缩写', () => {
  const now = Date.UTC(2026, 5, 15, 12)
  const ago = (ms: number) => new Date(now - ms).toISOString()
  assert.equal(relativeTime(ago(30_000), now), '刚刚')
  assert.equal(relativeTime(ago(5 * 60_000), now), '5 分钟前')
  assert.equal(relativeTime(ago(2 * 3_600_000), now), '2 小时前')
  assert.equal(relativeTime(ago(3 * 86_400_000), now), '3 天前')
  assert.equal(relativeTime(ago(60 * 86_400_000), now), '2 个月前')
  assert.equal(relativeTime(ago(400 * 86_400_000), now), '1 年前')
  assert.equal(relativeTime('', now), '')
  assert.equal(formatCompact(406), '406')
  assert.equal(formatCompact(6031), '6,031')
  assert.equal(formatCompact(20_000), '2.0万')
  assert.equal(formatShare(0.034), '3.4%')
})

test('发布名与标签数字一致时视为重复，只在有额外信息时展示', () => {
  // 前缀不同但版本数字相同，属于同一版本的另一种写法。
  assert.equal(releaseTitle('dsh-v0.1.6-alpha.2', 'v0.1.6-alpha.2'), '')
  assert.equal(releaseTitle('rust-v0.155.0', '0.155.0'), '')
  assert.equal(releaseTitle('v2026.7.33', 'openclaw 2026.7.33'), '')
  // 发布名里有另一套版本号，是真实信息，保留。
  assert.equal(releaseTitle('v2026.9.14', 'Hermes Agent v0.21.3 (v2026.9.14)'), 'Hermes Agent v0.21.3 (v2026.9.14)')
  // 没有发布名时返回空串，避免渲染出 undefined。
  assert.equal(releaseTitle('v1.0.0', null), '')
  assert.equal(releaseTitle('v1.0.0', '   '), '')
})
