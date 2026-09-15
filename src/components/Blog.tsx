import { profile, type BlogPost } from '../data/profile'
import { blogHref, homeHref } from '../lib/navigation'
import SectionHeader from './SectionHeader'

const posts = [...profile.blog.posts].sort((a, b) => b.date.localeCompare(a.date))

function PostList({ entries }: { entries: BlogPost[] }) {
  const copy = profile.blog
  if (!entries.length) return (
    <div className="blog-empty">
      <span aria-hidden="true" className="blog-empty-mark">✳</span>
      <div>
        <h3 className="font-serif-main text-[22px]">{copy.emptyTitle}</h3>
        <p className="mt-[10px] text-[14px] leading-[26px] text-text-secondary">{copy.emptyDescription}</p>
      </div>
    </div>
  )
  return (
    <div className="blog-list">
      {entries.map((post, index) => (
        <article key={post.slug} className="blog-row reveal" style={{ transitionDelay: `${(index % 5) * 50}ms` }}>
          <div className="flex flex-wrap items-center gap-x-[20px] gap-y-[6px]">
            <time dateTime={post.date} className="font-mono-num text-[12px] text-text-secondary">{post.date.replace(/-/g, '.')}</time>
            <span className="text-[12px] text-text-secondary">{post.category}</span>
          </div>
          <div className="min-w-0">
            <h3 className="mt-[7px] text-[20px] font-medium leading-[32px]"><a className="blog-title-link" href={blogHref(post.slug)}>{post.title}</a></h3>
            <p className="mt-[8px] text-[14px] leading-[26px] text-text-secondary">{post.excerpt}</p>
          </div>
        </article>
      ))}
    </div>
  )
}

export default function Blog({ archive = false }: { archive?: boolean }) {
  const copy = profile.blog
  const entries = archive ? posts : posts.slice(0, 5)
  return (
    <section className={`site-frame ${archive ? 'blog-archive' : 'home-section home-blog'}`}>
      {archive && <a className="back-link" href={homeHref('blog')}><span aria-hidden="true">←</span> {profile.nav.home}</a>}
      <div id="blog" className="section-heading scroll-mt-[40px]">
        <SectionHeader title={archive ? copy.archiveTitle : copy.title} count={posts.length} level={archive ? 1 : 2} />
      </div>
      <div className="section-content">
        <PostList entries={entries} />
        <div className="collection-footer">
          <p>{profile.collections.shown} <span className="font-mono-num">{entries.length} / {posts.length}</span> {copy.unit}</p>
          {!archive && <a className="collection-link" href={blogHref()}>{profile.collections.more} <span aria-hidden="true">↗</span></a>}
        </div>
      </div>
    </section>
  )
}
