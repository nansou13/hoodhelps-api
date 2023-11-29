require('dotenv').config()
const app = require('express')()
const bodyParser = require('body-parser')
const swaggerJSDoc = require('swagger-jsdoc')
const cors = require('cors')
const swaggerUi = require('swagger-ui-express')
const compression = require('compression')
const nodemailer = require('nodemailer')

const userRoutes = require('./routes/usersRoutes')
const categoriesRoutes = require('./routes/categoriesRoutes')
const groupsRoutes = require('./routes/groupsRoutes')
const cacheRoutes = require('./routes/cacheRoutes')

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Express API for my App',
      version: '1.0.0',
      description:
        'This is a REST API application made with Express. It retrieves data for my new app.',
      license: {
        name: 'Licensed Under MIT',
        url: 'https://spdx.org/licenses/MIT.html',
      },
      contact: {
        name: 'Nansou13',
        url: 'http://cv.gigan.fr',
      },
    },
    servers: [
      {
        url: 'http://localhost:5100',
        description: 'Development server',
      },
      {
        url: 'https://ng13-hoodhelp-api-532352f896c6.herokuapp.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./routes/*.js'], // files containing annotations as above
}

const transporter = nodemailer.createTransport({
  host: 'smtp.ionos.fr',
  port: 465,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASSWORD,
  },
})

const swaggerSpec = swaggerJSDoc(options)

// Autorise toutes les origines à accéder à votre API (à des fins de développement)
app.use(cors())

app.use(compression())

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.use('/api/users', userRoutes)
app.use('/api/categories', categoriesRoutes)
app.use('/api/groups', groupsRoutes)
app.use('/api/cache', cacheRoutes)

// Middleware pour gérer les erreurs
app.use((err, req, res, next) => {
  // Vérifiez si l'erreur est une erreur 4xx ou 5xx
  if (err.status >= 400 && err.status < 600) {
    // Format du message d'e-mail
    const emailBody = `Erreur détectée: ${err.status} - ${err.message}\n\nStack Trace:\n${err.stack}`

    // Envoyer l'e-mail
    transporter.sendMail(
      {
        from: 'errorhoodhelps@gigan.fr',
        to: 'hoodhelps@gigan.fr',
        subject: "Erreur dans l'API",
        text: emailBody,
      },
      (error) => {
        if (error) {
          console.log("Erreur lors de l'envoi de l'e-mail", error)
        }
      }
    )
  }

  // Passez à l'erreur suivante (ou terminez la réponse si nécessaire)
  next(err)
})

module.exports = app
