const PORT = 3000
const {app} = require('./app')

app.listen(PORT, () => {
  console.log(`express server listening on port ${PORT}`)
})
