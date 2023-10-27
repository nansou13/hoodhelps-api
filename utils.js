/* eslint-disable func-names */
/* eslint-disable no-restricted-syntax */
const Joi = require('joi')

const createJoiSchema = function (fields) {
  const schema = {}

  for (const [key, value] of Object.entries(fields)) {
    let validator

    switch (value.type) {
      case 'string':
        validator = Joi.string()
        if (value.min) validator = validator.min(value.min)
        if (value.max) validator = validator.max(value.max)
        if (value.email) validator = validator.email()
        if (value.pattern) validator = validator.pattern(new RegExp(value.pattern))
        break

      case 'number':
        validator = Joi.number()
        if (value.min) validator = validator.min(value.min)
        if (value.max) validator = validator.max(value.max)
        break

      case 'boolean':
        validator = Joi.boolean()
        break

      case 'uuid':
        validator = Joi.string().guid({ version: value.version || 'uuidv4' })
        break

      case 'array':
        validator = Joi.array()
        if (value.items) {
          const itemValidator = createJoiSchema({
            items: value.items,
          }).extract('items')
          validator = validator.items(itemValidator)
        }
        break

      case 'object':
        if (value.properties) {
          const objectValidator = createJoiSchema(value.properties)
          validator = Joi.object().keys(objectValidator)
        }
        break

      default:
        throw new Error(`Type de validation inconnu: ${value.type}`)
    }

    if (value.required) {
      validator = validator.required()
    }

    if (value.default) {
      validator = validator.default(value.default)
    }

    schema[key] = validator
  }

  return Joi.object(schema)
}

const makeid = function (length) {
  let result = ''
  const characters = 'abcdefghijklmnopqrstuvwxyz'
  const charactersLength = characters.length
  for (let i = 0; i < length; i += 1) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

module.exports = {
  makeid,
  createJoiSchema,
}
