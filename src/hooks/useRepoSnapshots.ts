import { useEffect, useState } from 'react'
import type { RepoSnapshot } from '../lib/repoSnapshot'
import { fetchRepoSnapshots, type RepoSource } from '../lib/repoSource'

/**
 * 先用构建快照渲染，拿到远端快照后再覆盖。
 * 远端被墙、超时或格式不符时 fetchRepoSnapshots 返回 null，页面因此始终有内容可看。
 *
 * enabled 仅在对应页面为真时请求：首页读 projects，观测读 starred，博客不请求。
 * 已取得的数据在组件存活期间保留，离开观测页再回来会立即显示上次的结果。
 */
export function useRepoSnapshots(source: RepoSource, bundled: RepoSnapshot[], enabled: boolean): RepoSnapshot[] {
  const [repos, setRepos] = useState(bundled)

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 12000)
    void fetchRepoSnapshots(source, controller.signal).then((latest) => {
      if (!controller.signal.aborted && latest) setRepos(latest)
    }).finally(() => window.clearTimeout(timeout))
    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [source, enabled])

  return repos
}
