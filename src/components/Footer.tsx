import { profile } from '../data/profile'
import { GithubLink } from './GithubLink'

/** 与正文保持同一纸色和对齐线的页脚。 */
export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="site-frame site-footer">
      <p>© {year}. {profile.name}</p>
      <div className="flex items-center gap-[24px] text-[13px]">
        <GithubLink href={profile.social.github} />
        {profile.social.email && (
          <a href={`mailto:${profile.social.email}`} className="transition-colors hover:text-text-primary">
            Email
          </a>
        )}
      </div>
    </footer>
  )
}
