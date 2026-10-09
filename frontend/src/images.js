export const MAX_CERTIFICATE_BYTES = 8 * 1024 * 1024

// Validate without canvas, re-encoding, resizing or changing the uploaded bytes.
export async function validateOriginalCertificate(file) {
  if (file.size > MAX_CERTIFICATE_BYTES) throw new Error('The original certificate exceeds 8 MB. Check the source file; do not compress or edit the proof.')
  const data = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const jpeg = data.length >= 3 && data[0] === 255 && data[1] === 216 && data[2] === 255
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((byte, i) => data[i] === byte)
  const webp = data.length >= 12 && String.fromCharCode(...data.slice(0, 4)) === 'RIFF' && String.fromCharCode(...data.slice(8, 12)) === 'WEBP'
  if (!jpeg && !png && !webp) throw new Error('Choose an original JPEG, PNG or WebP certificate.')
  return file
}
