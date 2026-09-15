import { profile } from '../data/profile'
import { blogHref, homeHref } from '../lib/navigation'

/** 顶部导航固定提供首页、博客列表和 GitHub 入口。 */
export default function Nav({ blogPage = false }: { blogPage?: boolean }) {
  return (
    <nav className="w-full">
      <div className="site-frame flex h-[72px] items-center justify-end">
        <div className="flex items-center gap-[16px] text-[13px] text-text-secondary md:gap-[28px] md:text-[14px]">
          <a href={homeHref()} aria-current={!blogPage ? 'page' : undefined} className="transition-colors hover:text-text-primary">{profile.nav.home}</a>
          <a href={blogHref()} aria-current={blogPage ? 'page' : undefined} className="transition-colors hover:text-text-primary">{profile.nav.blog}</a>
          <a
            href={profile.social.github}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-black px-[16px] py-[6px] text-[13px] text-white transition-opacity hover:opacity-80"
          >
            GitHub
          </a>
        </div>
      </div>
    </nav>
  )
}
