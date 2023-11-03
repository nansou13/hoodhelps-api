/* eslint-disable no-plusplus */
/* eslint-disable camelcase */
/* eslint-disable consistent-return */
const express = require('express')

const router = express.Router()
const {
  registerValidation,
  loginValidation,
  updateValidation,
  linkJobValidation,
  jobByIDValidation,
  userIDValidation,
} = require('../validations/userValidations')
const {
  registerUser,
  loginUser,
  updateUser,
  linkJobToUser,
  getUserJobs,
  getUserJobByID,
  getUserGroups,
  getUserById,
} = require('../services/userService')
const { HTTP_STATUS } = require('../constants')
const { authenticateToken, generateAccessToken, generateRefreshToken } = require('../token')

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
router.post('/register', async (req, res) => {
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
      res.status(errorCode).json({ error: errorMessage })
    }
    res.status(HTTP_STATUS.CREATED).json({ user, accessToken, refreshToken })
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: err.message })
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
router.post('/login', async (req, res) => {
  const { error } = loginValidation(req.body)
  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(error.details[0].message)
  }

  try {
    const { username, password } = req.body
    const { user, accessToken, refreshToken } = await loginUser(username, password)
    res.json({ user, accessToken, refreshToken })
  } catch (err) {
    if (err.message === 'access denied') {
      res.status(HTTP_STATUS.FORBIDDEN).json({ error: err.message })
    } else {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Erreur...500...' })
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
router.put('/me', authenticateToken, async (req, res) => {
  const { error } = updateValidation(req.body)
  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(error.details[0].message)
  }

  try {
    const userId = req.user.id
    const { user, noContent } = await updateUser(userId, req.body)

    if (noContent) {
      return res.status(HTTP_STATUS.NOCONTENT).json({ message: 'No fields to update' })
    }

    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)

    res.status(HTTP_STATUS.OK).json({ user, accessToken, refreshToken })
  } catch (err) {
    if (err.message === 'User not found') {
      res.status(HTTP_STATUS.NOT_FOUND).json({ error: err.message })
    } else {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Update failed' })
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

router.post('/me/job', authenticateToken, async (req, res) => {
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
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Server Error' })
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

router.get('/me/job', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id
    const withoutProfessionId = req.query.without

    const jobs = await getUserJobs(userId, withoutProfessionId)

    res.status(HTTP_STATUS.OK).json(jobs)
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Server Error' })
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
router.get('/me/job/:id', authenticateToken, async (req, res) => {
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
router.get('/groups', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id

    const userGroups = await getUserGroups(userId)

    res.status(HTTP_STATUS.OK).json(userGroups)
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Erreur server' })
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
 *       500:
 *         description: Erreur lors de l'inscription
 */
router.get('/:id', async (req, res) => {
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
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: err.message })
  }
})

module.exports = router
