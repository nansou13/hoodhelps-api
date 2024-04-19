/* eslint-disable camelcase */
const { describe, it, expect, beforeAll, afterAll } = require('@jest/globals')
const request = require('supertest')
const app = require('../../app')
const db = require('../../db')
let client = null
const username = 'JohnDoeGroups'
const password = 'SecurePassword123'
const username2 = 'JohnDoeGroups2'

let userID = ''
let userID2 = ''
let accessToken = ''
let accessToken2 = ''
let groupID = ''

describe('Groups Endpoints', () => {
  beforeAll(async () => {
    client = await db.connect()

    const newUser = {
      username,
      email: 'john.doe@example.com',
      password,
    }

    const res = await request(app).post('/api/users/register').send(newUser)
    accessToken = res.body.accessToken
    userID = res.body.user.id

    const newUser2 = {
      username: username2,
      email: 'john.doe2@example.com',
      password,
    }

    const res2 = await request(app).post('/api/users/register').send(newUser2)
    accessToken2 = res2.body.accessToken
    userID2 = res2.body.user.id

    const newGroup = {
      name: 'Test Group',
      address: '123 Test St',
      cp: '12345',
      city: 'Test City',
      description: 'This is a test group',
      background_url: 'http://example.com/background.jpg',
    }

    const result = await request(app).post('/api/groups').send(newGroup)

    groupID = result.body.id

    await request(app).post(`/api/groups/${groupID}/user`).send({
      user_id: userID,
    })
  })

  afterAll(async () => {
    if (userID) {
      await db.query('DELETE FROM chat_messages WHERE group_id = $1', [groupID])
      await db.query('DELETE FROM user_groups WHERE user_id = $1', [userID])
      await db.query('DELETE FROM users WHERE id = $1', [userID])
      await db.query('DELETE FROM users WHERE id = $1', [userID2])
    }
    if (groupID) {
      await db.query('DELETE FROM groups WHERE id = $1', [groupID])
    }
    await client.release()
    await db.end()
  })

  describe('GET /api/chat-message/{groupId}', () => {
    it('should fetch all messages from a group and return a 200 status', async () => {
      const res = await request(app)
        .get(`/api/chat-message/${groupID}`)
        .set('Authorization', `Bearer ${accessToken}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBeTruthy()
      expect(res.body.length).toBe(0)
    })

    it('should fetch display error messages if user not in the group', async () => {
      const res = await request(app)
        .get(`/api/chat-message/${groupID}`)
        .set('Authorization', `Bearer ${accessToken2}`)

      expect(res.status).toBe(403)
      // expect(Array.isArray(res.body)).toBeTruthy()
      // expect(res.body.length).toBe(0)
      // expect(res.body[0]).toHaveProperty('id')
      // expect(res.body[0]).toHaveProperty('name')
      // expect(res.body[0]).toHaveProperty('code')
    })
  })
  describe('POST /api/chat-message/{groupId}', () => {
    it('should add a message to the group and return a 201 status', async () => {
      const res = await request(app)
        .post(`/api/chat-message/${groupID}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Hello, this is a test message',
        })

      expect(res.status).toBe(201)
    })

    it('should fetch display error messages if validation failed', async () => {
      const res = await request(app)
        .post(`/api/chat-message/${groupID}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          toto: 'Hello, this is a test message',
        })

      expect(res.status).toBe(400)
    })

    it('should fetch display error messages if user not in the group', async () => {
      const res = await request(app)
        .post(`/api/chat-message/${groupID}`)
        .set('Authorization', `Bearer ${accessToken2}`)
        .send({
          content: 'Hello, this is a test message',
        })

      expect(res.status).toBe(403)
    })
  })
})
