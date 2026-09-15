import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = new URL('../', import.meta.url)
const article = readFileSync(new URL('src/data/articles/context-management.md', root), 'utf8')
const examples = new URL('src/data/articles/examples/', root)
const expected = [
  { roles: ['system', 'user', 'user'] },
  { kept: ['t3'] },
  { attempts: [70, 35] },
  { source_ids: ['t1'], kept: 't2' },
  { recovered_version: 1 },
  { ids: ['t2'], original: 'database connection timeout after 30 seconds' },
  { delete_candidates: ['old'] },
  { fresh: 1, fork: 2, tools: ['read'] },
  { preview_length: 32, kinds: ['text', 'image'] },
]

test('九题均有七框架对照、源码引用和双语最小实现', () => {
  const sections = article.split(/^## /m).slice(1, 10)
  assert.equal(sections.length, 9)
  sections.forEach((section, index) => {
    assert.match(section, new RegExp(`^0${index + 1}\\.`))
    for (const framework of ['DSH', 'deer-flow', 'OpenClaw', 'Codex', 'Claude Code', 'pi', 'Hermes Agent']) {
      assert.ok(section.includes(`| ${framework} |`), `${index + 1}: ${framework}`)
    }
    assert.ok(section.includes('**源码引用'))
    assert.ok(section.includes(`\`\`\`example\nq0${index + 1}\n\`\`\``))
  })
  assert.ok(!article.includes('{{quote:'))
  assert.equal(readdirSync(examples).filter(name => /\.(py|ts)$/.test(name)).length, 20)
})

for (let index = 0; index < 9; index++) {
  test(`Q${index + 1} Python / TS 独立运行、断言通过且输出一致`, () => {
    const name = `q0${index + 1}`
    const results = [['python3', 'py'], [process.execPath, 'ts']].map(([command, extension]) => {
      const result = spawnSync(command, [fileURLToPath(new URL(`${name}.${extension}`, examples))], { encoding: 'utf8', timeout: 10000 })
      assert.equal(result.status, 0, result.stderr || result.error?.message)
      return JSON.parse(result.stdout.trim())
    })
    assert.deepEqual(results[0], expected[index])
    assert.deepEqual(results[1], expected[index])
  })
}

test('引用与原文核验清单一致，链接固定提交且没有行号锚点', () => {
  const sources = JSON.parse(readFileSync(new URL('src/data/articles/context-management.sources.json', root), 'utf8'))
  assert.equal(Object.keys(sources).length, 10)
  for (const source of Object.values(sources)) {
    assert.ok(article.includes(source.code))
    assert.match(source.url, /^https:\/\/github\.com\/[^/]+\/[^/]+\/blob\/[0-9a-f]{40}\//)
    assert.ok(!source.url.includes('#L'))
  }
})

test('缓存示例区分共同前缀、开头变化、最小门槛与后续追加', () => {
  const expectedCache = { eligible_prefix: 8192, input_tokens: 11264, changed_prefix: 0, short_prefix: 0, next_eligible: 11264 }
  for (const [command, extension] of [['python3', 'py'], [process.execPath, 'ts']]) {
    const result = spawnSync(command, [fileURLToPath(new URL(`q04-cache.${extension}`, examples))], { encoding: 'utf8', timeout: 10000 })
    assert.equal(result.status, 0, result.stderr || result.error?.message)
    assert.deepEqual(JSON.parse(result.stdout.trim()), expectedCache)
  }
})

test('五张草图都具有实际文件与无障碍标题', () => {
  const paths = Array.from(article.matchAll(/!\[[^\]]+\]\((blog\/[^)]+\.svg)\)/g), match => match[1])
  assert.equal(paths.length, 5)
  for (const path of paths) assert.match(readFileSync(new URL(`public/${path}`, root), 'utf8'), /<title>[^<]+<\/title>/)
})
