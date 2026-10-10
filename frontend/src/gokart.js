// Go Kart: a practice race the fan runs alone, on their phone. Nothing here talks to the server.
import acorn from './assets/gokart/acorn.png'
import potato from './assets/gokart/potato.png'

export const KARTS = {
  acorn:  { slug: 'acorn',  name: 'Acorn',  number: '07', color: '#C8843E', img: acorn },
  potato: { slug: 'potato', name: 'Potato', number: '22', color: '#F2B544', img: potato }
}

export const rivalOf = (slug) => (slug === 'acorn' ? KARTS.potato : KARTS.acorn)

export const CATEGORY = "Fans' Choice"
export const REJECT_REASON = 'Not readable'
export const MAX_SHOTS = 5
const MIN_SIDE = 300

const DONE_KEY = 'e1.gokart.done'

export function practiceDone() {
  try { return localStorage.getItem(DONE_KEY) === '1' } catch { return false }
}

export function rememberPractice() {
  try { localStorage.setItem(DONE_KEY, '1') } catch { /* no storage */ }
}

/**
 * The practice "review" that runs on the phone: the file has to open as an image, be big enough to read and
 * have the shape of an MNET Plus voting certificate (taller than wide).
 * Resolves to null when it's fine, or to what's wrong.
 */
export function checkCertificate(file) {
  return new Promise((resolve) => {
    if (!file.type?.startsWith('image/')) { resolve("That isn't an image. Pick a voting certificate you saved from MNET Plus."); return }
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const { naturalWidth: w, naturalHeight: h } = img
      if (Math.min(w, h) < MIN_SIDE) resolve('That image is too small to read. Pick the certificate as you saved it from MNET Plus.')
      // MNET Plus certificates are tall cards; a wide image is something else
      else if (w >= h) resolve("That doesn't look like a voting certificate: they're taller than wide. Pick the one you saved from MNET Plus.")
      else resolve(null)
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve("That image can't be opened. Try another certificate.") }
    img.src = url
  })
}
