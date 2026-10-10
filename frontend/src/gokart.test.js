import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { KARTS, checkCertificate, practiceDone, rememberPractice, rivalOf } from './gokart.js'

// jsdom doesn't decode images: a fake Image "loads" with the size we give each file
const SIZES = {
  'certificate.png': [930, 1410],
  'wide.png': [900, 500],
  'tiny.png': [120, 200]
}

class FakeImage {
  set src(url) {
    const size = SIZES[url.replace('blob:', '')]
    queueMicrotask(() => {
      if (!size) { this.onerror?.(); return }
      ;[this.naturalWidth, this.naturalHeight] = size
      this.onload?.()
    })
  }
}

const file = (name, type = 'image/png') => new File(['x'], name, { type })

describe('checkCertificate', () => {
  beforeEach(() => {
    vi.stubGlobal('Image', FakeImage)
    URL.createObjectURL = vi.fn((f) => `blob:${f.name}`)
    URL.revokeObjectURL = vi.fn()
  })
  afterEach(() => vi.unstubAllGlobals())

  it('accepts an MNET Plus certificate: a tall image, big enough to read', async () => {
    expect(await checkCertificate(file('certificate.png'))).toBeNull()
  })

  it('refuses what is not an image', async () => {
    expect(await checkCertificate(file('notes.pdf', 'application/pdf'))).toMatch(/isn't an image/)
  })

  it('refuses a wide image: certificates are taller than wide', async () => {
    expect(await checkCertificate(file('wide.png'))).toMatch(/taller than wide/)
  })

  it('refuses an image too small to read', async () => {
    expect(await checkCertificate(file('tiny.png'))).toMatch(/too small/)
  })

  it('refuses an image that does not open', async () => {
    expect(await checkCertificate(file('broken.png'))).toMatch(/can't be opened/)
  })

  it('never keeps the file around', async () => {
    await checkCertificate(file('certificate.png'))
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:certificate.png')
  })
})

describe('karts', () => {
  afterEach(() => localStorage.clear())

  it('gives you the other kart as rival', () => {
    expect(rivalOf('acorn')).toBe(KARTS.potato)
    expect(rivalOf('potato')).toBe(KARTS.acorn)
  })

  it('remembers that the fan finished a practice race', () => {
    expect(practiceDone()).toBe(false)
    rememberPractice()
    expect(practiceDone()).toBe(true)
  })
})
