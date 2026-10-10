import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ProofCard from './ProofCard.jsx'
import { submitProof } from './api.js'

vi.mock('./api.js', () => ({ submitProof: vi.fn() }))
vi.mock('./images.js', () => ({ prepareImage: (file) => Promise.resolve(file) }))

const proof = (over = {}) => ({
  done: false, maxPerSubmission: 10,
  categories: [{ id: 1, name: "Fans' Choice", state: 'MISSING', count: 0 }],
  ...over
})
const files = (n) => Array.from({ length: n }, (_, i) => new File(['x'], `cert-${i}.png`, { type: 'image/png' }))
const pick = (n) => fireEvent.change(document.getElementById('proof-file-1'), { target: { files: files(n) } })

describe('ProofCard', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => `blob:${Math.random()}`)
    URL.revokeObjectURL = vi.fn()
  })
  afterEach(cleanup)

  it('takes any number of certificates and sends them a few at a time', async () => {
    submitProof.mockResolvedValue({})
    const onChanged = vi.fn()
    render(<ProofCard crewId="c1" proof={proof()} onChanged={onChanged} />)
    pick(25)
    fireEvent.click(screen.getByRole('button', { name: 'Send proof (25)' }))
    await waitFor(() => expect(onChanged).toHaveBeenCalled())
    expect(submitProof.mock.calls.map(([, batch]) => batch.length)).toEqual([10, 10, 5])
  })

  it('an approved category still takes more certificates', () => {
    render(<ProofCard crewId="c1" onChanged={() => {}}
                      proof={proof({ done: true, categories: [{ id: 1, name: "Fans' Choice", state: 'APPROVED', count: 3 }] })} />)
    expect(screen.getByText('3 certificates sent today')).toBeTruthy()
    pick(2)
    expect(screen.getByRole('button', { name: 'Send proof (2)' })).toBeTruthy()
  })

  it('keeps what did not go up, ready to send again', async () => {
    submitProof.mockResolvedValueOnce({}).mockRejectedValueOnce(Object.assign(new Error('x'), { status: 0 }))
    render(<ProofCard crewId="c1" proof={proof()} onChanged={() => {}} />)
    pick(15)
    fireEvent.click(screen.getByRole('button', { name: 'Send proof (15)' }))
    expect(await screen.findByRole('button', { name: 'Send proof (5)' })).toBeTruthy()
    expect(screen.getByRole('alert').textContent).toMatch(/Couldn't send/)
  })
})
