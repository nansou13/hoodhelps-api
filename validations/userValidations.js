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
    username: { type: 'string', allowEmpty: true },
    first_name: { type: 'string', allowEmpty: true },
    last_name: { type: 'string', allowEmpty: true },
    image_url: {
      type: 'string',
      pattern: '^(https?:\\/\\/)?([\\w.-]+)([\\/\\w .-]*)([\\?&][\\w=&.-]+)*$',
      description: "URL de l'image de profil",
      allowEmpty: true,
    },
    date_of_birth: { type: 'string', allowEmpty: true, pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' }, // Format YYYY-MM-DD
    phone_number: { type: 'string', allowEmpty: true, pattern: '^[0-9]+$' }, // Only numbers allowed
  })
  return schema.validate(data)
}

const linkJobValidation = (data) => {
  const schema = createJoiSchema({
    profession_id: { type: 'uuid', required: true },
    description: { type: 'string', allowEmpty: true },
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

const updateJobValidation = (data) => {
  const schema = createJoiSchema({
    description: { type: 'string', allowEmpty: true },
    experience_years: { type: 'number' },
  })
  return schema.validate(data)
}

const emailValidation = (data) => {
  const schema = createJoiSchema({
    email: { type: 'string', required: true, email: true },
  })

  return schema.validate(data)
}

const resetPasswordValidation = (data) => {
  const schema = createJoiSchema({
    resetCode: { type: 'string', required: true, min: 6, max: 6 },
    newPassword: { type: 'string', required: true },
    newPassword2: {
      type: 'match',
      matches: 'newPassword',
      required: true,
    },
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
  updateJobValidation,
  emailValidation,
  resetPasswordValidation,
}
