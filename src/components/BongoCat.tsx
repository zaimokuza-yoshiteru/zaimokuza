import { profile } from '../data/profile'
import { useMascot } from '../hooks/useMascot'
import { resetTilt, tiltSurface } from '../tilt'

/** 参考经典 Bongo Cat 的举爪姿态，鼓面与身体分层，点击时交替敲击。 */
export default function BongoCat() {
  const { ref, visible, active, greet } = useMascot()
  const copy = profile.bongo
  return (
    <div className="project-cat">
      <button ref={ref} type="button" onClick={greet}
        onPointerMove={tiltSurface} onPointerLeave={resetTilt} onPointerCancel={resetTilt}
        className={`cat-button mascot ${visible ? 'is-visible' : ''} ${active ? 'is-active' : ''}`}
        data-cursor="cat" aria-label={copy.label} aria-describedby="bongo-hint">
        <svg className="mascot-art" viewBox="0 0 320 240" aria-hidden="true">
          <ellipse cx="160" cy="214" rx="109" ry="8" fill="#766650" opacity="0.1" />
          <g stroke="#363636" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M61 151Q57 112 77 84L89 44L115 65Q159 48 199 73L233 58L233 105Q250 125 251 159" fill="#f8f3ea" />
            <g fill="#363636" stroke="none"><ellipse cx="121" cy="105" rx="6" ry="7" /><ellipse cx="185" cy="112" rx="6" ry="7" /></g>
            <path d="M142 115q4 10 12 2q6 10 13 2" fill="none" strokeWidth="3.5" />
            <path d="M25 148L296 173" stroke="#a99a82" strokeWidth="2" />
            <g fill="#d5b68a" strokeWidth="3.5">
              <path d="M48 167l8 40q38 22 77 0l7-40Z" />
              <path d="M160 178l7 34q37 20 72-1l7-34Z" />
              <path d="M56 198q36 23 77 0M167 203q37 18 72-1" fill="none" stroke="#82684f" />
            </g>
            <g fill="#ece0c9" strokeWidth="3.5"><ellipse cx="94" cy="166" rx="48" ry="17" /><ellipse cx="203" cy="178" rx="45" ry="16" /></g>
            <g fill="none" stroke="#a78d68" strokeWidth="2"><ellipse cx="94" cy="166" rx="39" ry="11" /><ellipse cx="203" cy="178" rx="36" ry="10" /></g>
            <g className="bongo-paw bongo-paw-left">
              <path d="M65 143Q56 100 71 100Q90 97 98 126L100 151" fill="#f8f3ea" />
              <g fill="#e7a6b1" stroke="none"><ellipse cx="79" cy="132" rx="7" ry="9" /><circle cx="67" cy="120" r="3.5" /><circle cx="78" cy="113" r="3.5" /><circle cx="88" cy="121" r="3.5" /></g>
            </g>
            <g className="bongo-paw bongo-paw-right">
              <path d="M208 158Q201 114 218 113Q235 113 241 141L243 162" fill="#f8f3ea" />
              <g fill="#e7a6b1" stroke="none"><ellipse cx="223" cy="144" rx="7" ry="9" /><circle cx="211" cy="132" r="3.5" /><circle cx="221" cy="125" r="3.5" /><circle cx="232" cy="133" r="3.5" /></g>
            </g>
            <g className="bongo-notes" fill="none" stroke="#9b8058" strokeWidth="2.5"><path d="M39 90l-8-8M47 82l-2-11M259 106l8-9M268 117l11-3" /></g>
          </g>
        </svg>
      </button>
      <p id="bongo-hint" className="cat-hint" aria-live="polite">{active ? copy.greeting : copy.hint}</p>
    </div>
  )
}
