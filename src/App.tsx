import { lazy, Suspense, useEffect, useLayoutEffect, useState } from 'react'
import Nav, { type Page } from './components/Nav'
import Hero from './components/Hero'
import Projects from './components/Projects'
import Starred from './components/Starred'
import Experience from './components/Experience'
import Footer from './components/Footer'
import { useRevealOnScroll } from './interactions'
import Blog from './components/Blog'
import { profile } from './data/profile'
import projects from './data/projects.json'
import starred from './data/starred.json'
import { useRepoMetrics } from './hooks/useRepoMetrics'
import { useRepoSnapshots } from './hooks/useRepoSnapshots'

const BlogArticle = lazy(() => import('./components/BlogArticle'))

export default function App() {
  const [hash, setHash] = useState(window.location.hash)
  const blogPage = hash === '#/blog' || hash.startsWith('#/blog/')
  const starredPage = hash === '#/starred' || hash.startsWith('#/starred/')
  const page: Page = blogPage ? 'blog' : starredPage ? 'starred' : 'home'
  const blogSlug = hash.startsWith('#/blog/') ? hash.slice('#/blog/'.length) : ''
  const starredSlug = hash.startsWith('#/starred/') ? hash.slice('#/starred/'.length) : ''
  // 两个页面先用构建快照渲染，仅请求当前页面对应的数据；失败时保留已有快照。
  const projectSnapshots = useRepoSnapshots('projects', projects, page === 'home')
  const starredRepos = useRepoSnapshots('starred', starred, starredPage)
  const metrics = useRepoMetrics(
    starredPage ? starredRepos.map((repo) => repo.fullName) : page === 'home' ? projectSnapshots.map((repo) => repo.fullName) : [],
  )
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  useLayoutEffect(() => {
    // 路由更新后再定位首页锚点，兼容浏览器前进、后退和深链接刷新。
    if (page !== 'home' || !hash) window.scrollTo(0, 0)
    else document.getElementById(hash.slice(1))?.scrollIntoView()
  }, [hash, page])
  useEffect(() => {
    if (page === 'blog') {
      const post = profile.blog.posts.find((entry) => encodeURIComponent(entry.slug) === blogSlug)
      document.title = `${post?.title ?? profile.blog.archiveTitle} · Zaimokuza`
    } else if (page === 'starred') {
      document.title = `${profile.starred.title} · Zaimokuza`
    } else {
      document.title = 'Zaimokuza'
    }
  }, [page, blogSlug])
  useRevealOnScroll()
  return (
    <div className="flex min-h-full flex-col">
      <Nav page={page} />
      <main className="flex-1">
        {page === 'blog' ? (blogSlug ? <Suspense fallback={<p className="article-loading" role="status">{profile.articleUI.loading}</p>}><BlogArticle key={blogSlug} slug={blogSlug} /></Suspense> : <Blog archive />) : page === 'starred' ? <Starred repos={starredRepos} metrics={metrics} slug={starredSlug} /> : <>
          <Hero />
          <Projects repos={projectSnapshots} metrics={metrics} />
          <Blog />
          <Experience />
        </>}
      </main>
      <Footer />
    </div>
  )
}
