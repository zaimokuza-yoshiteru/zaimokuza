// 构建时拉取 GitHub 星标仓库数据 → src/data/starred.json
// 用法: node scripts/fetch-github-starred.mjs   （依赖本机 gh CLI 授权）
// 字段采集与 projects.json 共用 scripts/lib/repo-metrics.mjs。
import { collectRepo, gh, writeJson } from './lib/repo-metrics.mjs'

const USER = 'zaimokuza-yoshiteru'

// 手动挑选的展示清单：星标仓库会不断变化，只有这里列出的会出现在页面上。
const WATCHED = [
  'deepseek-ai/deepseek-harness',
  'earendil-works/pi',
  'openclaw/openclaw',
  'NousResearch/hermes-agent',
  'openai/codex',
  'anthropics/claude-code',
  'bytedance/deer-flow',
]

// 星标列表先取一次：已取消星标的仓库即使仍在 WATCHED 里也不会展示。
const starredNames = new Set(
  gh(['api', `users/${USER}/starred`, '--paginate', '-q', '.[].full_name'])
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean),
)

const starred = []
for (const fullName of WATCHED) {
  if (!starredNames.has(fullName)) {
    // 已取消星标是正常情况：跳过它，其余照常展示。
    console.warn(`skipped ${fullName}: not in starred list`)
    continue
  }
  const repo = collectRepo(fullName)
  if (!repo) {
    // 这里必须中断而不是跳过。本脚本由 refresh-starred.yml 定时无人值守运行，
    // 一次接口抖动若只是打条警告，就会把该仓库从快照里删掉并提交上去。
    throw new Error(`failed to collect ${fullName}`)
  }
  starred.push(repo)
}

writeJson('src/data/starred.json', starred)
console.log(`fetched ${starred.length} starred repos -> src/data/starred.json`)
