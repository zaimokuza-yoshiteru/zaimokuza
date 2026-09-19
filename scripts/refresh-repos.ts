import { collectProjects } from './fetch-github.ts'
import { collectStarred } from './fetch-github-starred.ts'
import { validateSnapshot, writeJson } from './lib/repo-metrics.ts'

/** 两份数据全部采集、校验成功后才写入，workflow 只提交这一组完整快照。 */
export function refreshRepositories({ projects = collectProjects, starred = collectStarred, write = writeJson } = {}) {
  const snapshots = {
    projects: validateSnapshot(projects()),
    starred: validateSnapshot(starred()),
  }
  write('src/data/projects.json', snapshots.projects)
  write('src/data/starred.json', snapshots.starred)
  console.log(`refreshed ${snapshots.projects.length} projects and ${snapshots.starred.length} starred repos`)
  return snapshots
}

if (import.meta.main) refreshRepositories()
