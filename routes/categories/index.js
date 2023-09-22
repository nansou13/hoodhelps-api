const express = require('express');
const router = express.Router();
const pool = require('../../db');
const {authenticateToken, generateAccessToken, generateRefreshToken} = require('../../token')

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
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                      type: object
 *                      properties:
 *                          id:
 *                              type: string
 *                              format: uuid
 *                          name:
 *                              type: string
 *       500:
 *         description: Erreur inconnue
 */
router.get('/', async (req, res) => {
    
  try {
    const result = await pool.query('SELECT * FROM categories');
    return res.status(200).json({categories: result.rows});
  } catch (err) {
    return res.status(500).json({ error: 'Erreur 500....' });
  }
});

/**
 * @openapi
 * /api/categories/{group_id}:
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
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                      type: object
 *                      properties:
 *                          id:
 *                              type: string
 *                              format: uuid
 *                          name:
 *                              type: string
 *                          professions_list:
 *                              type: array
 *                              items:
 *                                  type: object
 *                                  properties:
 *                                      id: 
 *                                          type: string
 *                                          format: uuid
 *                                      name:
 *                                          type: string
 *                                      user_count:
 *                                          type: integer
 *       500:
 *         description: Erreur inconnue
 */
router.get('/:group_id', async (req, res) => {
    
    try {
      const groupId = req.params.group_id
      const query = `
      SELECT
        c.id,
        c.name,
        jsonb_agg(jsonb_build_object(
          'profession_id', p.id,
          'profession_name', p.name,
          'user_count', COALESCE(u.user_count, 0)
        )) AS professions
      FROM categories c
      LEFT JOIN professions p ON c.id = p.category_id
      LEFT JOIN (
        SELECT up.profession_id, COUNT(up.user_id) AS user_count
        FROM user_professions up
        INNER JOIN user_groups ug ON up.user_id = ug.user_id
        WHERE ug.group_id = $1
        GROUP BY up.profession_id
      ) u ON p.id = u.profession_id
      GROUP BY c.id, c.name;
    `;

      const result = await pool.query(query, [groupId]);
      return res.status(200).json({categories: result.rows});
    } catch (err) {
      return res.status(500).json({ error: 'Erreur d\'inscription' });
    }
  });

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
router.post('/:id/', async (req, res) => {
    try {
        const id = req.params.id;
        //check si ID exist dans les catégories
        const exist = await pool.query("SELECT * FROM categories WHERE id = $1", [id]);
        if (exist.rowCount === 0) {
            return res.status(404).json({ error: 'Categorie non trouvée' });
        }

        const newJob = await pool.query('INSERT INTO professions (name, category_id) VALUES ($1, $2) RETURNING id', [req.body.profession_name, id]);
        return res.status(201).json({ profession_id: newJob.rows[0].id });

    } catch (err) {
      res.status(500).json({ error: 'Categorie non trouvée' });
    }
  });

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
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const result = await pool.query("SELECT categories.id, categories.name, ARRAY_AGG(jsonb_build_object('id', professions.id, 'name', professions.name)) AS professions_list FROM categories LEFT JOIN professions ON categories.id = professions.category_id WHERE categories.id = $1 GROUP BY categories.id, categories.name;",[id]);
        
        if(result.rowCount === 0) return res.status(404).json({ error: 'categorie inexistante' });
        return res.status(200).json(result.rows[0]);
      } catch (err) {
        return res.status(500).json({ error: 'Erreur d\'inscription' });
      }
});

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
router.get('/:groupId/jobs/:professionId/users', async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const professionId = req.params.professionId;

    // Assurez-vous que groupId et professionId sont des UUID valides

    // Requête SQL pour obtenir la liste des utilisateurs
    const query = `
      SELECT
        users.id,
        users.username,
        users.email,
        users.first_name,
        users.last_name,
        users.date_of_birth,
        users.date_registered,
        users.last_login,
        users.is_active,
        users.role,
        users.phone_number
      FROM users
      INNER JOIN user_groups ON users.id = user_groups.user_id
      INNER JOIN user_professions ON users.id = user_professions.user_id
      WHERE user_groups.group_id = $1 AND user_professions.profession_id = $2
    `;

    const result = await pool.query(query, [groupId, professionId]);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;