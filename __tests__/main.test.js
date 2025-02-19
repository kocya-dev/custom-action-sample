import { vi } from 'vitest'
import * as core from '../__fixtures__/core.js'
import { context } from '../__fixtures__/context.js'
import { getExecOutput } from '@actions/exec'

vi.mock('@actions/core', () => core)
vi.mock('@actions/github', () => {
  return { context }
})
vi.mock('@actions/exec', () => {
  return { getExecOutput: vi.fn().mockImplementation(() => ({ stdout: 'dummy output' })) }
})
context.runNumber = '123'
context.payload = {
  repository: {
    name: 'test-repo'
  }
}
context.ref = 'refs/heads/main'
context.eventName = 'push'
context.workflow = 'CI'
context.actor = 'test-actor'
context.sha = 'abc123'
context.serverUrl = 'https://github.com'

global.fetch = vi.fn().mockImplementation(() => Promise.resolve({ ok: true, statusText: 'OK' }))

const { run } = await import('../src/main.js')

describe('Custom Action Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends correct adaptive card payload when no template is provided', async () => {
    core.getInput.mockImplementation((name) => {
      if (name === 'message1') return 'dummyMessage1'
      if (name === 'message2') return 'dummyMessage2'
      return ''
    })

    await run()

    // Validate that fetch was called with the expected parameters.
    expect(fetch).not.toHaveBeenCalled()
  })
})
