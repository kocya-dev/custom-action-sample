import * as core from '@actions/core'
import { context } from '@actions/github'

const titleBlock = {
  type: 'TextBlock',
  text: 'No. {GITHUB_RUN_ID} {COMMIT_MESSAGE}',
  id: 'Title',
  spacing: 'Medium',
  size: 'ExtraLarge',
  weight: 'Bolder',
  color: 'Accent'
}

const jobStatusBlock = {
  type: 'TextBlock',
  text: '{JOB_STATUS}',
  separator: true,
  wrap: true
}

const singleTextBlockCustom1 = {
  type: 'TextBlock',
  text: '{CUSTOM_MESSAGE_1}',
  separator: true,
  wrap: true
}

const singleTextBlockCustom2 = {
  type: 'TextBlock',
  text: '{CUSTOM_MESSAGE_2}',
  separator: true,
  wrap: true
}

const factBlock = {
  type: 'FactSet',
  facts: [
    {
      title: 'Repository-Branch:',
      value: '{GITHUB_REPOSITORY} - {BRANCH}'
    },
    {
      title: 'Event-Workflow-Actor:',
      value: '{GITHUB_EVENT_NAME} - {GITHUB_WORKFLOW} - {GITHUB_ACTOR}'
    },
    {
      title: 'SHA-1:',
      value: '{GITHUB_WORKFLOW_SHA}'
    },
    {
      title: 'Changed files:',
      value: '{CHANGED_FILES}'
    }
  ],
  id: 'acFactSet'
}

/**
 * Retrieves the status from the job context.
 *
 * @returns {string} The status of the job.
 */
const getStatus = () => {
  return JSON.parse(context.job).status
}

/**
 * Constructs the URL for the current GitHub Actions workflow run.
 *
 * @returns {string} The URL of the current workflow run.
 */
const getWorkflowUrl = () => {
  return `${context.serverUrl}/${context.payload.repository?.name}/actions/runs/${context.runId}`
}

/**
 * Retrieves the branch name from the context, stripping the "refs/heads/" prefix.
 *
 * @returns {string} The name of the branch.
 */
const getBranch = () => {
  // context.ref の "refs/heads/" プレフィックスを除去する
  return context.ref ? context.ref.replace('refs/heads/', '') : ''
}

/**
 * Creates an array of actions based on the provided action parameters.
 *
 * @param {Array} actionParams - The parameters for the actions to be created.
 * @returns {Array} The array of action objects.
 */
export const makeAction = (titles, urls) => {
  const actions = []
  if (titles.length != urls.length) {
    core.error('Action titles and URLs must have the same length.')
    throw new Error('Action titles and URLs must have the same length.')
  }

  // If no action parameters are provided, return the default action to view the workflow.
  if (titles.length == 0 || urls.length == 0) {
    actions.push({
      type: 'Action.OpenUrl',
      title: 'View Workflow',
      url: getWorkflowUrl()
    })
    return actions
  }
  // Create an action for each parameter provided.
  for (let i = 0; i < titles.length; i++) {
    if (!titles[i] || !urls[i]) {
      core.error('Action titles and URLs must have the same length.')
      throw new Error('Action parameters must contain a title and URL.')
    }
    actions.push({
      type: 'Action.OpenUrl',
      title: titles[i],
      url: urls[i]
    })
  }
  return actions
}
/**
 * Creates a default body for a message with optional custom messages and commit details.
 *
 * @param {string} customMessage1 - The first custom message to include in the body.
 * @param {string} customMessage2 - The second custom message to include in the body.
 * @param {string} commitMessage - The commit message to include in the body.
 * @param {Array} changedFiles - The list of changed files to include in the body.
 * @returns {Object} The constructed body object with the provided parameters.
 */
export const makeDefaultBody = (customMessage1, customMessage2, commitMessage, changedFiles) => {
  const body = []
  body.push(titleBlock)
  body.push(jobStatusBlock)
  if (customMessage1) {
    body.push(singleTextBlockCustom1)
  }
  body.push(factBlock)
  if (customMessage2) {
    body.push(singleTextBlockCustom2)
  }
  return JSON.parse(replaceBodyParameters(JSON.stringify(body), customMessage1, customMessage2, commitMessage, changedFiles))
}

/**
 * Replaces placeholders in the target string with provided values.
 *
 * @param {string} target - The string containing placeholders to be replaced.
 * @param {string} customMessage1 - Custom message to replace the {CUSTOM_MESSAGE_1} placeholder.
 * @param {string} customMessage2 - Custom message to replace the {CUSTOM_MESSAGE_2} placeholder.
 * @param {string} commitMessage - Commit message to replace the {COMMIT_MESSAGE} placeholder.
 * @param {string} changedFiles - List of changed files to replace the {CHANGED_FILES} placeholder.
 * @returns {string} - The target string with all placeholders replaced by their corresponding values.
 */
export const replaceBodyParameters = (target, customMessage1, customMessage2, commitMessage, changedFiles) => {
  return target
    .replace('{GITHUB_RUN_ID}', context.runId)
    .replace('{COMMIT_MESSAGE}', commitMessage)
    .replace('{JOB_STATUS}', getStatus())
    .replace('{CUSTOM_MESSAGE_1}', customMessage1)
    .replace('{GITHUB_REPOSITORY}', context.payload.repository?.name)
    .replace('{BRANCH}', getBranch())
    .replace('{GITHUB_EVENT_NAME}', context.eventName)
    .replace('{GITHUB_WORKFLOW}', context.workflow)
    .replace('{GITHUB_ACTOR}', context.actor)
    .replace('{GITHUB_WORKFLOW_SHA}', context.sha)
    .replace('{CHANGED_FILES}', changedFiles)
    .replace('{CUSTOM_MESSAGE_2}', customMessage2)
}
