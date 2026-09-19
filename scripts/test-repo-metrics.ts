import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'

import { refreshRepoMetrics, type RepoMetricsMap } from '../src/lib/repoMetrics.ts'

const originalFetch = globalThis.fetch
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
const key = 'github-repo-metrics:v2'
let storage: Map<string, string>
let updates: RepoMetricsMap[]
let calls: { url: Parameters<typeof fetch>[0]; options?: RequestInit }[]

const repo = (overrides = {}) => ({
  stargazers_count: 7, forks_count: 3, open_issues_count: 2, ...overrides,
})

beforeEach(() => {
  storage = new Map()
  updates = []
  calls = []
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: (name: string) => storage.get(name) ?? null, setItem: (name: string, value: string) => storage.set(name, value) },
  })
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options })
    return Response.json(repo())
  }
})

afterEach(() => {
  globalThis.fetch = originalFetch
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage)
  else Reflect.deleteProperty(globalThis, 'localStorage')
})

const refresh = (names = ['owner/repo'], signal = new AbortController().signal) =>
  refreshRepoMetrics(names, signal, (value) => updates.push(value))

test('逐个仓库请求公开 API，并缓存 Stars、Forks 与 Issues', async () => {
  await refresh(['owner/repo', 'other/repo'])
  assert.equal(calls.length, 2)
  assert.equal(calls[0].url, 'https://api.github.com/repos/owner/repo')
  assert.equal(calls[0].options!.credentials, 'omit')
  assert.equal(new Headers(calls[0].options?.headers).get('Authorization'), null)
  assert.deepEqual(updates, [{
    'owner/repo': { stars: 7, forks: 3, openIssues: 2 },
    'other/repo': { stars: 7, forks: 3, openIssues: 2 },
  }])
  assert.deepEqual(JSON.parse(storage.get(key)!)['owner/repo'].metrics, { stars: 7, forks: 3, openIssues: 2 })
})

test('15 分钟内使用缓存，不重复请求', async () => {
  storage.set(key, JSON.stringify({ 'owner/repo': { fetchedAt: Date.now(), metrics: { stars: 4, forks: 1, openIssues: 0 } } }))
  await refresh()
  assert.deepEqual(updates, [{ 'owner/repo': { stars: 4, forks: 1, openIssues: 0 } }])
  assert.equal(calls.length, 0)
})

test('过期缓存先显示，刷新允许计数下降', async () => {
  storage.set(key, JSON.stringify({ 'owner/repo': { fetchedAt: Date.now() - 16 * 60_000, metrics: { stars: 4, forks: 1, openIssues: 0 } } }))
  globalThis.fetch = async () => Response.json(repo({ stargazers_count: 0 }))
  await refresh()
  assert.deepEqual(updates, [
    { 'owner/repo': { stars: 4, forks: 1, openIssues: 0 } },
    { 'owner/repo': { stars: 0, forks: 3, openIssues: 2 } },
  ])
})

test('单个仓库失败不影响其余仓库，也不覆盖已有缓存', async () => {
  const cached = JSON.stringify({ 'owner/repo': { fetchedAt: Date.now() - 16 * 60_000, metrics: { stars: 4, forks: 1, openIssues: 0 } } })
  storage.set(key, cached)
  globalThis.fetch = async (url) => {
    calls.push({ url })
    if (String(url).endsWith('owner/repo')) return new Response(null, { status: 404 })
    if (String(url).endsWith('slow/repo')) throw new TypeError('Failed to fetch')
    return Response.json(repo({ stargazers_count: 9 }))
  }
  await refresh(['owner/repo', 'slow/repo', 'ok/repo'])
  assert.deepEqual(updates, [
    { 'owner/repo': { stars: 4, forks: 1, openIssues: 0 } },
    { 'ok/repo': { stars: 9, forks: 3, openIssues: 2 } },
  ])
  const saved = JSON.parse(storage.get(key)!)
  assert.deepEqual(saved['owner/repo'], JSON.parse(cached)['owner/repo'])
  assert.deepEqual(saved['ok/repo'].metrics, { stars: 9, forks: 3, openIssues: 2 })
})

test('全部失败时不写入任何计数，保留快照', async () => {
  globalThis.fetch = async () => new Response(null, { status: 403 })
  await refresh(['owner/repo', 'other/repo'])
  assert.deepEqual(updates, [])
  assert.equal(storage.has(key), false)
})

test('缓存损坏或存储禁用时仍可获取数据', async () => {
  storage.set(key, '{broken')
  await refresh()
  assert.deepEqual(updates, [{ 'owner/repo': { stars: 7, forks: 3, openIssues: 2 } }])
  updates = []
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true, get() { throw new Error('Storage disabled') },
  })
  await refresh()
  assert.deepEqual(updates, [{ 'owner/repo': { stars: 7, forks: 3, openIssues: 2 } }])
})

test('无效响应不计入，请求数量受匿名额度限制', async () => {
  globalThis.fetch = async () => Response.json({ message: 'unexpected response' })
  await refresh()
  assert.deepEqual(updates, [])
  globalThis.fetch = async () => Response.json(repo({ stargazers_count: -1 }))
  await refresh()
  assert.deepEqual(updates, [])
  calls = []
  globalThis.fetch = async (url) => {
    calls.push({ url })
    return Response.json(repo())
  }
  await refresh(Array.from({ length: 20 }, (_, i) => `owner/repo-${i}`))
  assert.equal(calls.length, 12)
})

test('取消请求不写入新计数', async () => {
  const controller = new AbortController()
  controller.abort()
  await refresh(['owner/repo'], controller.signal)
  assert.deepEqual(updates, [])
  assert.equal(storage.has(key), false)
})

test('首页、观测页往返保留各自缓存，只请求缺少或过期的仓库', async () => {
  await refresh(['home/repo', 'shared/repo'])
  await refresh(['observatory/repo', 'shared/repo'])
  await refresh(['home/repo', 'shared/repo'])
  assert.deepEqual(calls.map((call) => call.url), [
    'https://api.github.com/repos/home/repo',
    'https://api.github.com/repos/shared/repo',
    'https://api.github.com/repos/observatory/repo',
  ])
  assert.equal(Object.keys(JSON.parse(storage.get(key)!)).length, 3)
})

test('同批新鲜与过期条目独立计时，失败不延长旧值有效期', async () => {
  const expiredAt = Date.now() - 16 * 60_000
  const freshAt = Date.now()
  storage.set(key, JSON.stringify({
    'fresh/repo': { fetchedAt: freshAt, metrics: { stars: 4, forks: 1, openIssues: 0 } },
    'stale/repo': { fetchedAt: expiredAt, metrics: { stars: 5, forks: 1, openIssues: 0 } },
  }))
  globalThis.fetch = async (url) => {
    calls.push({ url })
    return String(url).endsWith('stale/repo') ? new Response(null, { status: 500 }) : Response.json(repo())
  }
  await refresh(['fresh/repo', 'stale/repo', 'new/repo'])
  assert.equal(calls.length, 2)
  const saved = JSON.parse(storage.get(key)!)
  assert.equal(saved['fresh/repo'].fetchedAt, freshAt)
  assert.equal(saved['stale/repo'].fetchedAt, expiredAt)
  calls = []
  await refresh(['stale/repo'])
  assert.equal(calls.length, 1)
})

test('限流后停止剩余请求，已经成功的结果仍可缓存', async () => {
  for (const status of [403, 429]) {
    storage.clear()
    calls = []
    globalThis.fetch = async (url) => {
      calls.push({ url })
      return String(url).endsWith('ok/repo') ? Response.json(repo()) : new Response(null, { status })
    }
    await refresh(['ok/repo', 'limited/repo', 'later/repo'])
    assert.equal(calls.length, 2)
    assert.deepEqual(Object.keys(JSON.parse(storage.get(key)!)), ['ok/repo'])
  }
})

test('重复仓库只请求一次，空列表不发请求也不回放其他页面缓存', async () => {
  await refresh(['owner/repo', 'owner/repo'])
  assert.equal(calls.length, 1)
  calls = []
  updates = []
  await refresh([])
  assert.deepEqual(calls, [])
  assert.deepEqual(updates, [])
})
