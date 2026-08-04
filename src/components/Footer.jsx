import { profile } from '../data/profile.js'

/** 黑色页脚 */
export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-[48px] bg-black text-white">
      <div className="mx-auto flex w-[calc(100%-56px)] max-w-[1260px] flex-col gap-[24px] py-[48px] md:flex-row md:items-end md:justify-between">
        <div>
          <div className="font-serif-main text-[24px] italic tracking-tight">{profile.name}</div>
          <p className="mt-[8px] text-[13px] text-white/55">{profile.tagline.zh}</p>
        </div>
        <div className="flex items-center gap-[24px] text-[13px] text-white/70">
          <a href={profile.social.github} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">
            GitHub
          </a>
          {profile.social.email && (
            <a href={`mailto:${profile.social.email}`} className="transition-colors hover:text-white">
              Email
            </a>
          )}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto w-[calc(100%-56px)] max-w-[1260px] py-[20px] text-[12px] text-white/40">
          © {year} {profile.name}. Built with React & Vite.
        </div>
      </div>
    </footer>
  )
}
