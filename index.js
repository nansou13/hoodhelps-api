require('dotenv').config();
const app = require('express')();
const http = require('http').createServer(app);
const bodyParser = require('body-parser');
const pool = require('./db');
const userRoutes = require('./routes/users');
const categoriesRoutes = require('./routes/categories');
const groupsRoutes = require('./routes/groups');
const jwt = require('jsonwebtoken')
const swaggerJSDoc = require('swagger-jsdoc');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

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
  ],
  components: {        
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
  }
  },
  apis: ['./routes/*/*.js'], // files containing annotations as above
};

const swaggerSpec = swaggerJSDoc(options);



// Autorise toutes les origines à accéder à votre API (à des fins de développement)
app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/users', userRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/groups', groupsRoutes);


const sql = "SELECT * FROM categories";
  pool.query(sql, [], (err, result) => {
    if (err) {
      return console.error(err.message);
    }
    console.log("test", result.rows);
  });


app.get('/users', (req, res) => {
  return res.send('GET HTTP method on user resource');
});

const port = process.env.PORT || 5100;
http.listen(port, () => {
  console.log(`listening on *:${port}`);
});