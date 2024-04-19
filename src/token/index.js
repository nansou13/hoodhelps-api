const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')

// Charger les variables d'environnement locales si on est en développement ou en test
if (process.env.NODE_ENV !== 'production') {
  dotenv.config()
}

function generateRefreshToken(user) {
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '1y' })
}

function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1800s' })
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]

  if (token == null) return res.sendStatus(401)

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(401)
    }
    req.user = user
    next()
  })
}

module.exports = {
  authenticateToken,
  generateRefreshToken,
  generateAccessToken,
}
