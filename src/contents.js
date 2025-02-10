import {context} from '@actions/github'

export const defaultBody = [
    {
      "type": "TextBlock",
      "text": "No. {GITHUB_RUN_ID} {COMMIT_MESSAGE}",
      "id": "Title",
      "spacing": "Medium",
      "size": "ExtraLarge",
      "weight": "Bolder",
      "color": "Accent"
    },
    {
      "type": "TextBlock",
      "text": "{CUSTOM_MESSAGE_1}",
      "separator": true,
      "wrap": true
    },
    {
      "type": "FactSet",
      "facts": [
          {
              "title": "Repository-Branch:",
              "value": "{GITHUB_REPOSITORY} - {BRANCH}"
          },
          {
              "title": "Event-Workflow-Actor:",
              "value": "{GITHUB_EVENT_NAME} - {GITHUB_WORKFLOW} - {GITHUB_ACTOR}"
          },
          {
              "title": "SHA-1:",
              "value": "{GITHUB_WORKFLOW_SHA}"
          },
          {
              "title": "Changed files:",
              "value": "{CHANGED_FILES}"
          }
      ],
      "id": "acFactSet"
    },
    {
      "type": "TextBlock",
      "text": "{CUSTOM_MESSAGE_2}",
      "separator": true,
      "wrap": true
    },
];
const defaultAction = [
    {
      "type": "Action.OpenUrl",
      "title": "URL",
      "url": "{LINK_URL}"
    }
  ];

const getStatus = () => {
  return JSON.parse(context.job).status;
}
const getWorkflowUrl = () => {
    return `${context.serverUrl}/${context.payload.repository?.name}/actions/runs/${context.runId}`;
};

export const getAction = (url) => {
    return defaultAction.replace("{LINK_URL}", url || getWorkflowUrl());
};