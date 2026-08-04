import Nav from './components/Nav.jsx'
import Hero from './components/Hero.jsx'
import Projects from './components/Projects.jsx'
import Experience from './components/Experience.jsx'
import Footer from './components/Footer.jsx'
import CustomCursor from './components/CustomCursor.jsx'
import HeroInvert from './components/HeroInvert.jsx'
import { useRevealOnScroll } from './interactions.js'

export default function App() {
  useRevealOnScroll()
  return (
    <div className="flex min-h-full flex-col">
      <Nav />
      {/* 自定义光标作用区（nav/footer 保留系统光标） */}
      <main className="cursor-hidden-zone flex-1">
        <Hero />
        <Projects />
        <Experience />
      </main>
      <Footer />
      <HeroInvert />
      <CustomCursor />
    </div>
  )
}
