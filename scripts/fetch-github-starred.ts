// 构建时拉取 GitHub 星标仓库数据 → src/data/starred.json
// 用法: node scripts/fetch-github-starred.ts   （依赖本机 gh CLI 授权）
// 字段采集与 projects.json 共用 scripts/lib/repo-metrics.ts。
import { collectRepo, gh, readPrevious, validateSnapshot, writeJson } from './lib/repo-metrics.ts'

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

export function collectStarred() {
  // 星标列表先取一次：已取消星标的仓库即使仍在 WATCHED 里也不会展示。
  const starredNames = new Set(
    gh(['api', `users/${USER}/starred`, '--paginate', '-q', '.[].full_name'])
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
  )

  const starred = []
  const previous = readPrevious('src/data/starred.json')
  for (const fullName of WATCHED) {
    if (!starredNames.has(fullName)) {
      // 已取消星标是正常情况：跳过它，其余照常展示。
      console.warn(`skipped ${fullName}: not in starred list`)
      continue
    }
    // 普通接口失败会抛出异常，整份快照保持原样；统计失败只回退相应的旧样本。
    const repo = collectRepo(fullName, previous.get(fullName.toLowerCase()))
    starred.push(repo)
  }

  if (starred.length === 0) throw new Error('refusing to replace the snapshot with an empty watched list')
  return validateSnapshot(starred)
}

if (import.meta.main) {
  const repos = collectStarred()
  writeJson('src/data/starred.json', repos)
  console.log(`fetched ${repos.length} starred repos`)
}
