import { profile } from '../data/profile'
import { ExternalArrow } from './ExternalArrow'

/** 站内所有跳转到 GitHub 的入口共用这一款签名体链接：文案与形态固定，只有 href 不同。 */
export function GithubLink({ href }: { href: string }) {
  return (
    <a className="gh-link" href={href} target="_blank" rel="noopener noreferrer">
      {profile.nav.github}
      <ExternalArrow />
    </a>
  )
}
