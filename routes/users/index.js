const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const router = express.Router();
const pool = require("../../db");
const { HTTP_STATUS } = require("../../constants");
const {
  authenticateToken,
  generateAccessToken,
  generateRefreshToken,
} = require("../../token");

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
router.post("/register", async (req, res) => {
  // Schema de validation Joi pour les paramètres du chemin
  const validations = createJoiSchema({
    username: { type: "string", required: true },
    email: { type: "string", required: true, email: true },
    password: { type: "string", required: true },
  });

  const { error } = validations.validate(req.body);

  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(error.details[0].message);
  }

  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const result = await pool.query(
      "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *",
      [req.body.username, req.body.email, hashedPassword]
    );
    const userResult = result.rows[0];
    delete userResult.password_hash;

    const accessToken = generateAccessToken(userResult);
    const refreshToken = generateRefreshToken(userResult);
    res
      .status(HTTP_STATUS.CREATED)
      .json({ user: userResult, accessToken, refreshToken });
  } catch (err) {
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: "Registration error" });
  }
});

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
router.post("/login", async (req, res) => {
  // Schema de validation Joi pour les paramètres du chemin
  const validations = createJoiSchema({
    username: { type: "string", required: true },
    password: { type: "string", required: true },
  });

  const { error } = validations.validate(req.body);

  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(error.details[0].message);
  }

  try {
    const username = req.body.username;
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);

    if (result.rowCount !== 1) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({ error: "access denied" });
    }

    bcrypt.compare(
      req.body.password,
      result.rows[0].password_hash,
      function (err, isMatch) {
        if (err || !isMatch) {
          return res
            .status(HTTP_STATUS.FORBIDDEN)
            .json({ error: "access denied" });
        }
        if (isMatch) {
          const userResult = result.rows[0];
          delete userResult.password_hash;

          const accessToken = generateAccessToken(userResult);
          const refreshToken = generateRefreshToken(userResult);

          return res.json({ user: userResult, accessToken, refreshToken });
        }
      }
    );
  } catch (err) {
    console.error(err);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: "Erreur...500..." });
  }
});

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
router.get("/me", authenticateToken, async (req, res) => {
  return res.send(req.user);
});

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
router.put("/me", authenticateToken, async (req, res) => {
  // Schema de validation Joi pour les paramètres du chemin
  const validations = createJoiSchema({
    email: { type: "string", email: true },
    username: { type: "string" },
    first_name: { type: "string" },
    last_name: { type: "string" },
    image_url: {
      type: "string",
      pattern:
        "^(https?:\\/\\/)?([\\da-z.-]+)\\.([a-z.]{2,6})([\\/\\w .-]*)*\\/?$",
      description: "URL de l'image de profil",
    },
    date_of_birth: { type: "string", pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}$" }, // Format YYYY-MM-DD
    phone_number: { type: "string", pattern: "^[0-9]+$" }, // Only numbers allowed
  });

  const { error } = validations.validate(req.body);

  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(error.details[0].message);
  }

  try {
    const userId = req.user.id;
    const {
      username,
      email,
      first_name,
      last_name,
      date_of_birth,
      phone_number,
      image_url,
    } = req.body;

    let fields = [];
    let values = [];
    let counter = 1;

    if (username) {
      fields.push(`username = $${counter}`);
      values.push(username);
      counter++;
    }
    if (email) {
      fields.push(`email = $${counter}`);
      values.push(email);
      counter++;
    }
    if (first_name) {
      fields.push(`first_name = $${counter}`);
      values.push(first_name);
      counter++;
    }
    if (last_name) {
      fields.push(`last_name = $${counter}`);
      values.push(last_name);
      counter++;
    }
    if (image_url) {
      fields.push(`image_url = $${counter}`);
      values.push(image_url);
      counter++;
    }
    if (date_of_birth) {
      fields.push(`date_of_birth = $${counter}`);
      values.push(date_of_birth);
      counter++;
    }
    if (phone_number) {
      fields.push(`phone_number = $${counter}`);
      values.push(phone_number);
      counter++;
    }

    if (fields.length === 0) {
      return res
        .status(HTTP_STATUS.NOCONTENT)
        .json({ message: "Aucun champ à mettre à jour" });
    }

    const query = `UPDATE users SET ${fields.join(
      ", "
    )} WHERE id = $${counter} RETURNING *`;
    values.push(userId);

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json({ error: "Utilisateur non trouvé" });
    }

    const userResult = result.rows[0];
    delete userResult.password_hash;

    const accessToken = generateAccessToken(userResult);
    const refreshToken = generateRefreshToken(userResult);

    res
      .status(HTTP_STATUS.OK)
      .json({ user: userResult, accessToken, refreshToken });
  } catch (err) {
    console.error(err);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: "Erreur lors de la mise à jour" });
  }
});

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

router.post("/me/job", authenticateToken, async (req, res) => {
  // Schema de validation Joi pour les paramètres du chemin
  const validations = createJoiSchema({
    profession_id: { type: "uuid", required: true },
    description: { type: "string" },
    experience_years: { type: "number" },
  });

  const { error } = validations.validate(req.body);

  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(error.details[0].message);
  }

  try {
    const user_id = req.user.id;
    const { profession_id, description, experience_years } = req.body;

    // Assurez-vous de valider les données ici avant de les insérer dans la base de données

    const query = `
            INSERT INTO user_professions (user_id, profession_id, description, experience_years) 
            VALUES ($1, $2, $3, $4)
            RETURNING *;  -- retourne les données insérées
        `;

    const result = await pool.query(query, [
      user_id,
      profession_id,
      description,
      experience_years,
    ]);

    res.status(HTTP_STATUS.CREATED).json(result.rows[0]); // Retourne les données insérées
  } catch (err) {
    console.error(err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send("Erreur serveur");
  }
});

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

router.get("/me/job", authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;
    const withoutProfessionId = req.query.without;

    let query = `
            SELECT * FROM user_professions
            WHERE user_id = $1 
        `;

    const queryParams = [user_id];

    if (withoutProfessionId) {
      query += `AND profession_id != $2`;
      queryParams.push(withoutProfessionId);
    }

    const result = await pool.query(query, queryParams);

    res.status(HTTP_STATUS.OK).json(result.rows); // Retourne les données insérées
  } catch (err) {
    console.error(err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send("Erreur serveur");
  }
});

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
router.get("/me/job/:id", authenticateToken, async (req, res) => {
  // Schema de validation Joi pour les paramètres du chemin
  const validations = createJoiSchema({
    id: { type: "uuid", required: true },
  });
  const { error } = validations.validate(req.params);

  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json(error.details[0].message);
  }

  try {
    const user_id = req.user.id;
    const job_id = req.params.id;

    let query = `
              SELECT * FROM user_professions
              WHERE user_id = $1 
              AND profession_id = $2
          `;

    const queryParams = [user_id, job_id];

    const result = await pool.query(query, queryParams);

    res.status(HTTP_STATUS.OK).json(result.rows[0]); // Retourne les données insérées
  } catch (err) {
    console.error(err);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send("Erreur serveur");
  }
});

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
router.get("/groups", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
            SELECT groups.id, groups.name, groups.code, groups.address, groups.cp, groups.city, groups.description, groups.background_url, user_groups.role, user_groups.joined_date
            FROM groups
            INNER JOIN user_groups ON groups.id = user_groups.group_id
            WHERE user_groups.user_id = $1
        `;

    const result = await pool.query(query, [userId]);

    res.status(HTTP_STATUS.OK).json(result.rows);
  } catch (err) {
    console.error(err);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json({ error: "Erreur server" });
  }
});

module.exports = router;
