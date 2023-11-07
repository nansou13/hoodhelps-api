const { createJoiSchema } = require('../utils')

const groupsByIdValidation = (data) => {
  const schema = createJoiSchema({
    id: { type: 'uuid', required: true },
  })

  return schema.validate(data)
}

const createGroupsValidation = (data) => {
  const schema = createJoiSchema({
    name: { type: 'string', required: true, description: 'Nom du groupe' },
    address: { type: 'string', description: 'Adresse du groupe' },
    cp: {
      type: 'string',
      min: 5,
      max: 5,
      description: 'Code postal du groupe',
    },
    city: { type: 'string', description: 'Ville du groupe' },
    description: { type: 'string', allowEmpty: true, description: 'Description du groupe' },
    background_url: {
      type: 'string',
      pattern: '^(https?:\\/\\/)?([\\da-z.-]+)\\.([a-z.]{2,6})([\\/\\w .-]*)*\\/?$',
      description: "URL de l'arrière-plan du groupe",
      allowEmpty: true,
    },
  })

  return schema.validate(data)
}

const groupsUpdateValidation = (data) => {
  const schema = createJoiSchema({
    name: { type: 'string', description: 'Nom du groupe' },
    code: { type: 'string', description: 'Code du groupe' },
    address: { type: 'string', description: 'Adresse du groupe' },
    cp: {
      type: 'string',
      min: 5,
      max: 5,
      description: 'Code postal du groupe',
    },
    city: { type: 'string', description: 'Ville du groupe' },
    description: { type: 'string', description: 'Description du groupe' },
    background_url: {
      type: 'string',
      pattern: '^(https?:\\/\\/)?([\\da-z.-]+)\\.([a-z.]{2,6})([\\/\\w .-]*)*\\/?$',
      description: "URL de l'arrière-plan du groupe",
    },
  })

  return schema.validate(data)
}

const groupsByCodeValidation = (data) => {
  const schema = createJoiSchema({
    id: {
      type: 'string',
      required: true,
      pattern: /^[A-Za-z]{4}-[A-Za-z]{4}-[A-Za-z]{4}$/,
      description: "L'ID du groupe au format XXXX-XXXX-XXXX",
    },
  })

  return schema.validate(data)
}

const groupsAddUserValidation = (data) => {
  const schema = createJoiSchema({
    user_id: { type: 'uuid', required: true },
  })

  return schema.validate(data)
}

module.exports = {
  groupsByIdValidation,
  createGroupsValidation,
  groupsUpdateValidation,
  groupsByCodeValidation,
  groupsAddUserValidation,
}
