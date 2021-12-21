const { model, Schema } = require("mongoose");

const modelSchema = new Schema({
  caseId: { type: String, default: null },
  guildId: { type: String, default: null },
  type: { type: String, default: null },

  moderator: {
    id: { type: String, default: null },
    tag: { type: String, default: null },
  },
  victim: {
    id: { type: String, default: null },
    tag: { type: String, default: null },
  },

  reason: { type: String, default: null },
  modlog: {
    channelId: { type: String, default: null },
    messageId: { type: String, default: null },
  },

  extras: { type: Object, default: {} },
  
  updatedAt: { type: Date, default: () => new Date().toISOString() },
  createdAt: { type: Date, default: () => new Date().toISOString() },
});

module.exports = {
  schema: modelSchema,
  model: model("cases", modelSchema),
};