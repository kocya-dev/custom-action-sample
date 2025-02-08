import * as core from '@actions/core'
import { execSync } from 'child_process'

export async function run() {
  try {
    // inputs の取得
    const token = core.getInput('token')
    const webhookUrl = core.getInput('webhook-url')
    const customMessage = core.getInput('message')

    // GitHub Actions の環境変数から基本情報を取得
    const sha = process.env.GITHUB_SHA
    const repository = process.env.GITHUB_REPOSITORY
    const ref = process.env.GITHUB_REF
    // ブランチ名は "refs/heads/xxx" の形式のため、分割して取得
    const branch = ref ? ref.split('/').slice(2).join('/') : 'unknown'

    // 最新コミットのコミットメッセージ取得
    const commitMessage = execSync(`git show -s --format=%B ${sha}`, {
      encoding: 'utf8'
    }).trim()

    // 最新コミットの変更ファイル一覧取得
    const changedFiles = execSync(
      `git diff-tree --no-commit-id --name-only -r ${sha}`,
      { encoding: 'utf8' }
    ).trim()

    // Adaptive Card のメッセージ内容の作成
    const messageText = `
Custom Message: ${customMessage}
Commit SHA: ${sha}
Repository: ${repository}
Branch: ${branch}
Commit Message: ${commitMessage}
Changed Files:
${changedFiles}
    `.trim()

    // 旧: const payload = { body: [ ... ] };
    // 新: payloadのAdaptive Card形式に変更
    const payload = {
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
                text: JSON.stringify(messageText),
                wrap: true,
                markdown: true
              }
            ]
          }
        }
      ]
    }
    console.log(JSON.stringify(payload, null, 2))
    // webhook-url に POST で Adaptive Card を送信
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: payload
    })

    if (!response.ok) {
      throw new Error(`Request failed: ${response.statusText}`)
    }

    core.debug(`Message sent successfully.`)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}
