import * as core from '@actions/core'
import { context } from '@actions/github'
import * as exec from '@actions/exec'

const getInputs = () => {
  return {
    customMessage1: core.getInput('message1'),
    customMessage2: core.getInput('message2')
  }
}
export async function run() {
  try {
    // get inputs
    const inputs = getInputs()

    let sha = ''
    if (context.eventName === 'push') {
      core.group('This action only supports push events.', () => {
        core.info('This action only supports push events.')
        core.info(`branch = ${context.ref.replace('refs/heads/', '')}`)
        core.info(`repository = ${context.payload.repository?.name}`)
        core.info(`actor = ${context.actor}`)
        core.info(`sha = ${context.sha}`)
      })
      sha = context.sha
    } else if (context.eventName === 'pull_request') {
      core.info('This action does not support pull request events.')
      core.info(`branch = ${context.payload.pull_request?.head.ref}`)
      core.info(`repository = ${context.payload.repository?.name}`)
      core.info(`actor = ${context.actor}`)
      core.info(`sha = ${context.payload.pull_request?.head.sha}`)
      sha = context.payload.pull_request?.head.sha
    }
    const execOptions = {
      ignoreReturnCode: true
      //silent: !core.isDebug()
    }
    // Get the latest commit message
    const { stdout } = await exec.getExecOutput('git', ['show', '-s', '--format=%B', sha], execOptions)
    const commitMessage = stdout.trim()

    // Get the list of changed files from the latest commit
    const { stdout: changedFilesStdout } = await exec.getExecOutput('git', ['diff-tree', '--no-commit-id', '--name-only', '-r', sha], execOptions)
    const changedFiles = changedFilesStdout.trim().split('\n')

    core.group('Inputs', () => {
      core.info(`inputs: ${JSON.stringify(inputs, null, 2)}`)
      core.info(`commit message: ${commitMessage}`)
      core.info(`changed files: ${changedFiles}`)
      core.info(`context: ${JSON.stringify(context, null, 2)}`)
    })

    core.group('Result', () => core.info('Message sent successfully.'))
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}
