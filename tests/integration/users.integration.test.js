/* eslint-disable camelcase */
const { describe, it, expect, beforeAll, afterAll } = require('@jest/globals')
const request = require('supertest')
const app = require('../../app')
const db = require('../../db')

let client = null
const username = 'JohnDoe'
const password = 'SecurePassword123'

const profession_id = 'e3f298ef-5d3e-4daf-b2f9-ab6b21e5f068'

let accessToken = ''
let userID = ''

describe('User Endpoints', () => {
  beforeAll(async () => {
    client = await db.connect()
  })

  afterAll(async () => {
    if (userID) {
      await db.query('DELETE FROM user_professions WHERE user_id = $1', [userID])
      // Supprimez l'utilisateur en utilisant l'ID stocké
      // Utilisez la logique d'accès à votre base de données pour effectuer la suppression
      await db.query('DELETE FROM users WHERE id = $1', [userID])
    }
    await client.release()
    await db.end()
  })

  describe('POST /api/users/register', () => {
    it('should create a new user and return 201 status', async () => {
      const newUser = {
        username,
        email: 'john.doe@example.com',
        password,
      }

      const res = await request(app).post('/api/users/register').send(newUser)

      accessToken = res.body.accessToken
      userID = res.body.user.id

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('user')
      expect(res.body).toHaveProperty('accessToken')
      expect(res.body).toHaveProperty('refreshToken')
    })

    it('should return a 400 status if validation fails', async () => {
      const invalidUser = {
        username: '',
        email: 'john.doe',
        password: '123',
      }

      const res = await request(app).post('/api/users/register').send(invalidUser)

      expect(res.status).toBe(400)
    })
  })
  describe('POST /api/users/login', () => {
    it('should login successfully and return a 200 status', async () => {
      const credentials = {
        username,
        password,
      }

      const res = await request(app).post('/api/users/login').send(credentials)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('user')
      expect(res.body).toHaveProperty('accessToken')
      expect(res.body).toHaveProperty('refreshToken')
    })

    it('should return a 403 status for incorrect credentials', async () => {
      const wrongCredentials = {
        username: 'nansou',
        password: 'wrongPassword',
      }

      const res = await request(app).post('/api/users/login').send(wrongCredentials)

      expect(res.status).toBe(403)
    })

    it('should return a 400 status for validation failure', async () => {
      const invalidCredentials = {
        username: '',
        password: '123',
      }

      const res = await request(app).post('/api/users/login').send(invalidCredentials)

      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/users/me', () => {
    it('should return user information and 200 status when authenticated', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('id')
      expect(res.body).toHaveProperty('username')
    })

    it('should return 401 status when not authenticated', async () => {
      const res = await request(app).get('/api/users/me')

      expect(res.status).toBe(401)
    })
  })

  describe('PUT /api/users/me', () => {
    it('should update user information and return 200 status when authenticated and data is valid', async () => {
      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          email: 'new.email@example.com',
          first_name: 'NewFirstName',
          last_name: 'NewLastName',
          // Vous pouvez ajouter d'autres champs ici si nécessaire
        })

      expect(res.status).toBe(200)
      expect(res.body.email).toBe('new.email@example.com')
      expect(res.body.first_name).toBe('NewFirstName')
      expect(res.body.last_name).toBe('NewLastName')
      // Ajoutez d'autres vérifications pour les champs mis à jour
    })

    it('should return 204 status when no fields are updated', async () => {
      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})

      expect(res.status).toBe(204)
    })

    it('should return 401 status when user is not found', async () => {
      // Supposons que vous ayez un moyen de rendre le token invalide ou de supprimer l'utilisateur associé
      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer 1212122121`)
        .send({
          username: 'new_username',
        })

      expect(res.status).toBe(401)
    })

    it('should return 400 status when validation fails', async () => {
      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          email: 'invalidEmail', // email invalide pour déclencher une validation côté serveur
        })

      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/users/me/job', () => {
    it('should link a job to the user and return 201 status', async () => {
      const res = await request(app)
        .post('/api/users/me/job')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          profession_id,
          description: 'Software Developer',
          experience_years: 5,
        })

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('user_id')
      expect(res.body).toHaveProperty('profession_id')
      expect(res.body).toHaveProperty('description')
      expect(res.body).toHaveProperty('experience_years')
      // Vous pouvez ajouter d'autres vérifications ici
    })

    it('should return 400 status when validation fails', async () => {
      const res = await request(app)
        .post('/api/users/me/job')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          profession_id: 'e3f298ef-5d3e-4daf-b2f9-ab6b21e5f069', // ID invalide pour déclencher une validation côté serveur
          description: 'Software Developer',
          experience_years: 5,
        })

      expect(res.status).toBe(400)
    })
  })
  describe('GET /api/users/me/job', () => {
    it('should fetch user jobs and return 200 status', async () => {
      const res = await request(app)
        .get('/api/users/me/job')
        .set('Authorization', `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBeTruthy()
      expect(res.body.length).toBeGreaterThan(0)
      expect(res.body[0]).toHaveProperty('id')
      expect(res.body[0]).toHaveProperty('name')
      expect(res.body[0]).toHaveProperty('description')
      expect(res.body[0]).toHaveProperty('experience_years')
    })

    it('should fetch user jobs without jobId passe in the query and return 200 status', async () => {
      const res = await request(app)
        .get('/api/users/me/job')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({
          without: profession_id,
        })

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBeTruthy()
      expect(res.body.length).toBe(0)
    })
  })
  describe('GET /api/users/me/job/{id}', () => {
    it('should fetch a specific job by ID and return a 200 status', async () => {
      const res = await request(app)
        .get(`/api/users/me/job/${profession_id}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('user_id')
      expect(res.body.user_id).toBe(userID)
      expect(res.body).toHaveProperty('profession_id')
      expect(res.body).toHaveProperty('description')
      expect(res.body).toHaveProperty('experience_years')
    })
  })

  describe('PUT /api/users/me/job/{id}', () => {
    it('should update a specific job by ID and return a 200 status', async () => {
      const res = await request(app)
        .put(`/api/users/me/job/${profession_id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          description: 'New Job Description',
          experience_years: 10,
        })

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('user_id')
      expect(res.body.user_id).toBe(userID)
      expect(res.body).toHaveProperty('profession_id')
      expect(res.body).toHaveProperty('description')
      expect(res.body.description).toBe('New Job Description')
      expect(res.body).toHaveProperty('experience_years')
      expect(res.body.experience_years).toBe(10)
    })

    it('should return 400 status when validation fails', async () => {
      const res = await request(app)
        .put(`/api/users/me/job/${profession_id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          description: 'New Job Description',
          experience_years: 'invalid', // experience_years invalide pour déclencher une validation côté serveur
        })

      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/users/{id}', () => {
    it('should fetch a specific user by ID and return a 200 status', async () => {
      const res = await request(app).get(`/api/users/${userID}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('id')
      expect(res.body.id).toBe(userID)
      expect(res.body).toHaveProperty('jobs')
      expect(Array.isArray(res.body.jobs)).toBeTruthy()
      expect(res.body.jobs.length).toBeGreaterThan(0)
    })
  })
})
