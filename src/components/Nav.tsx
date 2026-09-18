import { profile } from '../data/profile'
import { blogHref, homeHref, starredHref } from '../lib/navigation'
import { ExternalArrow } from './ExternalArrow'

export type Page = 'home' | 'blog' | 'starred'

/** 顶部导航固定提供首页、博客列表、观测和 GitHub 入口。 */
export default function Nav({ page = 'home' }: { page?: Page }) {
  const link = 'transition-colors hover:text-text-primary'
  return (
    <nav className="sticky top-0 z-50 h-[var(--nav-h)] w-full border-b border-border-warm bg-bg-page">
      <div className="site-frame flex h-full items-center justify-end">
        <div className="flex items-center gap-[16px] text-[13px] text-text-secondary md:gap-[28px] md:text-[14px]">
          <a href={homeHref()} aria-current={page === 'home' ? 'page' : undefined} className={link}>{profile.nav.home}</a>
          <a href={blogHref()} aria-current={page === 'blog' ? 'page' : undefined} className={link}>{profile.nav.blog}</a>
          <a href={starredHref()} aria-current={page === 'starred' ? 'page' : undefined} className={link}>{profile.nav.starred}</a>
          <a
            href={profile.social.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center transition-colors hover:text-text-primary"
          >
            {profile.nav.github}
            <ExternalArrow />
          </a>
        </div>
      </div>
    </nav>
  )
}
