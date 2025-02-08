// 新規ファイル: Jestを用いたテストケース

import { jest } from '@jest/globals'
import * as core from '../__fixtures__/core.js'

// Mocking modules
jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('child_process', () => ({
  execSync: jest.fn().mockImplementation(() => 'dummy output')
}))
global.fetch = jest
  .fn()
  .mockImplementation(Promise.resolve({ ok: true, statusText: 'OK' }))

const { run } = await import('../src/main.js')

describe('Custom Action Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.GITHUB_SHA = 'dummySHA'
    process.env.GITHUB_REPOSITORY = 'dummyRepo'
    process.env.GITHUB_REF = 'refs/heads/dummyBranch'
  })

  it('sends correct adaptive card payload', async () => {
    core.getInput.mockImplementation((name) => {
      if (name === 'token') return 'dummyToken'
      if (name === 'webhook-url') return 'https://dummy.url'
      if (name === 'message') return 'dummyMessage'
      return ''
    })

    await run()

    const expectedMessageText = `
Custom Message: dummyMessage
Commit SHA: dummySHA
Repository: dummyRepo
Branch: dummyBranch
Commit Message: dummy output
Changed Files:
dummy output
    `.trim()

    expect(fetch).toHaveBeenCalledWith(
      'https://dummy.url',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          attachments: [
            {
              contentType: 'application/vnd.microsoft.card.adaptive',
              content: {
                $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
                type: 'AdaptiveCard',
                version: '1.2',
                body: [
                  {
                    type: 'TextBlock',
                    text: JSON.stringify(expectedMessageText),
                    wrap: true,
                    markdown: true
                  }
                ]
              }
            }
          ]
        }
      })
    )
  })
})
