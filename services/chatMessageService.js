/* eslint-disable camelcase */
/* eslint-disable no-useless-catch */
const pool = require('../db')
const { HTTP_STATUS } = require('../constants')
const { groupCheckUserExist } = require('./groupService')

const AddChatMessage = async (groupID, userID, message) => {
  const userExist = await groupCheckUserExist(groupID, userID)
  if (!userExist) {
    return {
      errorCode: HTTP_STATUS.FORBIDDEN,
      errorMessage: 'Utilisateur non autorisé à accéder aux messages de ce groupe',
    }
  }
  const result = await pool.query(
    'INSERT INTO chat_messages (group_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
    [groupID, userID, message]
  )
  return result.rows[0]
}

const getMessageFromGroup = async (groupID, userID) => {
  // check if user exist
  const userExist = await groupCheckUserExist(groupID, userID)
  if (!userExist) {
    return {
      errorCode: HTTP_STATUS.FORBIDDEN,
      errorMessage: 'Utilisateur non autorisé à accéder aux messages de ce groupe',
    }
  }
  const result = await pool.query('SELECT * FROM chat_messages where group_id = $1', [groupID])
  return { result: result.rows }
}

module.exports = {
  getMessageFromGroup,
  AddChatMessage,
}
