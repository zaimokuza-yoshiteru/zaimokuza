import type { ActivityWeek } from './repoActivity'

/** 观测「06 贡献者」用的样本：按提交数降序的前 100 名。 */
export interface RepoContributor {
  login: string
  avatarUrl: string
  contributions: number
}

/** 观测「07 发布节奏」用的样本：按发布时间倒序的前 100 个发布。 */
export interface RepoRelease {
  tag: string
  name: string
  publishedAt: string
  prerelease: boolean
}

/** 观测「08 最近提交」用的样本：默认分支上的最近 12 次提交。 */
export interface RepoCommit {
  sha: string
  message: string
  author: string
  avatarUrl: string
  date: string
}

/**
 * 构建时由 scripts/lib/repo-metrics.mjs 采集的仓库快照字段。
 * projects.json（开源作品）与 starred.json（观测）结构一致，因此共用这一个类型。
 */
export interface RepoSnapshot {
  fullName: string
  name: string
  owner: string
  url: string
  avatarUrl: string
  description: string
  homepage: string
  topics: string[]
  license: string
  defaultBranch: string
  stars: number
  forks: number
  openIssues: number
  watchers: number
  contributors: number
  commits: number
  sizeKb: number
  createdAt: string
  pushedAt: string
  languages: { name: string; bytes: number }[]
  languageTotal: number
  release: { tag: string; publishedAt: string | null; prerelease: boolean } | null
  /** 发布总数；releases 只是采样，这个是权威计数。 */
  releaseCount: number
  releases: RepoRelease[] | null
  contributorList: RepoContributor[] | null
  commitList: RepoCommit[] | null
  activity: ActivityWeek[]
  /** 7×24 的提交直方图，下标为 星期 * 24 + 小时（星期 0 为周日）；仓库过大时 GitHub 只统计前 2 万次提交。 */
  punchCard: number[] | null
}
