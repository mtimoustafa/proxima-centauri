import express from 'express'
const app = express()

app.use(express.static('.'))

app.get('/', (req, res) => {
  res.sendFile('/static/index.html')
})

app.listen(8080, () => {
  console.log('Server listening on http://localhost:8080')
})
