import type { RecordingState } from '@/features/sandbox/sandboxStore'

/**
 * Exports recorded frames as a WebM video using MediaRecorder API.
 * Creates a temporary canvas, replays the recorded frames, and captures
 * the canvas output as a video stream.
 */
export function exportRecordingAsWebM(recording: RecordingState): void {
  const { frames } = recording
  if (frames.length === 0) return

  const canvas = document.createElement('canvas')
  canvas.width = 1280
  canvas.height = 720
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const stream = canvas.captureStream(30)
  const chunks: Blob[] = []

  const mediaRecorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9',
    videoBitsPerSecond: 5000000,
  })

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      chunks.push(e.data)
    }
  }

  mediaRecorder.onstop = () => {
    const blob = new Blob(chunks, { type: 'video/webm' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sandbox-recording-${Date.now()}.webm`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  mediaRecorder.start()

  // Render each frame onto the canvas
  let frameIndex = 0
  const renderFrame = () => {
    if (frameIndex >= frames.length) {
      mediaRecorder.stop()
      return
    }

    // Clear canvas
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const frame = frames[frameIndex]
    const bodyIds = Object.keys(frame.bodies)

    // Draw a simple top-down representation of bodies
    for (const id of bodyIds) {
      const body = frame.bodies[id]
      const [px, , pz] = body.position

      // Map 3D world coords to 2D canvas coords (top-down view)
      const cx = canvas.width / 2 + px * 50
      const cy = canvas.height / 2 - pz * 50

      const radius = Math.max(8, 12)
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.fillStyle = `hsl(${(Number.parseInt(id.slice(-4), 16) || 0) % 360}, 70%, 55%)`
      ctx.fill()
      ctx.strokeStyle = '#ffffff44'
      ctx.lineWidth = 1
      ctx.stroke()

      // Draw velocity vector
      const [vx, , vz] = body.velocity
      const vScale = 5
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx + vx * vScale, cy - vz * vScale)
      ctx.strokeStyle = '#ff4444'
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // Draw frame info
    ctx.fillStyle = '#ffffffaa'
    ctx.font = '12px monospace'
    ctx.fillText(`Frame ${frameIndex + 1}/${frames.length}  t=${frame.time.toFixed(2)}s`, 10, 20)

    frameIndex++
    // Schedule next frame ~33ms apart (30fps)
    setTimeout(renderFrame, 33)
  }

  setTimeout(renderFrame, 100)
}

/**
 * Exports the recorded frames as a JSON file.
 */
export function exportRecordingAsJSON(recording: RecordingState): void {
  const { frames, fps } = recording
  const exportData = { fps, frames, exportedAt: new Date().toISOString() }
  const json = JSON.stringify(exportData, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `sandbox-recording-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
