import { useEffect, useState } from 'react'
import projects from '../data/projects.json'
import { profile } from '../data/profile'
import { refreshGithubStars, type StarCounts } from '../lib/githubStars'

const initialStars = Object.fromEntries(projects.map((project) => [project.name, project.stars]))
const projectNames = projects.map((project) => project.name)
const username = new URL(profile.social.github).pathname.split('/').filter(Boolean)[0]

export function useGithubStars(): StarCounts {
  const [stars, setStars] = useState<StarCounts>(initialStars)

  useEffect(() => {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 8000)
    void refreshGithubStars(username, projectNames, controller.signal, (latest) => {
      if (!controller.signal.aborted) setStars((previous) => ({ ...previous, ...latest }))
    }).catch(() => {
      // 限流、离线或超时保留上次计数；不轮询，也不打断阅读。
    }).finally(() => window.clearTimeout(timeout))
    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [])

  return stars
}
