/* eslint-disable camelcase */
const { describe, it, expect } = require('@jest/globals')
const request = require('supertest')
const app = require('../../app')

describe('Cache Endpoints', () => {
  describe('GET /api/cache/index', () => {
    it('should return 200 status', async () => {
      const res = await request(app).get('/api/cache/index')
      expect(res.status).toBe(200)
      expect(res.body).toEqual(expect.any(Object))
      expect(res.body.all).toEqual(expect.any(Array))
    })

    it('GET /api/cache/clear devrait effacer le cache avec un statut 200', async () => {
      const res = await request(app).get(
        `/api/cache/clear/${encodeURIComponent('/api/categories')}`
      )
      expect(res.status).toBe(200)
      expect(res.body).toEqual(expect.any(Object))
      expect(res.body.all).toEqual(expect.any(Array))
      expect(res.body.all.length).toBe(0)
    })
  })
})
