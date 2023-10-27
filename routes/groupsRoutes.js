/* eslint-disable func-names */
/* eslint-disable camelcase */
/* eslint-disable consistent-return */
/* eslint-disable radix */
/* eslint-disable no-plusplus */
const express = require('express')
const router = express.Router()
const { HTTP_STATUS } = require('../constants')
const {
  getGroups,
  getGroupsById,
  createGroups,
  updateGroups,
  getGroupsByCode,
  groupsAddUser,
} = require('../services/groupService')
const {
  groupsByIdValidation,
  createGroupsValidation,
  groupsUpdateValidation,
  groupsByCodeValidation,
  groupsAddUserValidation,
} = require('../validations/groupValidations')

/**
 * @openapi
 * /api/groups:
 *   get:
 *     summary: Liste des groupes avec utilisateurs (pagination)
 *     description: Récupère la liste des groupes avec les utilisateurs associés tout en gérant la pagination.
 *     tags:
 *       - Groupes
 *     parameters:
 *       - in: query
 *         name: page
 *         description: Numéro de page (par défaut 1)
 *         required: false
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         description: Nombre d'éléments par page (par défaut 10)
 *         required: false
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste des groupes avec utilisateurs récupérée avec succès
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
 *                   users:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         user_id:
 *                           type: string
 *                           format: uuid
 *                         username:
 *                           type: string
 *                         first_name:
 *                           type: string
 *                         last_name:
 *                           type: string
 *       500:
 *         description: Erreur inconnue
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1 // Supposons que la première page soit 1
    const limit = parseInt(req.query.limit) || 10 // Par défaut, retourne 10 groupes

    const offset = (page - 1) * limit

    const result = await getGroups(limit, offset)

    res.status(HTTP_STATUS.OK).json(result)
  } catch (err) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Erreur serveur')
  }
})

/**
 * @openapi
 * /api/groups/{id}:
 *   get:
 *     summary: Détails d'un groupe avec utilisateurs
 *     description: Récupère les détails d'un groupe avec les utilisateurs associés.
 *     tags:
 *       - Groupes
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID du groupe
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Détails du groupe avec utilisateurs récupérés avec succès
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
 *                 code:
 *                   type: string
 *                 address:
 *                   type: string
 *                 cp:
 *                   type: string
 *                 city:
 *                   type: string
 *                 description:
 *                   type: string
 *                 background_url:
 *                   type: string
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_id:
 *                         type: string
 *                         format: uuid
 *                       username:
 *                         type: string
 *                       first_name:
 *                         type: string
 *                       last_name:
 *                         type: string
 *       404:
 *         description: Groupe non trouvé
 *       500:
 *         description: Erreur inconnue
 */
router.get('/:id', async (req, res) => {
  // Schema de validation Joi pour les paramètres du chemin
  const { error } = groupsByIdValidation(req.params)

  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(error.details[0].message)
  }

  try {
    const groupId = req.params.id

    const { rows, errorCode, errorMessage } = await getGroupsById(groupId)
    if (errorCode) {
      return res.status(errorCode).send({ error: errorMessage })
    }
    return res.status(HTTP_STATUS.OK).json(rows[0])
  } catch (err) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Erreur serveur')
  }
})

/**
 * @openapi
 * /api/groups:
 *   post:
 *     summary: Ajouter un groupe
 *     description: Ajoute un nouveau groupe avec les informations spécifiées.
 *     tags:
 *       - Groupes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nom du groupe
 *               address:
 *                 type: string
 *                 description: Adresse du groupe
 *               cp:
 *                 type: string
 *                 description: Code postal du groupe
 *               city:
 *                 type: string
 *                 description: Ville du groupe
 *               description:
 *                 type: string
 *                 description: Description du groupe
 *               background_url:
 *                 type: string
 *                 description: URL de l'arrière-plan du groupe
 *     responses:
 *       201:
 *         description: Groupe ajouté avec succès
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
 *                 code:
 *                   type: string
 *                 address:
 *                   type: string
 *                 cp:
 *                   type: string
 *                 city:
 *                   type: string
 *                 description:
 *                   type: string
 *                 background_url:
 *                   type: string
 *       400:
 *         description: Requête invalide
 *       500:
 *         description: Erreur inconnue
 */
router.post('/', async (req, res) => {
  const { error } = createGroupsValidation(req.body)

  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(error.details[0].message)
  }

  try {
    const result = await createGroups(req.body)
    return res.status(HTTP_STATUS.CREATED).json(result)
  } catch (err) {
    if (err.constraint === 'groups_code_key') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Ce code existe déjà.' })
    }
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Erreur serveur')
  }
})

/**
 * @openapi
 * /api/groups/{id}:
 *   put:
 *     summary: Mettre à jour un groupe
 *     description: Met à jour les informations d'un groupe spécifié par son ID.
 *     tags:
 *       - Groupes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: L'ID du groupe à mettre à jour
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
 *               name:
 *                 type: string
 *                 description: Nom du groupe
 *               code:
 *                 type: string
 *                 description: Code du groupe
 *               address:
 *                 type: string
 *                 description: Adresse du groupe
 *               cp:
 *                 type: string
 *                 description: Code postal du groupe
 *               city:
 *                 type: string
 *                 description: Ville du groupe
 *               description:
 *                 type: string
 *                 description: Description du groupe
 *               background_url:
 *                 type: string
 *                 description: URL de l'arrière-plan du groupe
 *     responses:
 *       200:
 *         description: Groupe mis à jour avec succès
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
 *                 code:
 *                   type: string
 *                 address:
 *                   type: string
 *                 cp:
 *                   type: string
 *                 city:
 *                   type: string
 *                 description:
 *                   type: string
 *                 background_url:
 *                   type: string
 *       204:
 *         description: no update
 *       400:
 *         description: Requête invalide
 *       404:
 *         description: Groupe non trouvé
 *       500:
 *         description: Erreur inconnue
 */
router.put('/:id', async (req, res) => {
  const ValidationReturn = groupsByIdValidation(req.params)
  if (ValidationReturn.error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(ValidationReturn.error.details[0].message)
  }

  const { error } = groupsUpdateValidation(req.body)
  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(error.details[0].message)
  }

  try {
    const groupId = req.params.id

    const { result, errorCode, errorMessage } = await updateGroups(groupId, req.body)
    if (errorCode) {
      return res.status(errorCode).json({ error: errorMessage })
    }

    return res.json(result)
  } catch (err) {
    if (err.constraint === 'groups_code_key') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Ce code existe déjà.' })
    }
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Erreur serveur')
  }
})

/**
 * @swagger
 * /api/groups/code/{id}:
 *   get:
 *     summary: Récupère un groupe par son code
 *     tags:
 *       - Groupes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Code du groupe à rechercher
 *     responses:
 *       '200':
 *         description: Succès - Le groupe a été trouvé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: ID du groupe
 *       '401':
 *         description: le groupe est inexistant
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Description de l'erreur interne
 *
 *       '500':
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Description de l'erreur interne
 *                 err:
 *                   type: string
 *                   description: Détails de l'erreur
 */
router.get('/code/:id', async (req, res) => {
  // Schema de validation Joi pour les paramètres du chemin
  const { error } = groupsByCodeValidation(req.params)

  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(error.details[0].message)
  }

  const code = req.params.id
  try {
    const { id, errorCode, errorMessage } = await getGroupsByCode(code)

    if (errorCode) {
      return res.status(errorCode).json({ error: errorMessage })
    }

    return res.json({ id })
  } catch (err) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: err.message })
  }
})

/**
 * @openapi
 * /api/groups/{id}/user:
 *   post:
 *     summary: Ajouter un utilisateur à un groupe
 *     description: Ajoute un utilisateur spécifié par son ID à un groupe spécifié par son ID.
 *     tags:
 *       - Groupes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: L'ID du groupe auquel ajouter l'utilisateur
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
 *               user_id:
 *                 type: string
 *                 description: L'ID de l'utilisateur à ajouter
 *     responses:
 *       201:
 *         description: Utilisateur ajouté avec succès au groupe
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user_id:
 *                   type: string
 *                   format: uuid
 *                 group_id:
 *                   type: string
 *                   format: uuid
 *       400:
 *         description: Requête invalide
 *       404:
 *         description: Groupe non trouvé
 *       500:
 *         description: Erreur inconnue
 */
router.post('/:id/user', async (req, res) => {
  // Schema de validation Joi pour les paramètres du chemin
  const validationReturn = groupsByIdValidation(req.params)
  if (validationReturn.error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(validationReturn.error.details[0].message)
  }

  // Schema de validation Joi pour les paramètres du body
  const { error } = groupsAddUserValidation(req.body)

  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(error.details[0].message)
  }

  try {
    const group_id = req.params.id
    const { user_id } = req.body

    const { result, errorCode, errorMessage } = await groupsAddUser(group_id, user_id)
    if (errorCode) {
      return res.status(errorCode).json({ error: errorMessage })
    }

    res.status(HTTP_STATUS.CREATED).json(result)
  } catch (err) {
    if (err.constraint === 'user_groups_pkey') {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json({ error: "L'utilisateur est déjà dans ce groupe." })
    }
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send('Erreur serveur')
  }
})

module.exports = router
