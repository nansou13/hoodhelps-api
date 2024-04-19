const { createJoiSchema } = require('../utils')

const chatMessageSendMessage = (data) => {
  const schema = createJoiSchema({
    group_id: { type: 'uuid', required: true },
    content: { type: 'string', required: true },
  })

  return schema.validate(data)
}

module.exports = {
  chatMessageSendMessage,
}
