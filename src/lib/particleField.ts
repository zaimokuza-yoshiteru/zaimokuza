export interface Particle {
  homeX: number
  homeY: number
  x: number
  y: number
  vx: number
  vy: number
  shade: number
  size: number
}

export interface ParticlePointer { x: number; y: number }

export function createParticleField(width: number, height: number, compact = false) {
  if (width <= 0 || height <= 0) return { points: [], columns: 0, rows: 0 }
  // 大屏增加间距，限制粒子数量；窄屏减少密度。
  const gap = Math.max(compact ? 56 : 42, Math.sqrt(width * height / 1000))
  const columns = Math.floor(width / gap) + 1
  const rows = Math.floor(height / gap) + 1
  const left = (width - (columns - 1) * gap) / 2
  const top = (height - (rows - 1) * gap) / 2
  const points: Particle[] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const seed = (Math.sin(row * 73.13 + col * 19.71) + 1) / 2
      const x = left + col * gap
      const y = top + row * gap
      points.push({ homeX: x, homeY: y, x, y, vx: 0, vy: 0, shade: 0.22 + seed * 0.16, size: 1.5 + seed * 0.7 })
    }
  }
  return { points, columns, rows }
}

/** 局部扰动改变每个粒子的目标位置，不按径向排斥，因此不会挖空鼠标周围。 */
export function stepParticles(points: Particle[], pointer: ParticlePointer | null, elapsed: number, time = 0) {
  const step = Math.min(2, Math.max(0, elapsed / (1000 / 60)))
  let moving = false
  for (const point of points) {
    let targetX = point.homeX
    let targetY = point.homeY
    if (pointer) {
      const distance = Math.hypot(point.homeX - pointer.x, point.homeY - pointer.y)
      const influence = Math.max(0, 1 - distance / 90) ** 1.5
      if (influence > 0) {
        const seed = point.homeX * 12.9898 + point.homeY * 78.233
        const angle = (Math.sin(seed) * 43758.5453 % 1) * Math.PI * 2
        const amplitude = influence * (15 + 9 * (0.5 + 0.5 * Math.sin(seed * 2.31)))
        // 各粒子沿不同方向慢速游走，位移有界，中心仍然留有粒子。
        targetX += Math.cos(angle + time * 1.8) * amplitude
        targetY += Math.sin(angle - time * 1.4) * amplitude
        moving = true
      }
    }
    const fx = (targetX - point.x) * 0.024
    const fy = (targetY - point.y) * 0.024
    const damping = 0.84 ** step
    point.vx = (point.vx + fx * step) * damping
    point.vy = (point.vy + fy * step) * damping
    point.x += point.vx * step
    point.y += point.vy * step
    const distanceFromHome = Math.hypot(point.x - point.homeX, point.y - point.homeY)
    // 回弹转向时速度也会接近零，须同时检查是否已回到原位。
    if (Math.abs(point.vx) + Math.abs(point.vy) > 0.025 || (!pointer && distanceFromHome >= 0.15)) moving = true
    if (!pointer && distanceFromHome < 0.15 && Math.hypot(point.vx, point.vy) < 0.025) {
      point.x = point.homeX
      point.y = point.homeY
      point.vx = point.vy = 0
    }
  }
  return moving
}

/** 从已裁出人物轮廓的画布取样：透明区域完全跳过，浅色区域留白。 */
export function createPortraitParticles(pixels: Uint8ClampedArray, resolution: number, extent: number): Particle[] {
  const points: Particle[] = []
  const gap = extent * 0.86 / resolution
  const offset = extent * 0.07
  for (let row = 0; row < resolution; row++) {
    for (let col = 0; col < resolution; col++) {
      const index = (row * resolution + col) * 4
      const luminance = (pixels[index] * 0.2126 + pixels[index + 1] * 0.7152 + pixels[index + 2] * 0.0722) / 255
      const ink = (1 - luminance) * pixels[index + 3] / 255
      if (ink < 0.13) continue
      const seed = (Math.sin(row * 73.13 + col * 19.71) + 1) / 2
      const x = offset + (col + 0.5) * gap
      const y = offset + (row + 0.5) * gap
      points.push({ homeX: x, homeY: y, x, y, vx: 0, vy: 0, shade: ink * 0.68, size: gap * (0.26 + ink * 0.24 + seed * 0.08) })
    }
  }
  return points
}

/** 按原图 300 × 300 的人物外轮廓描边，只限制采样范围，不改动原图。 */
export const portraitOutline = [
  [92, 0], [109, 0], [101, 14], [116, 16], [143, 16], [176, 21],
  [207, 32], [218, 39], [250, 29], [259, 32], [266, 45], [274, 89],
  [267, 103], [259, 106], [270, 134], [277, 157], [273, 170], [251, 169],
  [241, 192], [233, 203], [214, 209], [208, 217], [218, 220], [218, 238],
  [224, 248], [225, 274], [239, 300], [61, 300], [83, 282], [83, 249],
  [98, 225], [103, 211], [117, 207], [111, 203], [79, 203], [56, 199],
  [48, 187], [43, 170], [41, 146], [43, 119], [46, 98], [52, 76],
  [65, 55], [87, 37], [85, 25], [84, 13],
] as const

export const portraitClipPath = `polygon(${portraitOutline.map(([x, y]) => `${x / 3}% ${y / 3}%`).join(',')})`
