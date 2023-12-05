/* eslint-disable consistent-return */
const express = require('express')
const apicache = require('apicache')

const cache = apicache.middleware

const router = express.Router()
const { HTTP_STATUS } = require('../constants')
const {
  createCategorieValidation,
  getCategorieByGroupIDValidation,
  categorieIdValidation,
  createJobValidation,
  getUserFromGroupIDAndJobIDValidation,
} = require('../validations/categorieValidations')
const {
  createCategorie,
  getAllCategories,
  getCategoriesFromGroupID,
  createJob,
  getCategorieById,
  getUsersFromGroupAndJobID,
  getCategoriesWithUsersFromGroupID,
} = require('../services/categorieService')

/**
 * @openapi
 * /api/categories/:
 *   post:
 *     summary: Ajouter une nouvelle catégorie
 *     description: Ajoute une nouvelle catégorie.
 *     tags:
 *       - Categories
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *             required:
 *               - name
 *     responses:
 *       201:
 *         description: catégorie ajoutée avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 name:
 *                   type: string
 *       500:
 *         description: Erreur inconnue
 */
router.post('/', async (req, res, next) => {
  // Schema de validation Joi pour les paramètres du chemin
  const { error } = createCategorieValidation(req.body)

  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(error.details[0].message)
  }

  try {
    const result = await createCategorie(req.body.name)
    return res.status(HTTP_STATUS.CREATED).json(result)
  } catch (err) {
    const errorMessage = new Error('Erreur...500... '.err.message)
    errorMessage.status = HTTP_STATUS.INTERNAL_SERVER_ERROR // ou tout autre code d'erreur
    next(errorMessage) // Propagez l'erreur
    // res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'erreur serveur...' })
  }
})

/**
 * @openapi
 * /api/categories/:
 *   get:
 *     summary: Liste toutes les categories
 *     description: Liste toutes les categories
 *     tags:
 *       - Categories
 *     responses:
 *       200:
 *         description: Retourne la liste des catégories
 *         content:
 *           application/json:
 *             schema:
 *                type: array
 *                items:
 *                   type: object
 *                   properties:
 *                      id:
 *                         type: string
 *                         format: uuid
 *                      name:
 *                         type: string
 *       500:
 *         description: Erreur inconnue
 */
router.get('/', cache('2 days'), async (req, res, next) => {
  try {
    const result = await getAllCategories()
    return res.status(HTTP_STATUS.OK).json(result)
  } catch (err) {
    const errorMessage = new Error('Erreur...500... '.err.message)
    errorMessage.status = HTTP_STATUS.INTERNAL_SERVER_ERROR // ou tout autre code d'erreur
    next(errorMessage) // Propagez l'erreur
    // return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Erreur 500....', err })
  }
})

/**
 * @openapi
 * /api/categories/group/{group_id}:
 *   get:
 *     summary: Liste toutes les categories et ses jobs
 *     description: Liste toutes les categories et ses jobs
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: path
 *         name: group_id
 *         description: ID du groupe
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Retourne la liste des catégories
 *         content:
 *           application/json:
 *             schema:
 *                type: array
 *                items:
 *                   type: object
 *                   properties:
 *                      id:
 *                          type: string
 *                          format: uuid
 *                      name:
 *                          type: string
 *                      users:
 *                          type: integer
 *                      professions:
 *                          type: array
 *                          items:
 *                              type: object
 *                              properties:
 *                                  profession_id:
 *                                      type: string
 *                                      format: uuid
 *                                  profession_name:
 *                                      type: string
 *                                  user_count:
 *                                      type: integer
 *       500:
 *         description: Erreur inconnue
 */
router.get('/group/:group_id', async (req, res, next) => {
  // Schema de validation Joi pour les paramètres du chemin
  const { error } = getCategorieByGroupIDValidation(req.params)

  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(error.details[0].message)
  }

  try {
    const groupId = req.params.group_id

    const result = await getCategoriesFromGroupID(groupId)

    if (result.errorCode) {
      return res.status(result.errorCode).json({ error: result.errorMessage })
    }

    return res.status(HTTP_STATUS.OK).json(result)
  } catch (err) {
    const errorMessage = new Error('Erreur...500... '.err.message)
    errorMessage.status = HTTP_STATUS.INTERNAL_SERVER_ERROR // ou tout autre code d'erreur
    next(errorMessage) // Propagez l'erreur
    // return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: "Erreur d'inscription" })
  }
})

/**
 * @openapi
 * /api/categories/{id}/:
 *   post:
 *     summary: Ajouter une nouvelle profession à une catégorie
 *     description: Ajoute une nouvelle profession à une catégorie spécifiée par son ID.
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID de la catégorie à laquelle ajouter la profession
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
 *               profession_name:
 *                 type: string
 *             required:
 *               - profession_name
 *     responses:
 *       201:
 *         description: Profession ajoutée avec succès à la catégorie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profession_id:
 *                   type: string
 *                   format: uuid
 *       404:
 *         description: Catégorie non trouvée
 *       500:
 *         description: Erreur inconnue
 */
router.post('/:id', async (req, res, next) => {
  // Schema de validation Joi pour les paramètres du chemin
  const { error } = categorieIdValidation(req.params)

  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(error.details[0].message)
  }

  const BodyValidationResult = createJobValidation(req.body)

  if (BodyValidationResult.error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(BodyValidationResult.error.details[0].message)
  }

  try {
    const { id } = req.params
    const result = await createJob(id, req.body.profession_name)
    if (result.errorCode) {
      return res.status(result.errorCode).json({ error: result.errorMessage })
    }

    return res.status(HTTP_STATUS.CREATED).json(result)
  } catch (err) {
    const errorMessage = new Error('Erreur...500... '.err.message)
    errorMessage.status = HTTP_STATUS.INTERNAL_SERVER_ERROR // ou tout autre code d'erreur
    next(errorMessage) // Propagez l'erreur
    // res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Categorie non trouvée' })
  }
})

/**
 * @openapi
 * /api/categories/{id}:
 *   get:
 *     summary: Obtenir les détails d'une catégorie
 *     description: Récupère les détails d'une catégorie spécifiée par son ID, y compris la liste de ses professions associées.
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID de la catégorie à récupérer
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Détails de la catégorie récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 name:
 *                   type: string
 *                 professions_list:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *       404:
 *         description: Catégorie inexistante
 *       500:
 *         description: Erreur inconnue
 */
router.get('/:id', async (req, res, next) => {
  // Schema de validation Joi pour les paramètres du chemin
  const { error } = categorieIdValidation(req.params)

  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(error.details[0].message)
  }

  try {
    const { id } = req.params
    const result = await getCategorieById(id)

    if (result.errorCode) {
      return res.status(result.errorCode).json({ error: result.errorMessage })
    }

    return res.status(HTTP_STATUS.OK).json(result)
  } catch (err) {
    const errorMessage = new Error('Erreur...500... '.err.message)
    errorMessage.status = HTTP_STATUS.INTERNAL_SERVER_ERROR // ou tout autre code d'erreur
    next(errorMessage) // Propagez l'erreur
    // return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: "Erreur d'inscription" })
  }
})

/**
 * @openapi
 * /api/categories/{groupId}/jobs/{professionId}/users:
 *   get:
 *     summary: Liste des utilisateurs par profession et groupe
 *     description: Liste des utilisateurs par profession et groupe
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: path
 *         name: groupId
 *         description: ID du groupe
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: professionId
 *         description: ID du job
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Liste des utilisateurs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                  type: object
 *                  properties:
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
 *                      date_of_birth:
 *                          type: string
 *                          format: date
 *                      image_url:
 *                          type: string
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
 *         description: Erreur inconnue
 */
router.get('/:groupId/jobs/:professionId/users', async (req, res, next) => {
  // Schema de validation Joi pour les paramètres du chemin
  const { error } = getUserFromGroupIDAndJobIDValidation(req.params)

  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(error.details[0].message)
  }

  try {
    const { groupId } = req.params
    const { professionId } = req.params

    const result = await getUsersFromGroupAndJobID(groupId, professionId)

    res.status(HTTP_STATUS.OK).json(result)
  } catch (errors) {
    const errorMessage = new Error('Erreur...500... '.err.message)
    errorMessage.status = HTTP_STATUS.INTERNAL_SERVER_ERROR // ou tout autre code d'erreur
    next(errorMessage) // Propagez l'erreur
    // res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Erreur serveur' })
  }
})

/**
 * @openapi
 * /api/categories/{group_id}/users:
 *   get:
 *     summary: Liste des users avec job name et catégory id d'un groupe
 *     description: Liste des users avec job name et catégory id d'un groupe
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: path
 *         name: group_id
 *         description: ID du groupe
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Liste des utilisateurs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                  type: object
 *                  properties:
 *                    user_id:
 *                      type: string
 *                      format: uuid
 *                    username:
 *                      type: string
 *                    first_name:
 *                      type: string
 *                    last_name:
 *                      type: string
 *                    image_url:
 *                      type: string
 *                    job_id:
 *                      type: string
 *                      format: uuid
 *                    job_name:
 *                      type: string
 *                    category_id:
 *                      type: string
 *                      format: uuid
 *       500:
 *         description: Erreur inconnue
 */
router.get('/:group_id/users', async (req, res, next) => {
  // Schema de validation Joi pour les paramètres du chemin
  const { error } = getCategorieByGroupIDValidation(req.params)

  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(error.details[0].message)
  }

  try {
    // eslint-disable-next-line camelcase
    const { group_id } = req.params

    const result = await getCategoriesWithUsersFromGroupID(group_id)

    res.status(HTTP_STATUS.OK).json(result)
  } catch (errors) {
    const errorMessage = new Error('Erreur...500... '.err)
    errorMessage.status = HTTP_STATUS.INTERNAL_SERVER_ERROR // ou tout autre code d'erreur
    next(errorMessage) // Propagez l'erreur
    // res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Erreur serveur' })
  }
})

module.exports = router
