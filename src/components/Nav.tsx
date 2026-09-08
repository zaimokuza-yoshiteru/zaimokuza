import { profile } from '../data/profile'

/** 顶部导航：右侧锚点与 GitHub 入口。 */
export default function Nav() {
  return (
    <nav className="w-full border-b border-black/[0.06] shadow-[0_1px_16px_rgba(31,35,41,0.03)]">
      <div className="mx-auto flex h-[72px] w-[calc(100%-56px)] max-w-[1260px] items-center justify-end">
        <div className="flex items-center gap-[16px] text-[13px] text-text-secondary md:gap-[28px] md:text-[14px]">
          <a href="#projects" className="transition-colors hover:text-text-primary">作品</a>
          <a href="#experience" className="transition-colors hover:text-text-primary">经历</a>
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
