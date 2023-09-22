const express = require('express');
const router = express.Router();
const pool = require('../../db');
const {authenticateToken, generateAccessToken, generateRefreshToken} = require('../../token')

const makeid = function (length) {
  let result = '';
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

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
    const page = parseInt(req.query.page) || 1;  // Supposons que la première page soit 1
    const limit = parseInt(req.query.limit) || 10; // Par défaut, retourne 10 groupes
    
    const offset = (page - 1) * limit;
    
    const query = `
            WITH GroupedUsers AS (
                SELECT 
                    g.id,
                    g.name,
                    g.code,
                    g.address,
                    g.cp,
                    g.city,
                    g.description,
                    g.background_url,
                    jsonb_agg(jsonb_build_object(
                        'user_id', u.id,
                        'username', u.username,
                        'first_name', u.first_name,
                        'last_name', u.last_name
                    )) AS users
                FROM groups g
                LEFT JOIN user_groups ug ON g.id = ug.group_id
                LEFT JOIN users u ON ug.user_id = u.id
                GROUP BY g.id
                LIMIT $1 OFFSET $2
            )
            SELECT * FROM GroupedUsers;
        `;

        const result = await pool.query(query, [limit, offset]);

    res.status(200).json(result.rows);
} catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
}
});

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
  try {
      const groupId = req.params.id;

      const query = `
          SELECT 
              g.id,
              g.name,
              g.code,
              g.address,
              g.cp,
              g.city,
              g.description,
              g.background_url,
              jsonb_agg(jsonb_build_object(
                  'user_id', u.id,
                  'username', u.username,
                  'first_name', u.first_name,
                  'last_name', u.last_name
              )) AS users
          FROM groups g
          LEFT JOIN user_groups ug ON g.id = ug.group_id
          LEFT JOIN users u ON ug.user_id = u.id
          WHERE g.id = $1
          GROUP BY g.id;
      `;

      const result = await pool.query(query, [groupId]);

      if (result.rows.length === 0) {
          res.status(404).send('Groupe non trouvé');
      } else {
          res.status(200).json(result.rows[0]);
      }
  } catch (err) {
      console.error(err);
      res.status(500).send('Erreur serveur');
  }
});

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
  try {
      const { name, address, cp, city, description, background_url } = req.body;
      const code = makeid(4)+'-'+makeid(4)+'-'+makeid(4)
      if (!name || !code) {
          return res.status(400).json({ error: 'Le nom et le code sont obligatoires.' });
      }

      const result = await pool.query(
          'INSERT INTO groups (name, code, address, cp, city, description, background_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
          [name, code, address, cp, city, description, background_url]
      );

      res.status(201).json(result.rows[0]);
  } catch (err) {
      if (err.constraint === "groups_code_key") {
          return res.status(400).json({ error: 'Ce code existe déjà.' });
      }
      console.error(err);
      res.status(500).send('Erreur serveur');
  }
});

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
 *       400:
 *         description: Requête invalide
 *       404:
 *         description: Groupe non trouvé
 *       500:
 *         description: Erreur inconnue
 */
router.put('/:id', async (req, res) => {
  try {
      const groupId = req.params.id;
      const { name, code, address, cp, city, description, background_url } = req.body;

      // Assurez-vous que l'id du groupe est fourni
      if (!groupId) {
          return res.status(400).json({ error: "L'ID du groupe est nécessaire." });
      }

      // Préparation de la mise à jour
      let fields = [];
      let values = [];
      let counter = 1;

      if (name) {
          fields.push(`name = $${counter}`);
          values.push(name);
          counter++;
      }
      if (code) {
          fields.push(`code = $${counter}`);
          values.push(code);
          counter++;
      }
      if (address) {
          fields.push(`address = $${counter}`);
          values.push(address);
          counter++;
      }
      if (cp) {
          fields.push(`cp = $${counter}`);
          values.push(cp);
          counter++;
      }
      if (city) {
          fields.push(`city = $${counter}`);
          values.push(city);
          counter++;
      }
      if (description) {
          fields.push(`description = $${counter}`);
          values.push(description);
          counter++;
      }
      if (background_url) {
          fields.push(`background_url = $${counter}`);
          values.push(background_url);
          counter++;
      }

      // Si aucun champ à mettre à jour n'est fourni, renvoyer une erreur
      if (fields.length === 0) {
          return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
      }

      // Ajouter l'id du groupe aux valeurs et préparer la requête SQL
      values.push(groupId);
      const query = `UPDATE groups SET ${fields.join(', ')} WHERE id = $${counter} RETURNING *`;

      const result = await pool.query(query, values);

      if (result.rowCount === 0) {
          return res.status(404).json({ error: 'Groupe non trouvé' });
      }

      res.json(result.rows[0]);
  } catch (err) {
      if (err.constraint === "groups_code_key") {
          return res.status(400).json({ error: 'Ce code existe déjà.' });
      }
      console.error(err);
      res.status(500).send('Erreur serveur');
  }
});

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
  try {
      const group_id = req.params.id;
      const { user_id } = req.body;

      // Validation des données fournies
      if (!user_id || !group_id) {
          return res.status(400).json({ error: 'Les champs user_id et group_id sont nécessaires.' });
      }

      // Role est optionnel, s'il n'est pas fourni, il sera défini par défaut sur 'user' grâce à la définition de la table
      let query = `INSERT INTO user_groups (user_id, group_id) VALUES ($1, $2) RETURNING *`;
      let values = [user_id, group_id];

      const result = await pool.query(query, values);

      res.status(201).json(result.rows[0]);
  } catch (err) {
      if (err.constraint === "user_groups_pkey") {
          return res.status(400).json({ error: "L'utilisateur est déjà dans ce groupe." });
      }
      console.error(err);
      res.status(500).send('Erreur serveur');
  }
});

module.exports = router;