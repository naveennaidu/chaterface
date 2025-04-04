// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/react";

const rules = {
  conversations: {
    allow: {
      view: "data.userId == ruleParams.userId",
      create: "true",
      update: "data.userId == ruleParams.userId",
      delete: "data.userId == ruleParams.userId",
    },
  },
  messages: {
    allow: {
      view: "data.userId == ruleParams.userId || data.ref('conversation.userId') == ruleParams.userId",
      create: "true",
      update: "data.userId == ruleParams.userId || data.ref('conversation.userId') == ruleParams.userId",
      delete: "data.userId == ruleParams.userId || data.ref('conversation.userId') == ruleParams.userId",
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
