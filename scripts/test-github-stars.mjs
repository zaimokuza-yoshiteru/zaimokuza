import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { afterEach, beforeEach, test } from 'node:test'
import { transformWithEsbuild } from 'vite'

const source = await readFile(new URL('../src/lib/githubStars.ts', import.meta.url), 'utf8')
const { code } = await transformWithEsbuild(source, 'githubStars.ts', { loader: 'ts' })
const { refreshGithubStars } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
const originalFetch = globalThis.fetch
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
const key = 'github-stars:v1:example'
let storage
let updates
let calls

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
    return Response.json([{ name: 'project', stargazers_count: 7 }])
  }
})

afterEach(() => {
  globalThis.fetch = originalFetch
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage)
  else delete globalThis.localStorage
})

const refresh = (names = ['project'], signal = new AbortController().signal) =>
  refreshGithubStars('example', names, signal, (value) => updates.push(value))

test('公开 API 更新计数并缓存，浏览器请求不携带凭据', async () => {
  await refresh()
  assert.deepEqual(updates, [{ project: 7 }])
  assert.equal(calls.length, 1)
  assert.equal(calls[0].options.credentials, 'omit')
  assert.equal(calls[0].options.headers.Authorization, undefined)
  assert.deepEqual(JSON.parse(storage.get(key)).stars, { project: 7 })
})

test('15 分钟内使用缓存，不重复请求', async () => {
  storage.set(key, JSON.stringify({ fetchedAt: Date.now(), stars: { project: 4 } }))
  await refresh()
  assert.deepEqual(updates, [{ project: 4 }])
  assert.equal(calls.length, 0)
})

test('过期缓存先显示，刷新允许 Star 降为零', async () => {
  storage.set(key, JSON.stringify({ fetchedAt: Date.now() - 16 * 60_000, stars: { project: 4 } }))
  globalThis.fetch = async () => Response.json([{ name: 'project', stargazers_count: 0 }])
  await refresh()
  assert.deepEqual(updates, [{ project: 4 }, { project: 0 }])
})

test('限流和离线不会覆盖已有缓存', async () => {
  const cached = JSON.stringify({ fetchedAt: Date.now() - 16 * 60_000, stars: { project: 4 } })
  for (const status of [403, 429, 'offline']) {
    updates = []
    storage.set(key, cached)
    globalThis.fetch = async () => {
      if (status === 'offline') throw new TypeError('Failed to fetch')
      return new Response(null, { status })
    }
    await assert.rejects(refresh())
    assert.deepEqual(updates, [{ project: 4 }])
    assert.equal(storage.get(key), cached)
  }
})

test('缓存损坏或存储禁用时仍可获取数据', async () => {
  storage.set(key, '{broken')
  await refresh()
  assert.deepEqual(updates, [{ project: 7 }])
  updates = []
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true, get() { throw new Error('Storage disabled') },
  })
  await refresh()
  assert.deepEqual(updates, [{ project: 7 }])
})

test('分页覆盖超过 100 个仓库的账户，只缓存展示项目', async () => {
  globalThis.fetch = async (url) => {
    calls.push(url)
    return Response.json(url.endsWith('page=1')
      ? Array.from({ length: 100 }, (_, i) => ({ name: `other-${i}`, stargazers_count: 1 }))
      : [{ name: 'project', stargazers_count: 9 }])
  }
  await refresh()
  assert.equal(calls.length, 2)
  assert.deepEqual(updates, [{ project: 9 }])
})

test('新项目不被尚未过期的旧缓存遗漏', async () => {
  storage.set(key, JSON.stringify({ fetchedAt: Date.now(), stars: { old: 1 } }))
  await refresh(['old', 'project'])
  assert.equal(calls.length, 1)
  assert.deepEqual(updates, [{ old: 1 }, { project: 7 }])
})

test('无效响应和取消请求均不写入新计数', async () => {
  globalThis.fetch = async () => Response.json({ message: 'unexpected response' })
  await assert.rejects(refresh())
  assert.deepEqual(updates, [])
  globalThis.fetch = async () => Response.json([{ name: 'project', stargazers_count: -1 }])
  await refresh()
  assert.deepEqual(updates, [])
  globalThis.fetch = async () => Response.json([{ name: 'project', stargazers_count: 8 }])
  const controller = new AbortController()
  controller.abort()
  await refresh(['project'], controller.signal)
  assert.deepEqual(updates, [])
  assert.equal(storage.has(key), false)
})
