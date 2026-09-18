import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { afterEach, beforeEach, test } from 'node:test'
import { transformWithEsbuild } from 'vite'

const source = await readFile(new URL('../src/lib/repoMetrics.ts', import.meta.url), 'utf8')
const { code } = await transformWithEsbuild(source, 'repoMetrics.ts', { loader: 'ts' })
const { refreshRepoMetrics } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
const originalFetch = globalThis.fetch
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
const key = 'github-repo-metrics:v1'
let storage
let updates
let calls

const repo = (overrides = {}) => ({
  stargazers_count: 7, forks_count: 3, open_issues_count: 2, ...overrides,
})

beforeEach(() => {
  storage = new Map()
  updates = []
  calls = []
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: (name) => storage.get(name) ?? null, setItem: (name, value) => storage.set(name, value) },
  })
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options })
    return Response.json(repo())
  }
})

afterEach(() => {
  globalThis.fetch = originalFetch
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage)
  else delete globalThis.localStorage
})

const refresh = (names = ['owner/repo'], signal = new AbortController().signal) =>
  refreshRepoMetrics(names, signal, (value) => updates.push(value))

test('逐个仓库请求公开 API，并缓存 Stars、Forks 与 Issues', async () => {
  await refresh(['owner/repo', 'other/repo'])
  assert.equal(calls.length, 2)
  assert.equal(calls[0].url, 'https://api.github.com/repos/owner/repo')
  assert.equal(calls[0].options.credentials, 'omit')
  assert.equal(calls[0].options.headers.Authorization, undefined)
  assert.deepEqual(updates, [{
    'owner/repo': { stars: 7, forks: 3, openIssues: 2 },
    'other/repo': { stars: 7, forks: 3, openIssues: 2 },
  }])
  assert.deepEqual(JSON.parse(storage.get(key)).metrics['owner/repo'], { stars: 7, forks: 3, openIssues: 2 })
})

test('15 分钟内使用缓存，不重复请求', async () => {
  storage.set(key, JSON.stringify({ fetchedAt: Date.now(), metrics: { 'owner/repo': { stars: 4, forks: 1, openIssues: 0 } } }))
  await refresh()
  assert.deepEqual(updates, [{ 'owner/repo': { stars: 4, forks: 1, openIssues: 0 } }])
  assert.equal(calls.length, 0)
})

test('过期缓存先显示，刷新允许计数下降', async () => {
  storage.set(key, JSON.stringify({ fetchedAt: Date.now() - 16 * 60_000, metrics: { 'owner/repo': { stars: 4, forks: 1, openIssues: 0 } } }))
  globalThis.fetch = async () => Response.json(repo({ stargazers_count: 0 }))
  await refresh()
  assert.deepEqual(updates, [
    { 'owner/repo': { stars: 4, forks: 1, openIssues: 0 } },
    { 'owner/repo': { stars: 0, forks: 3, openIssues: 2 } },
  ])
})

test('单个仓库失败不影响其余仓库，也不覆盖已有缓存', async () => {
  const cached = JSON.stringify({ fetchedAt: Date.now() - 16 * 60_000, metrics: { 'owner/repo': { stars: 4, forks: 1, openIssues: 0 } } })
  storage.set(key, cached)
  globalThis.fetch = async (url) => {
    calls.push({ url })
    if (url.endsWith('owner/repo')) return new Response(null, { status: 404 })
    if (url.endsWith('slow/repo')) throw new TypeError('Failed to fetch')
    return Response.json(repo({ stargazers_count: 9 }))
  }
  await refresh(['owner/repo', 'slow/repo', 'ok/repo'])
  assert.deepEqual(updates, [
    { 'owner/repo': { stars: 4, forks: 1, openIssues: 0 } },
    { 'ok/repo': { stars: 9, forks: 3, openIssues: 2 } },
  ])
  assert.deepEqual(JSON.parse(storage.get(key)).metrics, { 'ok/repo': { stars: 9, forks: 3, openIssues: 2 } })
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
