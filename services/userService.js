/* eslint-disable camelcase */
/* eslint-disable no-useless-catch */
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const pool = require('../db')
const { generateAccessToken, generateRefreshToken } = require('../token')
const { HTTP_STATUS } = require('../constants')

// Configuration de Nodemailer (exemple avec Mailtrap pour les tests)
const transporter = nodemailer.createTransport({
  host: 'smtp.ionos.fr',
  port: 465,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASSWORD,
  },
})

const sendResetTokenByEmail = async (email, resetToken) => {
  const mailOptions = {
    from: 'hoodhelps@gigan.fr',
    to: email,
    subject: 'Réinitialisation de votre mot de passe',
    html: `<!DOCTYPE html>
    <html>
    <head>
        <style>
            .code {
                font-size: 24px; /* Taille de la police */
                font-weight: bold; /* Gras */
                color: #333; /* Couleur du texte */
            }
            .instructions {
                font-size: 16px;
                color: #555;
            }
            /* Ajoutez plus de styles selon vos besoins */
        </style>
    </head>
    <body>
        <p class="instructions">Votre code de réinitialisation de mot de passe est :</p>
        <p class="code">${resetToken}</p> <!-- Code en gros et gras -->
        <p class="instructions">Ce code expire dans une heure.</p>
    </body>
    </html>`,
  }

  try {
    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    return error
  }
}

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

  return userResult
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
  const query = `
      SELECT 
          u.id, u.username, u.email, u.first_name, u.last_name, u.phone_number,
          u.image_url, u.date_of_birth, u.date_registered, u.last_login, u.is_active, u.role,
          COALESCE(json_agg(
              json_build_object(
                  'id', p.id,
                  'name', p.name,
                  'description', up.description,
                  'experience_years', up.experience_years
              ) 
              ORDER BY up.experience_years DESC
          ) FILTER (WHERE p.id IS NOT NULL), '[]') AS jobs
      FROM 
          users u
      LEFT JOIN 
          user_professions up ON u.id = up.user_id
      LEFT JOIN 
          professions p ON up.profession_id = p.id
      WHERE 
          u.id = $1
      GROUP BY 
          u.id;
    `
  const result = await pool.query(query, [userId])

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
  SELECT 
    p.id, p.name, up.description, up.experience_years
  FROM 
    user_professions up
  LEFT JOIN 
    professions p ON up.profession_id = p.id
  WHERE 
    up.user_id = $1
        `

  const queryParams = [userId]

  if (withoutProfessionId) {
    query += 'AND p.id != $2 '
    queryParams.push(withoutProfessionId)
  }

  query += 'GROUP BY p.id, p.name, up.description, up.experience_years;'

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

const updateUserJobByID = async (userId, profession_id, experience_years, description) => {
  const query = `UPDATE user_professions SET description = $1, experience_years = $2 WHERE profession_id = $3 AND user_id = $4 RETURNING *`

  const result = await pool.query(query, [description, experience_years, profession_id, userId])

  if (result.rowCount === 0) {
    throw new Error('Error updating user job')
  }
  return result.rows[0]
}

const deleteUserJobByID = async (userId, professionId) => {
  const query = `DELETE FROM user_professions WHERE user_id = $1 AND profession_id = $2 RETURNING *`

  const result = await pool.query(query, [userId, professionId])

  // Si rowCount est 0, cela signifie qu'aucune ligne n'a été supprimée,
  // probablement parce qu'aucune correspondance n'a été trouvée pour ces ID.
  if (result.rowCount === 0) {
    return {
      errorCode: HTTP_STATUS.NOT_FOUND,
      errorMessage: "Ce job n'existe pas.",
    }
  }

  // La fonction renvoie l'entrée supprimée, utile pour confirmer ce qui a été supprimé
  return result.rows[0]
}

const findUserByEmail = async (email) => {
  const formatMail = email.toLowerCase()

  const query = `SELECT * FROM users WHERE email = $1`
  const result = await pool.query(query, [formatMail])
  if (result.rowCount === 0) {
    return null
  }

  return result.rows[0]
}

const saveResetToken = async (userId, tokenData) => {
  const { resetCode, resetTokenExpires } = tokenData
  const query = `INSERT INTO password_resets (user_id, reset_token_hash, reset_token_expires) VALUES ($1, $2, $3)`
  const result = await pool.query(query, [userId, resetCode, resetTokenExpires])

  if (result.rowCount === 0) {
    throw new Error('Error saving reset token')
  }
}

const verifyResetCodeAndCodeUpdate = async (userId, resetCode, newPassword) => {
  // Requête SQL pour trouver l'utilisateur et le code de réinitialisation
  const query = `SELECT reset_token_hash, reset_token_expires FROM password_resets WHERE user_id = $1 ORDER BY reset_token_expires DESC LIMIT 1`

  try {
    const { rows } = await pool.query(query, [userId])
    const user = rows[0]

    if (!user) {
      return {
        errorCode: HTTP_STATUS.NOT_FOUND,
        errorMessage: 'Aucun code trouvé avec cet email.',
      }
    }

    const isCodeValid = user.reset_token_hash === resetCode
    const isCodeExpired = new Date(user.reset_token_expires) < new Date()

    if (!isCodeValid || isCodeExpired) {
      return {
        errorCode: HTTP_STATUS.FORBIDDEN,
        errorMessage: 'Code de réinitialisation invalide ou expiré.',
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    const updateQuery = `UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING *`
    const UpdateResult = await pool.query(updateQuery, [hashedPassword, userId])

    if (UpdateResult.rowCount === 0) {
      throw new Error('User not found')
    }

    const deleteQuery = `DELETE FROM password_resets WHERE user_id = $1 RETURNING *`
    await pool.query(deleteQuery, [userId])

    const userResult = UpdateResult.rows[0]
    delete userResult.password_hash

    return userResult
  } catch (error) {
    return {
      errorCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      errorMessage: `Error: ${error.message}`,
    }
  }
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
  updateUserJobByID,
  deleteUserJobByID,
  findUserByEmail,
  saveResetToken,
  sendResetTokenByEmail,
  verifyResetCodeAndCodeUpdate,
}
