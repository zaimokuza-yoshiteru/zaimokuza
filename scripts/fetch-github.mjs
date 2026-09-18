// 构建时拉取 GitHub 置顶仓库数据 → src/data/projects.json
// 用法: node scripts/fetch-github.mjs   （依赖本机 gh CLI 授权）
// 展示清单以个人主页的置顶仓库为准，顺序即置顶顺序；置顶最多 6 个。
import { collectRepo, gh, writeJson } from './lib/repo-metrics.mjs'

const USER = 'zaimokuza-yoshiteru'
// 需要从作品集里隐藏的仓库；本站仓库已按置顶顺序正常展示，这里暂时留空，需要隐藏时把 fullName 加进来即可。
const EXCLUDE = []

const pinned = JSON.parse(
  gh(['api', 'graphql', '-f', `query={ user(login:"${USER}") { pinnedItems(first:6, types:REPOSITORY) { nodes { ... on Repository { nameWithOwner } } } } }`]),
)

const projects = []
for (const node of pinned.data.user.pinnedItems.nodes) {
  const fullName = node.nameWithOwner
  if (EXCLUDE.includes(fullName)) {
    console.warn(`skipped ${fullName}: excluded`)
    continue
  }
  const repo = collectRepo(fullName)
  if (!repo) {
    console.warn(`skipped ${fullName}: repository unavailable`)
    continue
  }
  projects.push(repo)
}

writeJson('src/data/projects.json', projects)
console.log(`fetched ${projects.length} pinned projects -> src/data/projects.json`)
