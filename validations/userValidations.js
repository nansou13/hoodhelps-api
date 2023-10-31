const { createJoiSchema } = require('../utils')

const registerValidation = (data) => {
  const schema = createJoiSchema({
    username: { type: 'string', required: true },
    email: { type: 'string', required: true, email: true },
    password: { type: 'string', required: true },
  })

  return schema.validate(data)
}

const loginValidation = (data) => {
  const schema = createJoiSchema({
    username: { type: 'string', required: true },
    password: { type: 'string', required: true },
  })

  return schema.validate(data)
}

const updateValidation = (data) => {
  const schema = createJoiSchema({
    email: { type: 'string', email: true },
    username: { type: 'string' },
    first_name: { type: 'string' },
    last_name: { type: 'string' },
    image_url: {
      type: 'string',
      pattern: '^(https?:\\/\\/)?([\\da-z.-]+)\\.([a-z.]{2,6})([\\/\\w .-]*)*\\/?$',
      description: "URL de l'image de profil",
    },
    date_of_birth: { type: 'string', pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' }, // Format YYYY-MM-DD
    phone_number: { type: 'string', pattern: '^[0-9]+$' }, // Only numbers allowed
  })
  return schema.validate(data)
}

const linkJobValidation = (data) => {
  const schema = createJoiSchema({
    profession_id: { type: 'uuid', required: true },
    description: { type: 'string' },
    experience_years: { type: 'number' },
  })
  return schema.validate(data)
}

const jobByIDValidation = (data) => {
  const schema = createJoiSchema({
    id: { type: 'uuid', required: true },
  })
  return schema.validate(data)
}
const userIDValidation = (data) => {
  const schema = createJoiSchema({
    id: { type: 'uuid', required: true },
  })
  return schema.validate(data)
}

module.exports = {
  registerValidation,
  loginValidation,
  updateValidation,
  linkJobValidation,
  jobByIDValidation,
  userIDValidation,
}
