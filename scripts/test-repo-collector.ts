import assert from 'node:assert/strict'
import childProcess from 'node:child_process'
import type { ExecFileSyncOptionsWithStringEncoding } from 'node:child_process'
import { syncBuiltinESMExports } from 'node:module'
import { afterEach, beforeEach, mock, test } from 'node:test'
import { activityWindow, collectRepo, latestRelease, punchCard, readApi, totalCount, tryStatsApi } from './lib/repo-metrics.ts'

let responses: Map<string, unknown>
let calls: string[]
const fullName = 'owner/repo'
const path = `repos/${fullName}`
const previous = {
  activity: [{ week: 1786233600, total: 3, days: [0, 1, 2, 0, 0, 0, 0] }],
  punchCard: Array.from({ length: 168 }, (_, i) => i === 0 ? 3 : 0),
}

function httpError(status: number) {
  return Object.assign(new Error('request failed'), { stderr: `gh: error (HTTP ${status})` })
}

beforeEach(() => {
  calls = []
  responses = new Map<string, unknown>([
    [path, {
      private: false, full_name: fullName, name: 'repo', owner: { login: 'owner' },
      html_url: 'https://github.com/owner/repo', stargazers_count: 7, forks_count: 2,
      open_issues_count: 1, created_at: '2026-01-01T00:00:00Z', pushed_at: '2026-09-01T00:00:00Z',
    }],
    [`${path}/languages`, { TypeScript: 10 }],
    [`${path}/releases?per_page=100`, []],
    [`${path}/releases/latest`, httpError(404)],
    [`${path}/releases?per_page=1`, []],
    [`${path}/contributors?per_page=1&anon=1`, []],
    [`${path}/commits?per_page=1`, []],
    [`${path}/contributors?per_page=100`, []],
    [`${path}/commits?per_page=12`, []],
    [`${path}/stats/commit_activity`, []],
    [`${path}/stats/punch_card`, []],
  ])
  mock.method(childProcess, 'execFileSync', (command: string, args: string[], options: ExecFileSyncOptionsWithStringEncoding) => {
    assert.equal(command, 'gh')
    assert.equal(options.timeout, 30_000)
    assert.equal(options.maxBuffer, 64 * 1024 * 1024)
    const endpoint = args[1]
    calls.push(endpoint)
    assert.ok(responses.has(endpoint), `unexpected endpoint: ${endpoint}`)
    const response = responses.get(endpoint)
    const value = typeof response === 'function' ? response() : response
    if (value instanceof Error) throw value
    const body = typeof value === 'string' ? value : JSON.stringify(value)
    return args.includes('-i') ? `HTTP/2.0 200 OK\r\n\r\n${body}` : body
  })
  syncBuiltinESMExports()
})

afterEach(() => {
  mock.restoreAll()
  syncBuiltinESMExports()
})

test('普通接口失败会中止整仓采集，不生成空语言或空发布数据', () => {
  for (const endpoint of [`${path}/languages`, `${path}/releases?per_page=100`, `${path}/contributors?per_page=100`, `${path}/commits?per_page=12`]) {
    const original = responses.get(endpoint)
    responses.set(endpoint, httpError(503))
    assert.throws(() => collectRepo(fullName, previous), /GitHub API failed/)
    responses.set(endpoint, original)
  }
})

test('统计接口失败保留旧样本，其余最新计数照常同步', () => {
  responses.set(`${path}/stats/commit_activity`, httpError(503))
  responses.set(`${path}/stats/punch_card`, httpError(403))
  const repo = collectRepo(fullName, previous)
  assert.deepEqual(repo.activity, previous.activity)
  assert.deepEqual(repo.punchCard, previous.punchCard)
  assert.equal(repo.stars, 7)
  assert.deepEqual(repo.languages, [{ name: 'TypeScript', bytes: 10 }])
})

test('成功返回空统计时使用空结果，不能永久黏住过时样本', () => {
  const repo = collectRepo(fullName, previous)
  assert.deepEqual(repo.activity, [])
  assert.equal(repo.punchCard, null)
})

test('首次采集没有旧样本时，统计失败使用约定的空状态', () => {
  responses.set(`${path}/stats/commit_activity`, httpError(503))
  responses.set(`${path}/stats/punch_card`, httpError(503))
  assert.deepEqual(activityWindow(fullName, '2026-01-01'), [])
  assert.equal(punchCard(fullName), null)
})

test('统计接口 202 的空对象重试后可恢复，不能当成零活动', () => {
  let attempts = 0
  responses.set(`${path}/stats/commit_activity`, () => ++attempts < 3 ? {} : previous.activity)
  assert.deepEqual(tryStatsApi(`${path}/stats/commit_activity`, 3, 0), previous.activity)
  assert.equal(attempts, 3)
})

test('统计重试次数有界，耗尽时明确返回不可用', () => {
  responses.set(`${path}/stats/commit_activity`, {})
  assert.equal(tryStatsApi(`${path}/stats/commit_activity`, 3, 0), null)
  assert.equal(calls.length, 3)
})

test('204 无正文是合法空列表', () => {
  responses.set(`${path}/stats/commit_activity`, '')
  assert.deepEqual(tryStatsApi(`${path}/stats/commit_activity`, 3, 0), [])
  assert.equal(calls.length, 1)
})

test('仅 latest release 的 404 允许回退，403 不能伪装成无发布', () => {
  responses.set(`${path}/releases?per_page=1`, [{ tag_name: 'v2-beta', published_at: null, prerelease: true }])
  assert.deepEqual(latestRelease(fullName), { tag: 'v2-beta', publishedAt: null, prerelease: true })
  responses.set(`${path}/releases/latest`, httpError(403))
  assert.throws(() => latestRelease(fullName), /403/)
  responses.set(`${path}/languages`, httpError(404))
  assert.throws(() => readApi(`${path}/languages`), /404/)
})

test('无分页 Link 的空列表按 JSON 解析，不受换行格式影响', () => {
  responses.set(`${path}/commits?per_page=1`, '[\n\n]')
  assert.equal(totalCount(`${path}/commits?per_page=1`), 0)
  responses.set(`${path}/commits?per_page=1`, [{ sha: 'abc' }])
  assert.equal(totalCount(`${path}/commits?per_page=1`), 1)
})

test('分页总数读取最后一页，兼容单行多个 Link', () => {
  mock.method(childProcess, 'execFileSync', () => 'HTTP/2.0 200 OK\r\nLink: <https://api.github.com/x?per_page=1&page=2>; rel="next", <https://api.github.com/x?per_page=1&page=42>; rel="last"\r\n\r\n[{}]')
  syncBuiltinESMExports()
  assert.equal(totalCount(`${path}/commits?per_page=1`), 42)
})

test('超时或无效 JSON 的日志不会包含响应正文', () => {
  responses.set(path, Object.assign(new Error('sensitive response'), { code: 'ETIMEDOUT' }))
  assert.throws(() => readApi(path), /\(timeout\)/)
  responses.set(path, '<html>upstream error</html>')
  assert.throws(() => readApi(path), /network or invalid JSON/)
})

test('私有仓库不会被写进公开快照', () => {
  responses.set(path, { private: true })
  assert.throws(() => collectRepo(fullName), /repository is not public/)
  assert.deepEqual(calls, [path])
})
