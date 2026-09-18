import { useEffect, useState } from 'react'
import { refreshRepoMetrics, type RepoMetricsMap } from '../lib/repoMetrics'

/**
 * 只请求一次：两个展示区共用同一份指标，避免重复消耗匿名接口额度。
 * 返回空对象时卡片会退回构建快照，因此不需要预先填充。
 */
export function useRepoMetrics(fullNames: string[]): RepoMetricsMap {
  const [metrics, setMetrics] = useState<RepoMetricsMap>({})
  const key = fullNames.join(',')

  useEffect(() => {
    const names = key ? key.split(',') : []
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 12000)
    void refreshRepoMetrics(names, controller.signal, (latest) => {
      if (!controller.signal.aborted) setMetrics((previous) => ({ ...previous, ...latest }))
    }).catch(() => {
      // 限流、离线或超时保留快照计数；不轮询，也不打断阅读。
    }).finally(() => window.clearTimeout(timeout))
    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [key])

  return metrics
}
