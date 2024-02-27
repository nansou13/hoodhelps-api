const admin = require('firebase-admin')
const dotenv = require('dotenv')

// Charger les variables d'environnement locales si on est en développement ou en test
if (process.env.NODE_ENV !== 'production') {
  dotenv.config()
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const sendNotification = async (token, title, body) => {
  try {
    const message = {
      notification: {
        title,
        body,
      },
      token,
    }

    // Send a message to the device corresponding to the provided
    // registration token.
    await admin
      .messaging()
      .send(message)
      .then((response) => {
        // Response is a message ID string.
        console.log('Successfully sent message:', response)
      })
      .catch((error) => {
        console.log('Error sending message:', error)
      })
  } catch (error) {
    console.log('Error sending notification:', error)
  }
}

module.exports = { sendNotification }
