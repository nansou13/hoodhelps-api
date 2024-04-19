/* eslint-disable no-plusplus */
/* eslint-disable camelcase */
/* eslint-disable consistent-return */
import { Router } from 'express'

const router = Router()

import {
  registerValidation,
  loginValidation,
  updateValidation,
  linkJobValidation,
  jobByIDValidation,
  userIDValidation,
  updateJobValidation,
  emailValidation,
  resetPasswordValidation,
} from '../validations/userValidations'
const {
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
  deleteUser,
} = require('../services/userService')
// const { sendNotification } = require('../services/firebaseAdminService')
const { HTTP_STATUS } = require('../constants')
const { authenticateToken, generateAccessToken, generateRefreshToken } = require('../token')
const { generateResetToken } = require('../utils')

/**
 * @openapi
 * /api/users/register:
 *   post:
 *     summary: Create a new user
 *     description: Create a new user
 *     tags:
 *          - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                      id:
 *                          type: string
 *                          format: uuid
 *                      username:
 *                          type: string
 *                      email:
 *                          type: string
 *                          format: email
 *                      first_name:
 *                          type: string
 *                      last_name:
 *                          type: string
 *                      image_url:
 *                          type: string
 *                      date_of_birth:
 *                          type: string
 *                          format: date
 *                      date_registered:
 *                          type: string
 *                          format: date-time
 *                      last_login:
 *                          type: string
 *                          format: date-time
 *                      is_active:
 *                          type: boolean
 *                      role:
 *                          type: string
 *                          enum:
 *                              - "user"
 *                              - "admin"
 *                      phone_number:
 *                          type: string
 *                 accessToken:
 *                    type: string
 *                 refreshToken:
 *                    type: string
 *       500:
 *         description: Erreur lors de l'inscription
 */
router.post('/register', async (req, res, next) => {
  const { error } = registerValidation(req.body)
  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(error.details[0].message)
  }

  try {
    const { username, email, password } = req.body
    const { user, accessToken, refreshToken, errorCode, errorMessage } = await registerUser(
      username,
      email,
      password
    )

    if (errorCode) {
      return res.status(errorCode).json({ error: errorMessage })
    }
    return res.status(HTTP_STATUS.CREATED).json({ user, accessToken, refreshToken })
  } catch (err) {
    const errorMessage = new Error('Erreur...500... '.message)
    errorMessage.status = HTTP_STATUS.INTERNAL_SERVER_ERROR // ou tout autre code d'erreur
    next(errorMessage) // Propagez l'erreur
    // res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: err.message })
  }
})

/**
 * @openapi
 * /api/users/login:
 *   post:
 *     summary: login to the application
 *     description: login to the application
 *     tags:
 *          - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               token_notification:
 *                 type: string
 *             example:
 *               username: nansou
 *               password: coucou
 *     responses:
 *       200:
 *         description: User successfully logged
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                      id:
 *                          type: string
 *                          format: uuid
 *                      username:
 *                          type: string
 *                      email:
 *                          type: string
 *                          format: email
 *                      first_name:
 *                          type: string
 *                      last_name:
 *                          type: string
 *                      image_url:
 *                          type: string
 *                      date_of_birth:
 *                          type: string
 *                          format: date
 *                      date_registered:
 *                          type: string
 *                          format: date-time
 *                      last_login:
 *                          type: string
 *                          format: date-time
 *                      is_active:
 *                          type: boolean
 *                      role:
 *                          type: string
 *                          enum:
 *                              - "user"
 *                              - "admin"
 *                      phone_number:
 *                          type: string
 *                 accessToken:
 *                    type: string
 *                 refreshToken:
 *                    type: string
 *       403:
 *         description: access denied, the user doesn't exist or the password is not correct
 *       500:
 *         description: unknown error
 */
router.post('/login', async (req, res, next) => {
  const { error } = loginValidation(req.body)
  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(error.details[0].message)
  }

  try {
    const { username, password, token_notification = '' } = req.body
    const { user, accessToken, refreshToken } = await loginUser(
      username,
      password,
      token_notification
    )
    res.json({ user, accessToken, refreshToken })
  } catch (err) {
    if (err.message === 'access denied') {
      res.status(HTTP_STATUS.FORBIDDEN).json({ error: err.message })
    } else {
      const errorMessage = new Error('Erreur...500... '.err.message)
      errorMessage.status = HTTP_STATUS.INTERNAL_SERVER_ERROR // ou tout autre code d'erreur
      next(errorMessage) // Propagez l'erreur
      // res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Erreur...500...' })
    }
  }
})

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     summary: get all current user information
 *     description: get all current user information
 *     tags:
 *          - Users
 *     security:
 *        - bearerAuth: []
 *     responses:
 *       200:
 *         description: User successfully logged
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
*                      id:
*                          type: string
*                          format: uuid
*                      username:
*                          type: string
*                      email:
*                          type: string
*                          format: email
*                      first_name:
*                          type: string
*                      last_name:
*                          type: string
*                      image_url:
*                          type: string
*                      date_of_birth:
*                          type: string
*                          format: date
*                      date_registered:
*                          type: string
*                          format: date-time
*                      last_login:
*                          type: string
*                          format: date-time
*                      is_active:
*                          type: boolean
*                      role:
*                          type: string
*                          enum:
*                              - "user"
*                              - "admin"
*                      phone_number:
*                          type: string
 *       401:
 *         description: Error Unauthorized

 */
router.get('/me', authenticateToken, async (req, res) => res.send(req.user))

/**
 * @openapi
 * /api/users/me:
 *   put:
 *     summary: Mettre à jour les informations de l'utilisateur
 *     description: Mettre à jour les informations de l'utilisateur
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               image_url:
 *                 type: string
 *             example:
 *               username: john_doe
 *               email: john.doe@example.com
 *               first_name: John
 *               last_name: Doe
 *     responses:
 *       200:
 *         description: Utilisateur mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                   format: email
 *                 first_name:
 *                   type: string
 *                 last_name:
 *                   type: string
 *                 image_url:
 *                   type: string
 *                 date_of_birth:
 *                   type: string
 *                   format: date
 *                 date_registered:
 *                   type: string
 *                   format: date-time
 *                 last_login:
 *                   type: string
 *                   format: date-time
 *                 is_active:
 *                   type: boolean
 *                 role:
 *                   type: string
 *                   enum:
 *                     - "user"
 *                     - "admin"
 *                 phone_number:
 *                   type: string
 *       204:
 *         description: Aucune modification
 *       404:
 *         description: L'utilisateur n'existe pas
 *       500:
 *         description: Erreur inconnue
 */
router.put('/me', authenticateToken, async (req, res, next) => {
  const { error } = updateValidation(req.body)
  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(error.details[0].message)
  }

  try {
    const userId = req.user.id
    const result = await updateUser(userId, req.body)

    if (result.noContent) {
      return res.status(HTTP_STATUS.NOCONTENT).json({ message: 'No fields to update' })
    }

    const accessToken = generateAccessToken(result)
    const refreshToken = generateRefreshToken(result)

    res.status(HTTP_STATUS.OK).json({ ...result, accessToken, refreshToken })
  } catch (err) {
    if (err.message === 'User not found') {
      res.status(HTTP_STATUS.NOT_FOUND).json({ error: err.message })
    } else {
      const errorMessage = new Error('Erreur...500... '.err.message)
      errorMessage.status = HTTP_STATUS.INTERNAL_SERVER_ERROR // ou tout autre code d'erreur
      next(errorMessage) // Propagez l'erreur
      // res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: `Update failed ${err.message}` })
    }
  }
})

/**
 * @openapi
 * /api/users/me/job:
 *   post:
 *     summary: lier un job à un utilisateur
 *     description: lier un job à un utilisateur
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profession_id:
 *                 type: string
 *                 format: uuid
 *               description:
 *                 type: string
 *               experience_years:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Utilisateur mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user_id:
 *                   type: string
 *                   format: uuid
 *                 profession_id:
 *                   type: string
 *                   format: uuid
 *                 description:
 *                   type: string
 *                 experience_years:
 *                   type: integer
 *       201:
 *         description: Job link to the user
 *       500:
 *         description: Erreur inconnue
 */
router.post('/me/job', authenticateToken, async (req, res, next) => {
  const { error } = linkJobValidation(req.body)

  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(error.details[0].message)
  }

  try {
    const userId = req.user.id
    const jobDetails = req.body
    const linkedJob = await linkJobToUser(userId, jobDetails)

    if (linkedJob.errorCode) {
      return res.status(linkedJob.errorCode).json({ error: linkedJob.errorMessage })
    }

    res.status(HTTP_STATUS.CREATED).json(linkedJob)
  } catch (err) {
    if (err.message === 'Job link failed') {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: err.message })
    } else {
      const errorMessage = new Error('Erreur...500... '.err.message)
      errorMessage.status = HTTP_STATUS.INTERNAL_SERVER_ERROR // ou tout autre code d'erreur
      next(errorMessage) // Propagez l'erreur
      // res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Server Error' })
    }
  }
})

/**
 * @openapi
 * /api/users/me/job:
 *   get:
 *     summary: récuperer les job d'un utilisateur
 *     description: récuperer les job d'un utilisateur
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *        - in: query
 *          name: without
 *          schema:
 *            type: string
 *            format: uuid
 *            description: remove a job in the list
 *     responses:
 *       200:
 *         description: tableau de jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   experience_years:
 *                     type: integer
 *       500:
 *         description: Erreur inconnue
 */
router.get('/me/job', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id
    const withoutProfessionId = req.query.without

    const jobs = await getUserJobs(userId, withoutProfessionId)

    res.status(HTTP_STATUS.OK).json(jobs)
  } catch (err) {
    const errorMessage = new Error('Erreur...500... '.err.message)
    errorMessage.status = HTTP_STATUS.INTERNAL_SERVER_ERROR // ou tout autre code d'erreur
    next(errorMessage) // Propagez l'erreur
    // res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: `Server Error ${err.message}` })
  }
})

/**
 * @openapi
 * /api/users/me/job/{id}:
 *   get:
 *     summary: récuperer le job d'un utilisateur via son id
 *     description: récuperer le job d'un utilisateur via son id
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID du job
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: valeurs du job
 *         content:
 *           application/json:
 *             schema:
 *                 type: object
 *                 properties:
 *                   user_id:
 *                     type: string
 *                     format: uuid
 *                   profession_id:
 *                     type: string
 *                     format: uuid
 *                   description:
 *                     type: string
 *                   experience_years:
 *                     type: integer
 *       500:
 *         description: Erreur inconnue
 */
router.get('/me/job/:id', authenticateToken, async (req, res, next) => {
  const { error } = jobByIDValidation(req.params)

  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(error.details[0].message)
  }

  try {
    const user_id = req.user.id
    const job_id = req.params.id

    const jobByID = await getUserJobByID(user_id, job_id)

    res.status(HTTP_STATUS.OK).json(jobByID[0]) // Retourne les données insérées
  } catch (err) {
    const errorMessage = new Error('Erreur...500... '.err.message)
    errorMessage.status = HTTP_STATUS.INTERNAL_SERVER_ERROR // ou tout autre code d'erreur
    next(errorMessage) // Propagez l'erreur
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Erreur serveur')
  }
})

/**
 * @openapi
 * /api/users/groups:
 *   get:
 *     summary: Récupère la liste des groupes lié au user
 *     description: Récupère la liste des groupes lié au user
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Affiche un tableau de la liste des groupes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   name:
 *                     type: string
 *                   code:
 *                     type: string
 *                   address:
 *                     type: string
 *                   cp:
 *                     type: string
 *                   city:
 *                     type: string
 *                   description:
 *                     type: string
 *                   background_url:
 *                     type: string
 *       500:
 *         description: Erreur inconnue
 */
router.get('/groups', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id

    const userGroups = await getUserGroups(userId)

    res.status(HTTP_STATUS.OK).json(userGroups)
  } catch (err) {
    const errorMessage = new Error('Erreur...500... '.err.message)
    errorMessage.status = HTTP_STATUS.INTERNAL_SERVER_ERROR // ou tout autre code d'erreur
    next(errorMessage) // Propagez l'erreur
    // res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Erreur server' })
  }
})

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     summary: get user information by id
 *     description: get user information by id
 *     tags:
 *          - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID du user
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User informations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                      id:
 *                          type: string
 *                          format: uuid
 *                      username:
 *                          type: string
 *                      email:
 *                          type: string
 *                          format: email
 *                      first_name:
 *                          type: string
 *                      last_name:
 *                          type: string
 *                      image_url:
 *                          type: string
 *                      date_of_birth:
 *                          type: string
 *                          format: date
 *                      date_registered:
 *                          type: string
 *                          format: date-time
 *                      last_login:
 *                          type: string
 *                          format: date-time
 *                      is_active:
 *                          type: boolean
 *                      role:
 *                          type: string
 *                          enum:
 *                              - "user"
 *                              - "admin"
 *                      phone_number:
 *                          type: string
 *                      jobs:
 *                         type: array
 *                         items:
 *                            type: object
 *                            properties:
 *                              id:
 *                                type: string
 *                                format: uuid
 *                              name:
 *                                type: string
 *                              description:
 *                                type: string
 *                              experience_years:
 *                                type: integer
 *       500:
 *         description: Erreur lors de l'inscription
 */
router.get('/:id', async (req, res, next) => {
  const { error } = userIDValidation(req.params)
  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(error.details[0].message)
  }

  try {
    const result = await getUserById(req.params.id)

    if (result.errorCode) {
      return res.status(result.errorCode).json({ error: result.errorMessage })
    }
    return res.status(HTTP_STATUS.OK).json(result)
  } catch (err) {
    const errorMessage = new Error('Erreur...500... '.err.message)
    errorMessage.status = HTTP_STATUS.INTERNAL_SERVER_ERROR // ou tout autre code d'erreur
    next(errorMessage) // Propagez l'erreur
    // return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: err.message })
  }
})

/**
 * @openapi
 * /api/users/me/job/{id}:
 *   put:
 *     summary: update le job d'un utilisateur via son id
 *     description: update le job d'un utilisateur via son id
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID du job
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               experience_years:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Update done
 *         content:
 *           application/json:
 *             schema:
 *                 type: object
 *                 properties:
 *                   user_id:
 *                     type: string
 *                     format: uuid
 *                   profession_id:
 *                     type: string
 *                     format: uuid
 *                   description:
 *                     type: string
 *                   experience_years:
 *                     type: integer
 *       500:
 *         description: Erreur inconnue
 */
router.put('/me/job/:id', authenticateToken, async (req, res, next) => {
  const { error } = jobByIDValidation(req.params)

  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(error.details[0].message)
  }

  const errorResult = updateJobValidation(req.body)

  if (errorResult.error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(errorResult.error.details[0].message)
  }

  try {
    const user_id = req.user.id
    const job_id = req.params.id
    const { description, experience_years } = req.body

    const jobByID = await updateUserJobByID(user_id, job_id, experience_years, description)

    res.status(HTTP_STATUS.OK).json(jobByID) // Retourne les données insérées
  } catch (err) {
    const errorMessage = new Error('Erreur...500... '.err.message)
    errorMessage.status = HTTP_STATUS.INTERNAL_SERVER_ERROR // ou tout autre code d'erreur
    next(errorMessage) // Propagez l'erreur
    // res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Erreur serveur')
  }
})

/**
 * @openapi
 * /api/users/me/job/{id}:
 *   delete:
 *     summary: Supprime le job d'un utilisateur via son id
 *     description: Supprime un job spécifique associé à l'utilisateur authentifié
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID du job à supprimer
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Job supprimé avec succès
 *       400:
 *         description: Requête invalide
 *       404:
 *         description: Job non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.delete('/me/job/:id', authenticateToken, async (req, res, next) => {
  const { error } = jobByIDValidation(req.params)

  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(error.details[0].message)
  }

  try {
    const job_id = req.params.id
    const user_id = req.user.id

    const result = await deleteUserJobByID(user_id, job_id)

    if (result.errorCode) {
      return res.status(result.errorCode).json({ error: result.errorMessage })
    }

    res.status(204).send('Job supprimé avec succès')
  } catch (err) {
    const errorMessage = new Error('Erreur...500... '.err.message)
    errorMessage.status = HTTP_STATUS.INTERNAL_SERVER_ERROR // ou tout autre code d'erreur
    next(errorMessage) // Propagez l'erreur
    // res.status(500).send('Erreur serveur')
  }
})

/**
 * @openapi
 * /api/users/request-password-reset:
 *   post:
 *     summary: Envoie un email de réinitialisation de mot de passe à l'utilisateur
 *     description: Envoie un email de réinitialisation de mot de passe à l'utilisateur
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Email de réinitialisation envoyé avec succès
 *       400:
 *         description: Requête invalide
 *       404:
 *         description: Utilisateur non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.post('/request-password-reset', async (req, res, next) => {
  try {
    const { email } = req.body

    const { error } = emailValidation(req.body)
    if (error) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(error.details[0].message)
    }

    // Vérifiez si l'utilisateur existe dans votre base de données
    const user = await findUserByEmail(email)

    if (!user) {
      return res.status(404).send('Utilisateur non trouvé')
    }
    // Générez un jeton de réinitialisation de mot de passe
    const { resetCode, resetTokenExpires } = generateResetToken()

    // Enregistrez ce jeton dans la base de données (associé à l'utilisateur)
    await saveResetToken(user.id, { resetCode, resetTokenExpires })

    // Envoyez le jeton à l'utilisateur par email
    await sendResetTokenByEmail(email, resetCode)

    res.send('Un email de réinitialisation a été envoyé.')
  } catch (error) {
    const errorMessage = new Error('Erreur...500... '.err.message)
    errorMessage.status = HTTP_STATUS.INTERNAL_SERVER_ERROR // ou tout autre code d'erreur
    next(errorMessage) // Propagez l'erreur
    // res.status(500).send(`Erreur serveur : ${error.message}`)
  }
})

/**
 * @openapi
 * /api/users/reset-password:
 *   post:
 *     summary: Modification du mot de passe de l'utilisateur
 *     description: Modification du mot de passe de l'utilisateur
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resetCode:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               newPassword2:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé avec succès
 *       400:
 *         description: Requête invalide
 *       403:
 *         description: Code faux ou expiré
 *       404:
 *         description: Code inexistant
 *       500:
 *         description: Erreur serveur
 */
router.post('/reset-password', async (req, res, next) => {
  try {
    const { error } = resetPasswordValidation(req.body)

    if (error) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json(error.details[0].message)
    }

    const { resetCode, newPassword } = req.body

    const result = await verifyResetCodeAndCodeUpdate(resetCode, newPassword)

    if (result.errorCode) {
      return res.status(result.errorCode).json({ error: result.errorMessage })
    }

    res.status(200).json(result)
  } catch (error) {
    const errorMessage = new Error('Erreur...500... '.err.message)
    errorMessage.status = HTTP_STATUS.INTERNAL_SERVER_ERROR // ou tout autre code d'erreur
    next(errorMessage) // Propagez l'erreur
    // res.status(500).send('Erreur serveur')
  }
})

/**
 * @openapi
 * /api/users/me:
 *   delete:
 *     summary: Supprime totalement l'utilisateur
 *     description: Supprime totalement l'utilisateur
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User supprimé avec succès
 *       400:
 *         description: Requête invalide
 *       404:
 *         description: User non trouvé
 *       500:
 *         description: Erreur serveur
 */
router.delete('/me', authenticateToken, async (req, res, next) => {
  try {
    const user_id = req.user.id

    const { user, job, group } = await deleteUser(user_id)

    res.status(200).send({ user, job, group })
  } catch (err) {
    const errorMessage = new Error('Erreur...500... '.err.message)
    errorMessage.status = HTTP_STATUS.INTERNAL_SERVER_ERROR // ou tout autre code d'erreur
    next(errorMessage) // Propagez l'erreur
    // res.status(500).send('Erreur serveur')
  }
})

/**
 * @openapi
 * /api/users/notification/custom:
 *   post:
 *     summary: Envoyer une notification à un user
 *     description: Envoyer une notification à un user via son token
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               title:
 *                 type: string
 *               body:
 *                 type: string
 *             example:
 *               token: eXd90XN2rElwo6naBSfCtk:APA91bFUeQs8tw2DvDNlWruXqm5vsGAYHdRIEIRbD3QnRXyX_IHSzn3TMg7XNooF7xAE0s9t9SjDkV3sJ8Mf839szCjpmWEG70BQxMlra2v17BUaGNH0I47vcVmQMTlyFVdBeRZjtJnV
 *               title: Nouveau membre dans le groupe
 *               body: Ta soeur a rejoint votre groupe!
 *     responses:
 *       200:
 *         description: Message envoyé avec succès
 */
// router.post('/notification/custom', async (req, res, next) => {
//   const { token, title, body } = req.body
//   try {
//     await sendNotification(token, title, body)
//     res.status(200).send('test')
//   } catch (err) {
//     next(err)
//   }
// })

module.exports = router
