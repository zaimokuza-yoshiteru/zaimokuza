import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { refreshRepositories } from './refresh-repos.ts'
import { validateSnapshot } from './lib/repo-metrics.ts'
import type { RepoSnapshot } from '../src/lib/repoSnapshot.ts'

const projects = validateSnapshot(JSON.parse(readFileSync(new URL('../src/data/projects.json', import.meta.url), 'utf8')))
const starred = validateSnapshot(JSON.parse(readFileSync(new URL('../src/data/starred.json', import.meta.url), 'utf8')))

test('两份快照都采集成功后一起写入，保留置顶顺序与完整字段', () => {
  const events: string[] = []
  const writes = new Map<string, RepoSnapshot[]>()
  refreshRepositories({
    projects: () => { events.push('projects'); return projects },
    starred: () => { events.push('starred'); return starred },
    write: (path, repos) => { events.push(path); writes.set(path, repos) },
  })
  assert.deepEqual(events, ['projects', 'starred', 'src/data/projects.json', 'src/data/starred.json'])
  assert.deepEqual(writes.get('src/data/projects.json'), projects)
  assert.deepEqual(writes.get('src/data/starred.json'), starred)
})

test('任一采集器失败时，不写入另一份已采集的数据', () => {
  for (const failure of ['projects', 'starred']) {
    const writes: string[] = []
    const fail = (): RepoSnapshot[] => { throw new Error('upstream failure') }
    assert.throws(() => refreshRepositories({
      projects: failure === 'projects' ? fail : () => projects,
      starred: failure === 'starred' ? fail : () => starred,
      write: (path) => { writes.push(path) },
    }), /upstream failure/)
    assert.deepEqual(writes, [])
  }
})

test('任一快照为空时保留整组旧文件，防止误清空页面', () => {
  for (const empty of ['projects', 'starred']) {
    let writes = 0
    assert.throws(() => refreshRepositories({
      projects: () => empty === 'projects' ? [] : projects,
      starred: () => empty === 'starred' ? [] : starred,
      write: () => { writes += 1 },
    }), /invalid or empty/)
    assert.equal(writes, 0)
  }
})

test('采集到非法字段时不能靠 TS 静态类型绕过运行时校验', () => {
  const invalid = structuredClone(starred)
  invalid[0].stars = -1
  let writes = 0
  assert.throws(() => refreshRepositories({
    projects: () => projects,
    starred: () => invalid,
    write: () => { writes += 1 },
  }), /invalid or empty/)
  assert.equal(writes, 0)
})
