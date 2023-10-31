/* eslint-disable camelcase */
/* eslint-disable no-useless-catch */
const bcrypt = require('bcrypt')
const pool = require('../db')
const { generateAccessToken, generateRefreshToken } = require('../token')
const { HTTP_STATUS } = require('../constants')

const registerUser = async (username, email, password) => {
  try {
    // Vérifie d'abord si un utilisateur avec le même username existe
    const existingUser = await pool.query('SELECT * FROM users WHERE username = $1', [username])

    if (existingUser.rows.length > 0) {
      // Si un utilisateur avec le même username existe, renvoyez une erreur
      return {
        errorCode: HTTP_STATUS.BAD_REQUEST,
        errorMessage: "Un utilisateur avec le même nom d'utilisateur existe déjà.",
      }
      // throw new Error("Un utilisateur avec le même nom d'utilisateur existe déjà.")
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [username, email, hashedPassword]
    )
    const userResult = result.rows[0]
    delete userResult.password_hash

    const accessToken = generateAccessToken(userResult)
    const refreshToken = generateRefreshToken(userResult)

    return { user: userResult, accessToken, refreshToken }
  } catch (err) {
    throw new Error(`Registration error: ${err.message}`)
  }
}

const loginUser = async (username, password) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username])

    if (result.rowCount !== 1) {
      throw new Error('access denied')
    }

    const isMatch = await bcrypt.compare(password, result.rows[0].password_hash)

    if (!isMatch) {
      throw new Error('access denied')
    }

    const userResult = result.rows[0]
    delete userResult.password_hash

    const accessToken = generateAccessToken(userResult)
    const refreshToken = generateRefreshToken(userResult)

    return { user: userResult, accessToken, refreshToken }
  } catch (err) {
    throw err
  }
}

const updateUser = async (userId, fieldsToUpdate) => {
  const fields = []
  const values = []
  let counter = 1

  Object.keys(fieldsToUpdate).forEach((key) => {
    fields.push(`${key} = $${counter}`)
    values.push(fieldsToUpdate[key])
    counter += 1
  })

  if (fields.length === 0) {
    return { noContent: true }
  }

  const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${counter} RETURNING *`
  values.push(userId)

  const result = await pool.query(query, values)

  if (result.rowCount === 0) {
    throw new Error('User not found')
  }

  const userResult = result.rows[0]
  delete userResult.password_hash

  return { user: userResult }
}

const linkJobToUser = async (userId, jobDetails) => {
  const { profession_id, description, experience_years } = jobDetails

  // Vérifie d'abord si le job existe
  const existingJob = await pool.query('SELECT * FROM professions WHERE id = $1', [profession_id])

  if (existingJob.rows.length === 0) {
    // Si un utilisateur avec le même username existe, renvoyez une erreur
    return {
      errorCode: HTTP_STATUS.BAD_REQUEST,
      errorMessage: "Ce métier n'existe pas.",
    }
    // throw new Error("Un utilisateur avec le même nom d'utilisateur existe déjà.")
  }

  const query = `
    INSERT INTO user_professions (user_id, profession_id, description, experience_years) 
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `

  const result = await pool.query(query, [userId, profession_id, description, experience_years])

  if (result.rowCount === 0) {
    throw new Error('Job link failed')
  }

  return result.rows[0]
}

const getUserById = async (userId) => {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId])

  if (result.rowCount === 0) {
    return {
      errorCode: HTTP_STATUS.BAD_REQUEST,
      errorMessage: "Ce user n'existe pas.",
    }
  }

  const userResult = result.rows[0]
  delete userResult.password_hash

  return userResult
}

const getUserJobs = async (userId, withoutProfessionId) => {
  let query = `
            SELECT * FROM user_professions
            WHERE user_id = $1 
        `

  const queryParams = [userId]

  if (withoutProfessionId) {
    query += 'AND profession_id != $2'
    queryParams.push(withoutProfessionId)
  }

  const result = await pool.query(query, queryParams)

  if (result.rowCount === 0) {
    return []
  }

  return result.rows
}

const getUserJobByID = async (userId, jobId) => {
  const query = `
              SELECT * FROM user_professions
              WHERE user_id = $1 
              AND profession_id = $2
        `

  const queryParams = [userId, jobId]
  const result = await pool.query(query, queryParams)

  return result.rows
}

const getUserGroups = async (userId) => {
  const query = `
            SELECT groups.id, groups.name, groups.code, groups.address, groups.cp, groups.city, groups.description, groups.background_url, user_groups.role, user_groups.joined_date
            FROM groups
            INNER JOIN user_groups ON groups.id = user_groups.group_id
            WHERE user_groups.user_id = $1
        `

  const queryParams = [userId]
  const result = await pool.query(query, queryParams)

  return result.rows
}

module.exports = {
  registerUser,
  loginUser,
  updateUser,
  linkJobToUser,
  getUserJobs,
  getUserJobByID,
  getUserGroups,
  getUserById,
}
