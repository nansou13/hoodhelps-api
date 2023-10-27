/* eslint-disable camelcase */
/* eslint-disable no-useless-catch */
const pool = require('../db')
const { makeid } = require('../utils')

const getGroups = async (limit, offset) => {
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
`
  const queryParams = [limit, offset]
  const result = await pool.query(query, queryParams)

  return result.rows
}

const getGroupsById = async (groupID) => {
  try {
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
      `

    const result = await pool.query(query, [groupID])
    if (result.rows.length === 0) {
      return {
        errorCode: 404,
        errorMessage: "Ce groupe n'existe pas.",
      }
    }

    return result
  } catch (err) {
    throw err
  }
}

const createGroups = async (data) => {
  const code = `${makeid(4)}-${makeid(4)}-${makeid(4)}`
  const { name, address, cp, city, description, background_url } = data
  const result = await pool.query(
    'INSERT INTO groups (name, code, address, cp, city, description, background_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [name, code, address, cp, city, description, background_url]
  )

  return result.rows[0]
}

const updateGroups = async (groupId, data) => {
  const { name, code, address, cp, city, description, background_url } = data

  // Préparation de la mise à jour
  const fields = []
  const values = []
  let counter = 1

  if (name) {
    fields.push(`name = $${counter}`)
    values.push(name)
    counter += 1
  }
  if (code) {
    fields.push(`code = $${counter}`)
    values.push(code)
    counter += 1
  }
  if (address) {
    fields.push(`address = $${counter}`)
    values.push(address)
    counter += 1
  }
  if (cp) {
    fields.push(`cp = $${counter}`)
    values.push(cp)
    counter += 1
  }
  if (city) {
    fields.push(`city = $${counter}`)
    values.push(city)
    counter += 1
  }
  if (description) {
    fields.push(`description = $${counter}`)
    values.push(description)
    counter += 1
  }
  if (background_url) {
    fields.push(`background_url = $${counter}`)
    values.push(background_url)
    counter += 1
  }

  // Si aucun champ à mettre à jour n'est fourni, renvoyer une erreur
  if (fields.length === 0) {
    return {
      errorCode: 204,
      errorMessage: 'Aucun champ à mettre à jour',
    }
  }

  // Ajouter l'id du groupe aux valeurs et préparer la requête SQL
  values.push(groupId)
  const query = `UPDATE groups SET ${fields.join(', ')} WHERE id = $${counter} RETURNING *`

  const result = await pool.query(query, values)

  if (result.rowCount === 0) {
    return {
      errorCode: 404,
      errorMessage: 'Groupe non trouvé',
    }
  }
  return { result: result.rows[0] }
}

const getGroupsByCode = async (code) => {
  try {
    const result = await pool.query('SELECT id FROM groups WHERE code = $1', [code])
    if (result.rowCount !== 1) {
      return {
        errorCode: 404,
        errorMessage: 'Groupe non trouvé',
      }
    }
    return { id: result.rows[0].id }
  } catch (err) {
    throw err
  }
}

const groupsAddUser = async (groupID, userID) => {
  try {
    // Role est optionnel, s'il n'est pas fourni, il sera défini par défaut sur 'user' grâce à la définition de la table
    const query = `INSERT INTO user_groups (user_id, group_id) VALUES ($1, $2) RETURNING *`
    const values = [userID, groupID]

    const result = await pool.query(query, values)

    return { result: result.rows[0] }
  } catch (err) {
    throw err
  }
}

module.exports = {
  getGroups,
  getGroupsById,
  createGroups,
  updateGroups,
  getGroupsByCode,
  groupsAddUser,
}
