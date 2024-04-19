import { Express } from 'express';
import cors from 'cors';
import compression from 'compression';
import bodyParser from 'body-parser';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

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

const appSetup = (app: Express) =>
  app
  .use(cors())
  .use(compression())
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  .use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
  

export default appSetup;