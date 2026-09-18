import { useEffect, useState } from 'react'
import type { RepoSnapshot } from '../lib/repoSnapshot'
import { fetchStarredSnapshot } from '../lib/starredSource'

/**
 * 先用构建快照渲染，拿到远端快照后再覆盖。
 * 远端被墙、超时或格式不符时 fetchStarredSnapshot 返回 null，页面因此始终有内容可看。
 *
 * enabled 只在观测页为真：首页和博客不需要这 256 KB，也就不该为它们发这次请求。
 * 已取得的数据在组件存活期间保留，离开观测页再回来会立即显示上次的结果。
 */
export function useStarredRepos(bundled: RepoSnapshot[], enabled: boolean): RepoSnapshot[] {
  const [repos, setRepos] = useState(bundled)

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 12000)
    void fetchStarredSnapshot(controller.signal).then((latest) => {
      if (!controller.signal.aborted && latest) setRepos(latest)
    }).finally(() => window.clearTimeout(timeout))
    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [enabled])

  return repos
}
