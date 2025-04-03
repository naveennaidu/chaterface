// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/react";

const rules = {
  conversations: {
    allow: {
      view: "data.sessionId == ruleParams.sessionId",
      create: "true",
      update: "data.sessionId == ruleParams.sessionId",
      delete: "data.sessionId == ruleParams.sessionId",
    },
  },
  messages: {
    allow: {
      view: "data.ref('conversation.sessionId') == ruleParams.sessionId",
      create: "true",
      update: "data.ref('conversation.sessionId') == ruleParams.sessionId",
      delete: "data.ref('conversation.sessionId') == ruleParams.sessionId",
    },
  },
  $files: {
    allow: {
      view: "true",
      create: "true",
      delete: "true"
    }
  }
} satisfies InstantRules;

export default rules;
