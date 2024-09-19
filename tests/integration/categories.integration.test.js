/* eslint-disable camelcase */
const { describe, it, expect, beforeAll, afterAll } = require('@jest/globals')
const request = require('supertest')
const app = require('../../app')
const db = require('../../db')
const { registerUser, linkJobToUser } = require('../../services/userService')
const { createGroups, groupsAddUser } = require('../../services/groupService')

let client = null
const newUser = {
  username: 'JohnDoeGroups',
  email: 'john.doe@example.com',
  password: 'SecurePassword123',
}
const newGroup = {
  name: 'Test Group',
  address: '123 Test St',
  cp: '12345',
  city: 'Test City',
  description: 'This is a test group',
  background_url: 'http://example.com/background.jpg',
}

let userID = ''
let groupID = ''
let categoryID = ''
let jobID = ''

describe('Categories Endpoints', () => {
  beforeAll(async () => {
    client = await db.connect()

    // create group
    const groupResult = await createGroups(newGroup)
    groupID = groupResult.id

    // create user
    const res = await registerUser(newUser.username, newUser.email, newUser.password)
    userID = res.user.id

    // link user to group
    await groupsAddUser(groupID, userID)
  })

  afterAll(async () => {
    if (userID) {
      await db.query('DELETE FROM user_groups WHERE user_id = $1', [userID])
      if (jobID) await db.query('DELETE FROM user_professions WHERE user_id = $1', [userID])
      await db.query('DELETE FROM users WHERE id = $1', [userID])
    }
    if (groupID) {
      await db.query('DELETE FROM groups WHERE id = $1', [groupID])
    }
    if (jobID) {
      await db.query('DELETE FROM professions WHERE id = $1', [jobID])
    }
    if (categoryID) {
      await db.query('DELETE FROM categories WHERE id = $1', [categoryID])
    }
    await client.release()
    await db.end()
  })

  describe('POST /api/categories', () => {
    it('should create a new category and return a 201 status', async () => {
      const newCategory = {
        name: 'Test categorie',
      }
      const res = await request(app).post('/api/categories').send(newCategory)
      categoryID = res.body.id

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('id')
      expect(res.body.name).toEqual(newCategory.name)
    })

    it('should return a 400 status for bad request', async () => {
      const newCategory = {
        // Intentionnellement incomplet pour provoquer une erreur
        name: '',
      }

      const res = await request(app).post('/api/categories').send(newCategory)
      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/categories', () => {
    it('should return a list of categories and a 200 status', async () => {
      const res = await request(app).get('/api/categories')

      expect(res.status).toBe(200)
      expect(res.body).toBeInstanceOf(Array)
      expect(res.body.length).toBeGreaterThan(0)
      expect(res.body[0]).toHaveProperty('id')
      expect(res.body[0]).toHaveProperty('name')
    })
  })

  describe('GET /api/categories/jobs', () => {
    it('should return a list of jobs and a 200 status', async () => {
      const res = await request(app).get('/api/categories')

      expect(res.status).toBe(200)
      expect(res.body).toBeInstanceOf(Array)
      expect(res.body.length).toBeGreaterThan(0)
      expect(res.body[0]).toHaveProperty('id')
      expect(res.body[0]).toHaveProperty('name')
    })
  })

  describe('POST /api/categories/:categoryId', () => {
    it('should create a new job and return a 201 status', async () => {
      const newJob = {
        profession_name: 'Test Job',
      }

      const res = await request(app).post(`/api/categories/${categoryID}`).send(newJob)
      jobID = res.body.id
      // link user to job
      await linkJobToUser(userID, {
        profession_id: jobID,
        description: 'test description',
        experience_years: 1,
      })

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('id')
      expect(res.body).toHaveProperty('name')
      expect(res.body.name).toEqual(newJob.profession_name)
    })

    it('should return a 404 status for non existing category', async () => {
      const newJob = {
        profession_name: 'Test Job',
      }

      const res = await request(app)
        .post(`/api/categories/e3f298ef-5d3e-4daf-b2f9-ab6b21e5f069`)
        .send(newJob)

      expect(res.status).toBe(404)
    })

    it('should return a 400 status for bad request', async () => {
      const badJob = {
        // Intentionnellement incomplet pour provoquer une erreur
        profession_name: '',
      }

      const res = await request(app).post(`/api/categories/${categoryID}`).send(badJob)

      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/categories/{category_id}', () => {
    it('should get category details by ID and return 200 status', async () => {
      const res = await request(app).get(`/api/categories/${categoryID}`)
      expect(res.status).toBe(200)
      expect(res.body.id).toEqual(categoryID)
      expect(res.body).toHaveProperty('name')
      expect(res.body).toHaveProperty('professions_list')
      expect(res.body.professions_list).toBeInstanceOf(Array)
      expect(res.body.professions_list.length).toBeGreaterThan(0)
      expect(res.body.professions_list[0]).toHaveProperty('id')
      expect(res.body.professions_list[0]).toHaveProperty('name')
      expect(res.body.professions_list[0].id).toEqual(jobID)
    })

    it('should return a 404 status for non-existent category', async () => {
      const res = await request(app).get('/api/categories/e3f298ef-5d3e-4daf-b2f9-ab6b21e5f069')
      expect(res.status).toBe(404)
    })

    it('should return a 400 status for non-uuid categoryID', async () => {
      const res = await request(app).get('/api/categories/toto')
      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/categories/group/{group_id}', () => {
    it('should get categories list by group ID and return 200 status', async () => {
      const res = await request(app).get(`/api/categories/group/${groupID}`)
      expect(res.status).toBe(200)
      expect(res.body).toBeInstanceOf(Array)
      expect(res.body.length).toBeGreaterThan(0)

      res.body.forEach((category) => {
        if (category.id === categoryID) {
          expect(category).toHaveProperty('id')
          expect(category).toHaveProperty('name')
          expect(category).toHaveProperty('professions')
          expect(category.professions).toBeInstanceOf(Array)
          expect(category.professions.length).toBeGreaterThan(0)
          expect(category.professions[0]).toHaveProperty('profession_id')
          expect(category.professions[0].profession_id).toEqual(jobID)
          expect(category.professions[0]).toHaveProperty('profession_name')
          expect(category.professions[0].user_count).toBeGreaterThan(0)
        }
      })
    })
    it('should return a 404 status for non-existent group', async () => {
      const res = await request(app).get(
        '/api/categories/group/e3f298ef-5d3e-4daf-b2f9-ab6b21e5f069'
      )
      expect(res.status).toBe(404)
    })
    it('should return a 400 status for non-uuid groupID', async () => {
      const res = await request(app).get('/api/categories/group/toto')
      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/categories/{groupId}/jobs/{professionId}/users', () => {
    it('should get user list by category ID and group ID and return 200 status', async () => {
      const res = await request(app).get(`/api/categories/${groupID}/jobs/${jobID}/users`)
      expect(res.status).toBe(200)
      expect(res.body).toBeInstanceOf(Array)
      expect(res.body.length).toBeGreaterThan(0)
      expect(res.body[0]).toHaveProperty('id')
      expect(res.body[0].id).toEqual(userID)
      expect(res.body[0]).toHaveProperty('username')
      expect(res.body[0]).toHaveProperty('email')
    })

    it('should return a empty array for non-existent group', async () => {
      const res = await request(app).get(
        `/api/categories/e3f298ef-5d3e-4daf-b2f9-ab6b21e5f069/jobs/${jobID}/users`
      )

      expect(res.status).toBe(200)
      expect(res.body).toBeInstanceOf(Array)
      expect(res.body.length).toBe(0)
    })

    it('should return an empty array for non-existent job', async () => {
      const res = await request(app).get(
        `/api/categories/${groupID}/jobs/e3f298ef-5d3e-4daf-b2f9-ab6b21e5f069/users`
      )
      expect(res.status).toBe(200)
      expect(res.body).toBeInstanceOf(Array)
      expect(res.body.length).toBe(0)
    })

    it('should return a 400 status for non-uuid group', async () => {
      const res = await request(app).get(`/api/categories/toto/jobs/${jobID}/users`)
      expect(res.status).toBe(400)
    })
    it('should return a 400 status for non-uuid groupID', async () => {
      const res = await request(app).get(`/api/categories/${groupID}/jobs/toto/users`)
      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/categories/{groupId}/users', () => {
    it('should get categorie list with users by group ID and return 200 status', async () => {
      const res = await request(app).get(`/api/categories/${groupID}/users`)
      expect(res.status).toBe(200)
      expect(res.body).toBeInstanceOf(Array)
      expect(res.body.length).toBeGreaterThan(0)
      expect(res.body[0]).toHaveProperty('category_id')
      expect(res.body[0]).toHaveProperty('job_name')
      expect(res.body[0]).toHaveProperty('first_name')
      expect(res.body[0]).toHaveProperty('last_name')
      expect(res.body[0]).toHaveProperty('image_url')
    })

    it('should return a 400 status for non-uuid group', async () => {
      const res = await request(app).get(`/api/categories/toto/users`)
      expect(res.status).toBe(400)
    })
  })
})
