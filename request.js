const request = require('request')
const fs = require('fs')

const url = process.argv[2]

request(url, (err, response, body) => {
  fs.writeFile(`./${url.split('/')[url.split('/').length - 1]}`, body, err => {})
})