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

const BlogArticle = lazy(() => import('./components/BlogArticle'))

// 首页与「观测」页各刷新自己那一批仓库，避免为不可见内容消耗匿名接口额度。
const projectRepos = projects.map((repo) => repo.fullName)
const starredRepos = starred.map((repo) => repo.fullName)

export default function App() {
  const [hash, setHash] = useState(window.location.hash)
  const blogPage = hash === '#/blog' || hash.startsWith('#/blog/')
  const starredPage = hash === '#/starred' || hash.startsWith('#/starred/')
  const page: Page = blogPage ? 'blog' : starredPage ? 'starred' : 'home'
  const blogSlug = hash.startsWith('#/blog/') ? hash.slice('#/blog/'.length) : ''
  const starredSlug = hash.startsWith('#/starred/') ? hash.slice('#/starred/'.length) : ''
  const metrics = useRepoMetrics(page === 'starred' ? starredRepos : page === 'home' ? projectRepos : [])
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
        {page === 'blog' ? (blogSlug ? <Suspense fallback={<p className="article-loading" role="status">{profile.articleUI.loading}</p>}><BlogArticle key={blogSlug} slug={blogSlug} /></Suspense> : <Blog archive />) : page === 'starred' ? <Starred metrics={metrics} slug={starredSlug} /> : <>
          <Hero />
          <Projects metrics={metrics} />
          <Blog />
          <Experience />
        </>}
      </main>
      <Footer />
    </div>
  )
}
