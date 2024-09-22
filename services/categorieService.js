/* eslint-disable camelcase */
/* eslint-disable no-useless-catch */
const pool = require('../db')
const { HTTP_STATUS } = require('../constants')

const createCategorie = async (name) => {
  const result = await pool.query('INSERT INTO categories (name) VALUES ($1) RETURNING *', [name])
  return result.rows[0]
}

const getAllCategories = async () => {
  const result = await pool.query('SELECT * FROM categories')
  return result.rows
}

const getAllJobs = async () => {
  const result = await pool.query('SELECT * FROM professions')
  return result.rows
}

const createJob = async (categoryId, name) => {
  // check si ID exist dans les catégories
  const exist = await pool.query('SELECT * FROM categories WHERE id = $1', [categoryId])
  if (exist.rowCount === 0) {
    return {
      errorCode: HTTP_STATUS.NOT_FOUND,
      errorMessage: 'Categorie non trouvée',
    }
  }

  const result = await pool.query(
    'INSERT INTO professions (name, category_id) VALUES ($1, $2) RETURNING *',
    [name, categoryId]
  )
  return result.rows[0]
}

const getCategoriesFromGroupID = async (groupID) => {
  // check si ID exist dans les catégories
  const exist = await pool.query('SELECT * FROM groups WHERE id = $1', [groupID])
  if (exist.rowCount === 0) {
    return {
      errorCode: HTTP_STATUS.NOT_FOUND,
      errorMessage: "Ce groupe n'existe pas.",
    }
  }

  const query = `
     SELECT
       c.id,
       c.name,
       SUM(COALESCE(u.user_count, 0)) AS users,
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
   `

  const result = await pool.query(query, [groupID])
  return result.rows
}

const getCategorieById = async (categorieId) => {
  const result = await pool.query(
    "SELECT categories.id, categories.name, ARRAY_AGG(jsonb_build_object('id', professions.id, 'name', professions.name)) AS professions_list FROM categories LEFT JOIN professions ON categories.id = professions.category_id WHERE categories.id = $1 GROUP BY categories.id, categories.name;",
    [categorieId]
  )

  if (result.rowCount === 0) {
    return {
      errorCode: HTTP_STATUS.NOT_FOUND,
      errorMessage: 'categorie inexistante',
    }
  }
  return result.rows[0]
}

const getUsersFromGroupAndJobID = async (groupId, professionId) => {
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
        users.image_url,
        users.last_login,
        users.is_active,
        users.role,
        users.phone_number,
        user_professions.experience_years,
        user_professions.description
      FROM users
      INNER JOIN user_groups ON users.id = user_groups.user_id
      INNER JOIN user_professions ON users.id = user_professions.user_id
      WHERE user_groups.group_id = $1 AND user_professions.profession_id = $2
    `

  const result = await pool.query(query, [groupId, professionId])

  return result.rows
}

const getCategoriesWithUsersFromGroupID = async (groupId) => {
  // Requête SQL pour obtenir la liste des utilisateurs
  const query = `
  SELECT 
    u.id as user_id,
    u.username,
    u.first_name,
    u.last_name,
    u.image_url,
    p.id as job_id,
    p.name as job_name,
    c.id as category_id,
    c.name as category_name
FROM users u
JOIN user_professions up ON u.id = up.user_id
JOIN professions p ON up.profession_id = p.id
JOIN categories c ON p.category_id = c.id
JOIN user_groups ug ON u.id = ug.user_id
WHERE ug.group_id = $1;
    `

  const result = await pool.query(query, [groupId])

  return result.rows
}

module.exports = {
  createCategorie,
  getAllCategories,
  getAllJobs,
  getCategoriesFromGroupID,
  createJob,
  getCategorieById,
  getUsersFromGroupAndJobID,
  getCategoriesWithUsersFromGroupID,
}
