import assert from 'node:assert/strict'
import test from 'node:test'
import { createParticleField, stepParticles } from '../src/lib/particleField.ts'

test('点阵始终位于画布内，大屏数量受控，窄屏更稀疏', () => {
  for (const [width, height] of [[390, 700], [1440, 500], [7680, 2160]]) {
    const { points, columns, rows } = createParticleField(width, height)
    assert.equal(points.length, columns * rows)
    assert.ok(points.length < 1200)
    assert.ok(points.every(p => p.x >= 0 && p.x <= width && p.y >= 0 && p.y <= height))
    assert.ok(createParticleField(width, height, true).points.length <= points.length)
  }
  assert.equal(createParticleField(0, 0).points.length, 0)
})

test('静止点阵不产生持续动画', () => {
  const { points } = createParticleField(1000, 500)
  const original = structuredClone(points)
  assert.equal(stepParticles(points, null, 1000 / 30), false)
  assert.deepEqual(points, original)
})

test('鼠标恰好落在点上也能散开，远处点保持原位', () => {
  const { points } = createParticleField(1000, 500)
  const target = points[0]
  const far = points[points.length - 1]
  const originalFar = structuredClone(far)
  assert.equal(stepParticles(points, { x: target.x, y: target.y }, 1000 / 30), true)
  assert.ok(Math.hypot(target.x - target.homeX, target.y - target.homeY) > 0)
  assert.ok(points.every(p => [p.x, p.y, p.vx, p.vy].every(Number.isFinite)))
  assert.deepEqual(far, originalFar)
})

test('持续扰动后放开鼠标能回位并自动停止', () => {
  for (const elapsed of [1000 / 60, 1000 / 30, 1000]) {
    const { points } = createParticleField(1000, 500)
    for (let i = 0; i < 150; i++) stepParticles(points, { x: 250 + i, y: 200 }, elapsed)
    let moving = true
    let steps = 0
    while (moving && steps++ < 600) moving = stepParticles(points, null, elapsed)
    assert.equal(moving, false)
    assert.ok(points.every(p => Math.hypot(p.x - p.homeX, p.y - p.homeY) < 0.2))
  }
})

test('肖像采样保留暗部、跳过浅色与透明区域，位置和粒子数量受控', async () => {
  const { createPortraitParticles } = await import('../src/lib/particleField.ts')
  const resolution = 140
  const pixels = new Uint8ClampedArray(resolution * resolution * 4)
  for (let i = 0; i < pixels.length; i += 4) pixels[i + 3] = 255
  const dark = createPortraitParticles(pixels, resolution, 480)
  assert.ok(dark.length > 5000 && dark.length <= resolution * resolution)
  assert.ok(dark.every(p => p.x >= 0 && p.x <= 480 && p.y >= 0 && p.y <= 480 && p.size > 0 && p.shade > 0))
  pixels.fill(255)
  assert.equal(createPortraitParticles(pixels, resolution, 480).length, 0)
  pixels.fill(0)
  assert.equal(createPortraitParticles(pixels, resolution, 480).length, 0)
})

test('鼠标局部打乱保持位移有界，中心仍保留粒子而不形成空洞', () => {
  const points = []
  for (let y = -20; y <= 20; y += 2) {
    for (let x = -20; x <= 20; x += 2) {
      points.push({ homeX: 200 + x, homeY: 200 + y, x: 200 + x, y: 200 + y, vx: 0, vy: 0, shade: 1, size: 1 })
    }
  }
  for (let i = 0; i < 300; i++) {
    stepParticles(points, { x: 200, y: 200 }, 1000 / 30, i / 30)
    assert.ok(points.every(p => Math.hypot(p.x - p.homeX, p.y - p.homeY) < 40))
  }
  assert.ok(points.filter(p => Math.hypot(p.x - 200, p.y - 200) < 10).length > 10)
})
