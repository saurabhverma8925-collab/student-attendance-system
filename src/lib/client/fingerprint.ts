'use client'

// Generates a stable browser fingerprint hash from canvas, user-agent,
// screen, timezone. Used to enforce one-device-per-student (instead of phone IP).
export async function getBrowserFingerprint(): Promise<string> {
  const components: string[] = []

  // User-agent + language + platform
  components.push(navigator.userAgent)
  components.push(navigator.language)
  components.push((navigator as any).platform || '')
  components.push(String(screen.width) + 'x' + String(screen.height))
  components.push(String(screen.colorDepth))
  components.push(String(window.devicePixelRatio))
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone)
  components.push(String(new Date().getTimezoneOffset()))

  // Canvas fingerprint
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 240
    canvas.height = 60
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.textBaseline = 'top'
      ctx.font = '14px Arial'
      ctx.fillStyle = '#f60'
      ctx.fillRect(125, 1, 62, 20)
      ctx.fillStyle = '#069'
      ctx.fillText('Attendly-fp-Ω≈', 2, 15)
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
      ctx.fillText('Attendly-fp-Ω≈', 4, 17)
      const dataUrl = canvas.toDataURL()
      components.push(dataUrl.slice(-200))
    }
  } catch {
    // ignore
  }

  // WebRTC IP leakage would be the closest analog to "phone IP" but
  // we intentionally avoid it for privacy. Stick to non-network signals.

  // Hash with sha-256
  const text = components.join('|')
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  const arr = Array.from(new Uint8Array(buf))
  return arr.map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Simulated biometric capture — in a real app you'd use WebAuthn / PublicKeyCredential.
// Here we return a pseudo-template derived from the canvas fingerprint + a per-session nonce.
export async function simulateBiometricCapture(): Promise<{
  template: string
}> {
  // Add small random nonce so each scan is unique (like a real biometric)
  const nonce = Math.random().toString(36).slice(2) + Date.now().toString(36)
  const fp = await getBrowserFingerprint()
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(fp + ':' + nonce),
  )
  const arr = Array.from(new Uint8Array(buf))
  const template = arr.map((b) => b.toString(16).padStart(2, '0')).join('')
  return { template }
}
