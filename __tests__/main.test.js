import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'
import { context } from '../__fixtures__/context.js'

jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/github', () => {
  return { context }
})
jest.unstable_mockModule('child_process', () => ({
  execSync: jest.fn().mockImplementation(() => 'dummy output')
}))
context.runId = '123'
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
context.job = JSON.stringify({ status: 'success' })
context.serverUrl = 'https://github.com'

global.fetch = jest.fn().mockImplementation(() => Promise.resolve({ ok: true, statusText: 'OK' }))

const { run } = await import('../src/main.js')

describe('Custom Action Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('sends correct adaptive card payload when no template is provided', async () => {
    core.getInput.mockImplementation((name) => {
      if (name === 'token') return 'dummyToken'
      if (name === 'webhook-url') return 'https://dummy.url'
      if (name === 'template') return ''
      if (name === 'message1') return 'dummyMessage1'
      if (name === 'message2') return 'dummyMessage2'
      if (name === 'action-titles') return 'Title1\nTitle2'
      if (name === 'action-urls') return 'https://url1\nhttps://url2'
      return ''
    })

    await run()

    // Validate that fetch was called with the expected parameters.
    expect(fetch).toHaveBeenCalledWith(
      'https://dummy.url',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        // Due to processing in run, the body is created by createAdapterCardPayload.
        // We validate that it has an attachments array with the adaptive card payload.
        body: expect.objectContaining({
          attachments: expect.any(Array)
        })
      })
    )
  })

  it('sends adaptive card payload using template', async () => {
    core.getInput.mockImplementation((name) => {
      if (name === 'token') return 'dummyToken'
      if (name === 'webhook-url') return 'https://dummy.url'
      if (name === 'template') return './__tests__/assets/template.json'
      if (name === 'message1') return 'dummyMessage1'
      if (name === 'message2') return 'dummyMessage2'
      if (name === 'action-titles') return 'Title1'
      if (name === 'action-urls') return 'https://url1'
      return ''
    })

    await run()

    const expectedTemplate = [
      { type: 'TextBlock', text: '123', wrap: true },
      { type: 'TextBlock', text: 'dummy output', wrap: true },
      { type: 'TextBlock', text: 'success', wrap: true },
      { type: 'TextBlock', text: 'dummyMessage1', wrap: true },
      { type: 'TextBlock', text: 'test-repo', wrap: true },
      { type: 'TextBlock', text: 'main', wrap: true },
      { type: 'TextBlock', text: 'push', wrap: true },
      { type: 'TextBlock', text: 'CI', wrap: true },
      { type: 'TextBlock', text: 'test-actor', wrap: true },
      { type: 'TextBlock', text: 'abc123', wrap: true },
      { type: 'TextBlock', text: 'dummy output', wrap: true },
      { type: 'TextBlock', text: 'dummyMessage2', wrap: true }
    ]
    const expectedActions = [
      {
        type: 'Action.OpenUrl',
        title: 'Title1',
        url: 'https://url1'
      }
    ]

    expect(fetch).toHaveBeenCalledWith(
      'https://dummy.url',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: expect.objectContaining({
          attachments: [
            {
              contentType: 'application/vnd.microsoft.card.adaptive',
              content: expect.objectContaining({
                body: expectedTemplate,
                actions: expectedActions
              })
            }
          ]
        })
      })
    )
  })

  it('calls core.setFailed if an error occurs during execution', async () => {
    // Force execSync to throw an error.
    const { execSync } = await import('child_process')
    execSync.mockImplementationOnce(() => {
      throw new Error('dummy error')
    })

    core.getInput.mockImplementation((name) => {
      if (name === 'token') return 'dummyToken'
      if (name === 'webhook-url') return 'https://dummy.url'
      if (name === 'template') return ''
      if (name === 'message1') return 'dummyMessage1'
      if (name === 'message2') return 'dummyMessage2'
      if (name === 'action-titles') return ''
      if (name === 'action-urls') return ''
      return ''
    })

    await run()

    expect(core.setFailed).toHaveBeenCalledWith('dummy error')
  })

  it('calls core.setFailed when template file cannot be opened', async () => {
    core.getInput.mockImplementation((name) => {
      if (name === 'token') return 'dummyToken'
      if (name === 'webhook-url') return 'https://dummy.url'
      if (name === 'template') return './nonexistent/template.json'
      if (name === 'message1') return 'dummyMessage1'
      if (name === 'message2') return 'dummyMessage2'
      if (name === 'action-titles') return ''
      if (name === 'action-urls') return ''
      return ''
    })
    await run()
    expect(core.setFailed).toHaveBeenCalled()
    expect(core.setFailed.mock.calls[0][0]).toMatch(/Failed to load template/)
  })

  it('calls core.setFailed when webhook responds with non-ok status', async () => {
    global.fetch.mockImplementationOnce(() => Promise.resolve({ ok: false, statusText: 'Internal Server Error' }))
    core.getInput.mockImplementation((name) => {
      if (name === 'token') return 'dummyToken'
      if (name === 'webhook-url') return 'https://dummy.url'
      if (name === 'template') return ''
      if (name === 'message1') return 'dummyMessage1'
      if (name === 'message2') return 'dummyMessage2'
      if (name === 'action-titles') return 'Title1\nTitle2'
      if (name === 'action-urls') return 'https://url1\nhttps://url2'
      return ''
    })
    await run()
    expect(core.setFailed).toHaveBeenCalledWith(expect.stringMatching(/Request failed: Internal Server Error/))
  })
})
