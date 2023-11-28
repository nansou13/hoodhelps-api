const apicache = require('apicache')
const express = require('express')
const router = express.Router()
const { HTTP_STATUS } = require('../constants')

/**
 * @openapi
 * /api/cache/index:
 *   get:
 *     summary: Récupère l'index du cache
 *     tags:
 *       - Cache
 *     description: Retourne l'index actuel du cache de l'API.
 *     responses:
 *       200:
 *         description: Index du cache retourné avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: object
 *                 properties:
 *                   size:
 *                     type: integer
 *                     description: Taille du cache pour la clé.
 *                   timeout:
 *                     type: integer
 *                     description: Temps avant l'expiration du cache (en millisecondes).
 */
router.get('/index', (req, res) => {
  res.status(HTTP_STATUS.OK).send(apicache.getIndex())
})

/**
 * @openapi
 * /api/cache/clear/{key}:
 *   get:
 *     summary: Efface une clé spécifique du cache
 *     tags:
 *       - Cache
 *     description: Efface les données mises en cache pour une clé spécifiée. Si aucune clé n'est fournie, efface tout le cache.
 *     parameters:
 *       - in: path
 *         name: key
 *         required: false
 *         schema:
 *           type: string
 *         description: La clé du cache à effacer.
 *     responses:
 *       200:
 *         description: Cache effacé avec succès.
 */
router.get('/clear/:key?', (req, res) => {
  res.status(HTTP_STATUS.OK).send(apicache.clear(req.params.key || req.query.key))
})

module.exports = router
