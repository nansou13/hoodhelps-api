/* eslint-disable camelcase */
const { describe, it, expect, beforeAll, afterAll } = require('@jest/globals')
const request = require('supertest')
const app = require('../../app')
const db = require('../../db')

const username = 'JohnDoeGroups'
const password = 'SecurePassword123'

let userID = ''
let accessToken = ''
let groupID = ''
let groupCode = ''

describe('Groups Endpoints', () => {
  beforeAll(async () => {
    await db.connect()

    const newUser = {
      username,
      email: 'john.doe@example.com',
      password,
    }

    const res = await request(app).post('/api/users/register').send(newUser)

    accessToken = res.body.accessToken
    userID = res.body.user.id
  })

  afterAll(async () => {
    if (userID) {
      await db.query('DELETE FROM user_groups WHERE user_id = $1', [userID])
      await db.query('DELETE FROM users WHERE id = $1', [userID])
    }
    if (groupID) {
      await db.query('DELETE FROM groups WHERE id = $1', [groupID])
    }
  })
  describe('POST /api/groups', () => {
    it('should create a new group and return a 201 status', async () => {
      const newGroup = {
        name: 'Test Group',
        address: '123 Test St',
        cp: '12345',
        city: 'Test City',
        description: 'This is a test group',
        background_url: 'http://example.com/background.jpg',
      }

      const res = await request(app).post('/api/groups').send(newGroup)

      groupID = res.body.id
      groupCode = res.body.code

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('id')
      expect(res.body.name).toEqual(newGroup.name)
      expect(res.body.address).toEqual(newGroup.address)
      expect(res.body.cp).toEqual(newGroup.cp)
      expect(res.body.city).toEqual(newGroup.city)
      expect(res.body.description).toEqual(newGroup.description)
      expect(res.body.background_url).toEqual(newGroup.background_url)
    })
    it('should return a 400 status for bad request', async () => {
      const newGroup = {
        // Intentionnellement incomplet pour provoquer une erreur
        name: '',
      }

      const res = await request(app).post('/api/groups').send(newGroup)

      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/groups', () => {
    it('should return groups information and 200 status empty test', async () => {
      const res = await request(app).get('/api/groups')

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBeTruthy()
      expect(res.body.length).toBeGreaterThan(0)
      expect(res.body[0]).toHaveProperty('id')
      expect(res.body[0]).toHaveProperty('name')
      expect(res.body[0]).toHaveProperty('code')
      expect(res.body[0]).toHaveProperty('users')
    })
  })

  describe('GET /api/groups/{id}', () => {
    it('should get group details by ID and return 200 status', async () => {
      const res = await request(app).get(`/api/groups/${groupID}`)
      expect(res.status).toBe(200)
      expect(res.body.id).toEqual(groupID)
      expect(res.body).toHaveProperty('name')
      expect(res.body).toHaveProperty('code')
      expect(res.body).toHaveProperty('users') // Assurez-vous que le groupe exemple ait des utilisateurs associés si vous voulez tester cette propriété
    })

    it('should return a 404 status for non-existent group', async () => {
      const res = await request(app).get('/api/groups/e3f298ef-5d3e-4daf-b2f9-ab6b21e5f069')
      expect(res.status).toBe(404)
    })

    it('should return a 400 status for non-uuid groupID', async () => {
      const res = await request(app).get('/api/groups/toto')
      expect(res.status).toBe(400)
    })
  })

  describe('PUT /api/groups/{id}', () => {
    it('should update group information and return 200 status when data is valid', async () => {
      const updatedGroup = {
        name: 'Test Group updated',
        address: '123 Test St updated',
        cp: '12346',
        city: 'Test City updated',
        description: 'This is a test group updated',
        background_url: 'http://example.com/background_updated.jpg',
      }
      const res = await request(app).put(`/api/groups/${groupID}`).send(updatedGroup)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('id')
      expect(res.body.name).toEqual(updatedGroup.name)
      expect(res.body.address).toEqual(updatedGroup.address)
      expect(res.body.cp).toEqual(updatedGroup.cp)
      expect(res.body.city).toEqual(updatedGroup.city)
      expect(res.body.description).toEqual(updatedGroup.description)
      expect(res.body.background_url).toEqual(updatedGroup.background_url)
      // Ajoutez d'autres vérifications pour les champs mis à jour
    })

    it('should return 204 status when no fields are updated', async () => {
      const res = await request(app).put(`/api/groups/${groupID}`).send({})

      expect(res.status).toBe(204)
    })

    it('should return 404 status when group is not found', async () => {
      // Supposons que vous ayez un moyen de rendre le token invalide ou de supprimer l'utilisateur associé
      const res = await request(app).put(`/api/groups/e3f298ef-5d3e-4daf-b2f9-ab6b21e5f069`).send({
        cp: '13090',
      })

      expect(res.status).toBe(404)
    })

    it('should return 400 status when validation fails', async () => {
      const res = await request(app).put(`/api/groups/${groupID}`).send({
        cp: '1309D4350',
      })

      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/groups/code/{id}', () => {
    it('should fetch a specific group by code and return a 200 status', async () => {
      const res = await request(app).get(`/api/groups/code/${groupCode}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('id')
    })

    it('should return 400 status when validation fails', async () => {
      const res = await request(app).get(`/api/groups/code/lalala`)

      expect(res.status).toBe(400)
    })

    it('should return 404 status when group not found', async () => {
      const res = await request(app).get(`/api/groups/code/XXXX-XXXX-XXXX`)

      expect(res.status).toBe(404)
    })
  })

  describe('POST /api/groups/{id}/user', () => {
    it('should link a user to a group and return a 201 status', async () => {
      const res = await request(app).post(`/api/groups/${groupID}/user`).send({
        user_id: userID,
      })

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('user_id')
      expect(res.body).toHaveProperty('group_id')
    })

    it('should return 400 status when validation fails', async () => {
      const res = await request(app).post(`/api/groups/${groupID}/user`).send({
        user_id: 'pouet',
      })

      expect(res.status).toBe(400)
    })

    it('should return 404 status when group not found', async () => {
      const res = await request(app).get(`/api/groups/e3f298ef-5d3e-4daf-b2f9-ab6b21e5f069/user`)

      expect(res.status).toBe(404)
    })
  })

  describe('GET /api/users/groups', () => {
    it('should fetch all groups by userID and return a 200 status', async () => {
      const res = await request(app)
        .get(`/api/users/groups`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBeTruthy()
      expect(res.body.length).toBeGreaterThan(0)
      expect(res.body[0]).toHaveProperty('id')
      expect(res.body[0]).toHaveProperty('name')
      expect(res.body[0]).toHaveProperty('code')
    })
  })
})
