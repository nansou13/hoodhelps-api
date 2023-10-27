/* eslint-disable no-console */
const http = require('http').createServer(require('./app'))
const port = process.env.PORT || 5100

http.listen(port, () => {
  console.log(`listening on *:${port}`)
})
