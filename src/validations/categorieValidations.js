const { createJoiSchema } = require('../utils')

const createCategorieValidation = (data) => {
  const schema = createJoiSchema({
    name: { type: 'string', description: 'Nom de la catégorie' },
  })

  return schema.validate(data)
}

const getCategorieByGroupIDValidation = (data) => {
  const schema = createJoiSchema({
    group_id: { type: 'uuid', required: true },
  })

  return schema.validate(data)
}

const categorieIdValidation = (data) => {
  const schema = createJoiSchema({
    id: { type: 'uuid', required: true },
  })

  return schema.validate(data)
}

const createJobValidation = (data) => {
  const schema = createJoiSchema({
    profession_name: {
      type: 'string',
      required: true,
      description: 'Nom de la profession',
      min: 2,
    },
  })

  return schema.validate(data)
}

const getUserFromGroupIDAndJobIDValidation = (data) => {
  const schema = createJoiSchema({
    groupId: { type: 'uuid', required: true },
    professionId: { type: 'uuid', required: true },
  })

  return schema.validate(data)
}

module.exports = {
  createCategorieValidation,
  getCategorieByGroupIDValidation,
  categorieIdValidation,
  createJobValidation,
  getUserFromGroupIDAndJobIDValidation,
}
