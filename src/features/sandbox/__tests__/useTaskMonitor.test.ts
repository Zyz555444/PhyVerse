import { describe, it, expect } from 'vitest'
import { calculatePeriod } from '../useTaskMonitor'
import type { TelemetrySample } from '../sandboxStore'

function makeSample(t: number, posY: number, velY: number): TelemetrySample {
  return {
    t,
    pos: [0, posY, 0],
    vel: [0, velY, 0],
    speed: Math.abs(velY),
    accel: 0,
    accelX: 0,
    accelY: 0,
    accelZ: 0,
    ke: 0,
    pe: 0,
  }
}

describe('calculatePeriod', () => {
  it('returns 0 for fewer than 10 samples', () => {
    const samples = Array.from({ length: 9 }, (_, i) => makeSample(i * 0.1, Math.sin(i * 0.5), 1))
    expect(calculatePeriod(samples)).toBe(0)
  })

  it('returns 0 when there are no upward zero-crossings', () => {
    // All samples above center with negative velocity - no upward crossings
    const samples = Array.from({ length: 20 }, (_, i) =>
      makeSample(i * 0.1, 2 + Math.sin(i * 0.5) * 0.2, -1)
    )
    expect(calculatePeriod(samples)).toBe(0)
  })

  it('returns 0 when only one upward zero-crossing', () => {
    // One upward crossing, then all below center
    const samples: TelemetrySample[] = [
      makeSample(0.0, 0.5, -1),   // below center
      makeSample(0.1, 1.0, 2),    // above center (upward crossing)
      makeSample(0.2, 0.3, -3),   // below center
      makeSample(0.3, -0.5, -1),
      makeSample(0.4, -1.0, -1),
      makeSample(0.5, -1.5, -1),
      makeSample(0.6, -2.0, -1),
      makeSample(0.7, -2.5, -1),
      makeSample(0.8, -3.0, -1),
      makeSample(0.9, -3.5, -1),
    ]
    expect(calculatePeriod(samples)).toBe(0)
  })

  it('calculates the period from two upward zero-crossings', () => {
    // Simulate a pendulum swinging: centerY around 0
    // Downward then upward crossing at t=0.2: from neg to pos Y while vel > 0
    // Downward then upward crossing at t=1.8
    const samples: TelemetrySample[] = [
      makeSample(0.0, -0.8, 1.5),  // below, moving up
      makeSample(0.2, 0.2, 1.2),   // above center! (crossing at ~t=0.1)
      makeSample(0.4, 1.0, 0.8),   // above
      makeSample(0.6, 1.5, 0.2),   // above
      makeSample(0.8, 1.2, -0.5),  // above, moving down
      makeSample(1.0, 0.5, -1.2),  // above
      makeSample(1.2, 0.2, -1.5),  // above
      makeSample(1.4, -0.5, -1.8), // below, still moving down
      makeSample(1.6, -1.0, -1.0), // below
      makeSample(1.8, -0.3, 1.0),  // below, now moving up
      makeSample(2.0, 0.5, 1.5),   // above! second crossing at ~t=1.85
      makeSample(2.2, 1.0, 1.0),   // above
    ]

    const period = calculatePeriod(samples)
    // The two crossings are at approximately t=0.1 and t=1.85
    // Center Y = sum of all posY / 12 = approx 0.017
    // The actual crossing timestamps will be computed internally
    expect(period).toBeGreaterThan(1.0)
    expect(period).toBeLessThan(2.5)
  })

  it('uses only upward crossings (velY > 0)', () => {
    // Downward crossing then upward crossing
    // velY <= 0 should be SKIPPED
    const samples: TelemetrySample[] = [
      makeSample(0.0, -1.0, 2.0),  // upward, crossing
      makeSample(0.5, 1.0, 1.0),   // above
      makeSample(1.0, 1.5, -2.0),  // downward, NOT counted
      makeSample(1.5, 0.5, -1.0),  // downward
      makeSample(2.0, -0.5, -1.0), // downward
      makeSample(2.5, -1.0, 0.5),  // upward
      makeSample(3.0, -0.5, 2.0),  // upward, crossing
      makeSample(3.5, 0.5, 1.0),   // above
      makeSample(4.0, 1.0, 0.5),   // above
      makeSample(4.5, 0.8, -1.0),  // downward
    ]

    const period = calculatePeriod(samples)
    // Two upward crossings detected
    // VelY <= 0 is skipped (line 25 check)
    expect(period).toBeGreaterThan(0)
  })

  it('returns 0 for samples with no variation', () => {
    // All at same position - no crossings
    const samples = Array.from({ length: 20 }, (_, i) =>
      makeSample(i * 0.1, 0, 0)
    )
    expect(calculatePeriod(samples)).toBe(0)
  })

  it('handles sinusoidal oscillation', () => {
    // Pure sine wave with period = 2*PI
    const N = 200
    const samples = Array.from({ length: N }, (_, i) => {
      const t = i * (4 * Math.PI) / N  // 0 to 4*PI (two full periods)
      const y = Math.sin(t)
      const vy = Math.cos(t)
      // Add a tiny upward movement for zero-crossing detection
      return makeSample(t, y, vy)
    })

    const period = calculatePeriod(samples)
    // Should detect ~2*PI period
    expect(period).toBeGreaterThan(5.0)
    expect(period).toBeLessThan(8.0)
  })
})
