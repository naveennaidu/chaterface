// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.any(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),
    conversations: i.entity({
      name: i.string(),
      createdAt: i.date().indexed(),
      userId: i.string().indexed(),
    }),
    messages: i.entity({
      role: i.string(),
      content: i.string(),
      createdAt: i.date(),
      model: i.string(),
      userId: i.string().indexed(),
    }),
  },
  links: {
    conversationMessages: {
      forward: { on: "messages", has: "one", label: "conversation" },
      reverse: { on: "conversations", has: "many", label: "messages" }
    },
  },
  rooms: {},
});

// This helps Typescript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
