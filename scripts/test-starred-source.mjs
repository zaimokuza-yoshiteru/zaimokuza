import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { afterEach, beforeEach, test } from 'node:test'
import { transformWithEsbuild } from 'vite'

const source = await readFile(new URL('../src/lib/starredSource.ts', import.meta.url), 'utf8')
const { code } = await transformWithEsbuild(source, 'starredSource.ts', { loader: 'ts' })
const { STARRED_REMOTE_URL, fetchStarredSnapshot, parseStarredSnapshot } =
  await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)

const real = JSON.parse(await readFile(new URL('../src/data/starred.json', import.meta.url), 'utf8'))
const originalFetch = globalThis.fetch
let calls
let respond

/** 取真实数据的一条作样板，改一个字段就能精确地只破坏那一处。 */
const sample = (overrides = {}) => ({ ...real[0], ...overrides })

beforeEach(() => {
  calls = []
  respond = async () => Response.json(real)
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options })
    return respond()
  }
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

test('提交在仓库里的真实快照必须通过校验', () => {
  // 这条是防呆的关键：校验器写得过严会让远端数据永远被丢弃，
  // 而且失败是静默的（只是数据不变新），所以必须用真实数据把边界钉住。
  const parsed = parseStarredSnapshot(real)
  assert.notEqual(parsed, null)
  assert.equal(parsed.length, real.length)
})

test('activity 允许为空数组：建站不足一周的仓库本来就没有整周数据', () => {
  assert.ok(real.some((repo) => repo.activity.length === 0), '样例数据里应有一个 activity 为空的仓库')
  assert.notEqual(parseStarredSnapshot([sample({ activity: [] })]), null)
})

test('可选样本为 null 时仍然合法', () => {
  const parsed = parseStarredSnapshot([sample({
    release: null, punchCard: null, releases: null, contributorList: null, commitList: null,
  })])
  assert.notEqual(parsed, null)
})

test('非数组、空数组与非法条目一律作废', () => {
  assert.equal(parseStarredSnapshot(null), null)
  assert.equal(parseStarredSnapshot({}), null)
  assert.equal(parseStarredSnapshot([]), null)
  assert.equal(parseStarredSnapshot([real[0], null]), null)
})

test('顶层字段缺失或类型不符时作废', () => {
  const broken = {
    '缺少 fullName': sample({ fullName: undefined }),
    'fullName 不含斜杠': sample({ fullName: 'codex' }),
    'stars 是字符串': sample({ stars: '1' }),
    'stars 为负': sample({ stars: -1 }),
    'stars 是小数': sample({ stars: 1.5 }),
    'contributors 缺失': sample({ contributors: undefined }),
    'license 变成 null': sample({ license: null }),
    'topics 混入数字': sample({ topics: ['a', 1] }),
    'pushedAt 变成数字': sample({ pushedAt: 0 }),
  }
  for (const [label, value] of Object.entries(broken)) {
    assert.equal(parseStarredSnapshot([value]), null, label)
  }
})

test('嵌套结构不合格时作废，避免渲染出 NaN', () => {
  const broken = {
    'activity 天数不是 7': sample({ activity: [{ week: 1786233600, total: 3, days: [1, 2, 3] }] }),
    'activity 的 week 是字符串': sample({ activity: [{ week: '1786233600', total: 3, days: [0, 0, 0, 0, 0, 0, 0] }] }),
    'activity 缺 total': sample({ activity: [{ week: 1786233600, days: [0, 0, 0, 0, 0, 0, 0] }] }),
    'languages 缺 bytes': sample({ languages: [{ name: 'Go' }] }),
    'contributions 是字符串': sample({ contributorList: [{ login: 'a', avatarUrl: 'u', contributions: '3' }] }),
    'commit 缺 sha': sample({ commitList: [{ message: 'm', author: 'a', avatarUrl: 'u', date: 'd' }] }),
    'release 缺 prerelease': sample({ release: { tag: 'v1', publishedAt: null } }),
    'releaseSample 缺 name': sample({ releases: [{ tag: 'v1', publishedAt: null, prerelease: false }] }),
    'punchCard 混入 null': sample({ punchCard: [1, null] }),
  }
  for (const [label, value] of Object.entries(broken)) {
    assert.equal(parseStarredSnapshot([value]), null, label)
  }
})

test('成功时按规范地址取数据，且不携带凭据', async () => {
  const parsed = await fetchStarredSnapshot(new AbortController().signal)
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, STARRED_REMOTE_URL)
  assert.equal(calls[0].options.credentials, 'omit')
  assert.equal(parsed.length, real.length)
})

test('非 200、网络错误与格式不符都返回 null，交由调用方保留快照', async () => {
  respond = async () => new Response('nope', { status: 404 })
  assert.equal(await fetchStarredSnapshot(new AbortController().signal), null)

  respond = async () => { throw new TypeError('fetch failed') }
  assert.equal(await fetchStarredSnapshot(new AbortController().signal), null)

  respond = async () => new Response('<html>rate limited</html>', { status: 200 })
  assert.equal(await fetchStarredSnapshot(new AbortController().signal), null)

  respond = async () => Response.json([])
  assert.equal(await fetchStarredSnapshot(new AbortController().signal), null)
})

test('超时中止同样返回 null，不会抛出', async () => {
  const controller = new AbortController()
  respond = async () => {
    controller.abort()
    throw new DOMException('aborted', 'AbortError')
  }
  assert.equal(await fetchStarredSnapshot(controller.signal), null)
})
