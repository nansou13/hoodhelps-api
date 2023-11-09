require('dotenv').config()
const app = require('express')()
const bodyParser = require('body-parser')
const swaggerJSDoc = require('swagger-jsdoc')
const cors = require('cors')
const swaggerUi = require('swagger-ui-express')
const compression = require('compression')

const userRoutes = require('./routes/usersRoutes')
const categoriesRoutes = require('./routes/categoriesRoutes')
const groupsRoutes = require('./routes/groupsRoutes')

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

module.exports = app
