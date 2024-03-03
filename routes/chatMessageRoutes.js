/* eslint-disable camelcase */
/* eslint-disable consistent-return */
// const apicache = require('apicache')
const express = require('express')
const router = express.Router()
const { HTTP_STATUS } = require('../constants')
const { authenticateToken } = require('../token')
const { getMessageFromGroup, AddChatMessage } = require('../services/chatMessageService')
const { getCategorieByGroupIDValidation } = require('../validations/categorieValidations')
const { chatMessageSendMessage } = require('../validations/chatMessageValidations')

/**
 * @openapi
 * /api/chat-message/{group_id}:
 *   get:
 *     summary: Récupère les messages d'un groupe
 *     tags:
 *       - ChatMessage
 *     security:
 *       - bearerAuth: []
 *     description: Retourne les messages d'un groupe.
 *     parameters:
 *       - in: path
 *         name: group_id
 *         description: L'identifiant du groupe dont on veut récupérer les messages.
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: les messages du groupe sont retournés avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   message_id:
 *                     type: integer
 *                   content:
 *                     type: string
 *                   user_id:
 *                     type: string
 *                     format: uuid
 *                   group_id:
 *                     type: string
 *                     format: uuid
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *       '400':
 *         description: Erreur de validation.
 *       '403':
 *         description: l'utilisateur n'est pas autorisé à ajouter des messages dans ce groupe.
 */

router.get('/:group_id', authenticateToken, async (req, res, next) => {
  // Schema de validation Joi pour les paramètres du chemin
  const validationReturn = getCategorieByGroupIDValidation(req.params)
  if (validationReturn.error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(validationReturn.error.details[0].message)
  }

  try {
    const { group_id } = req.params
    const user_id = req.user.id

    const { result, errorCode, errorMessage } = await getMessageFromGroup(group_id, user_id)
    if (errorCode) {
      return res.status(errorCode).json({ error: errorMessage })
    }

    return res.status(HTTP_STATUS.OK).json(result)
  } catch (err) {
    const errorMessage = new Error('Erreur...500... '.err)
    errorMessage.status = HTTP_STATUS.INTERNAL_SERVER_ERROR // ou tout autre code d'erreur
    next(errorMessage) // Propagez l'erreur
  }
})

/**
 * @openapi
 * /api/chat-message/{group_id}:
 *   post:
 *     summary: Ajouter un message dans le chat du groupe
 *     description: Ajoute un message dans un groupe spécifié par son ID.
 *     tags:
 *       - ChatMessage
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: group_id
 *         required: true
 *         description: L'ID du groupe auquel ajouter le message
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
 *               content:
 *                 type: string
 *                 description: Contenu du message
 *     responses:
 *       201:
 *         description: Message ajouté avec succès au groupe
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message_id:
 *                   type: integer
 *                 content:
 *                   type: string
 *                 user_id:
 *                   type: string
 *                   format: uuid
 *                 group_id:
 *                   type: string
 *                   format: uuid
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Requête invalide
 *       404:
 *         description: Groupe non trouvé
 *       500:
 *         description: Erreur inconnue
 */
router.post('/:group_id', authenticateToken, async (req, res, next) => {
  // Schema de validation Joi pour les paramètres du chemin
  const validationReturn = chatMessageSendMessage({
    ...req.params,
    ...req.body,
  })
  if (validationReturn.error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(validationReturn.error.details[0].message)
  }

  try {
    const { group_id } = req.params
    const { content } = req.body
    const user_id = req.user.id

    const { result, errorCode, errorMessage } = await AddChatMessage(group_id, user_id, content)
    if (errorCode) {
      return res.status(errorCode).json({ error: errorMessage })
    }

    res.status(HTTP_STATUS.CREATED).json(result)
  } catch (err) {
    const errorMessage = new Error('Erreur...500... '.err)
    errorMessage.status = HTTP_STATUS.INTERNAL_SERVER_ERROR // ou tout autre code d'erreur
    next(errorMessage) // Propagez l'erreur
  }
})

module.exports = router
