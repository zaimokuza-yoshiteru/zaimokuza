// 构建时拉取 GitHub 公开仓库数据 → src/data/projects.json
// 用法: node scripts/fetch-github.mjs   （依赖本机 gh CLI 授权）
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'

const USER = 'zaimokuza-yoshiteru'

const raw = execFileSync(
  'gh',
  ['api', `users/${USER}/repos`, '--paginate', '-q',
   '.[] | select(.fork == false) | {name, description, language, stars: .stargazers_count, forks: .forks_count, url: .html_url, homepage, topics, updatedAt: .updated_at}'],
  { encoding: 'utf8' },
)

const projects = raw
  .trim()
  .split('\n')
  .map((line) => JSON.parse(line))
  .sort((a, b) => b.stars - a.stars || b.updatedAt.localeCompare(a.updatedAt))

fs.mkdirSync('src/data', { recursive: true })
fs.writeFileSync('src/data/projects.json', JSON.stringify(projects, null, 2) + '\n')
console.log(`fetched ${projects.length} projects -> src/data/projects.json`)
