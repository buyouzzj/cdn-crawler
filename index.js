const request = require('request');
const fs = require('fs')
const path = require('path')

const packs = process.argv.slice(2)
const getUrl = keyword => `https://api.cdnjs.net/libraries/${keyword}`
const STATIC_FILE_DIR = 'https://libs.cdnjs.net'
const LOCALE_FILE_DIR = './public'

// deleteFolder(LOCALE_FILE_DIR);
// function deleteFolder(path) {
//   let files = [];
//   if (fs.existsSync(path)) {
//     files = fs.readdirSync(path);
//     files.forEach((file, index) => {
//       let curPath = path + "/" + file;
//       if(fs.statSync(curPath).isDirectory()) {
//         deleteFolder(curPath);
//       } else {
//         fs.unlinkSync(curPath);
//       }
//     });
//     fs.rmdirSync(path);
//   }
// }

// fs.mkdir('./public', err => {})

if (!packs.length) {
  console.error('需要输入包名')
  return
}

// setTimeout(() => getStaticFile(packs), 7 * 24 * 60 * 60 * 1000)

// 1. 先去请求对应资源的接口，比如https://api.cdnjs.net/libraries/antd
function getPackData (pack) {
  request(getUrl(pack), (err, response, body) => {
    if (err) console.log(err)
    // 说明是正常的
    else if (JSON.stringify(body) !== '{}') {
      // 2. 创建版本目录
      const dir = fs.mkdirSync(`${LOCALE_FILE_DIR}/${pack}`, { recursive: true })
      if (!dir) {
        // 3. 创建目录成功后，需要请求body下面的assets的资源并写到文件当中
        writeFileSync(body, pack)
      }
    } else {
      console.log(`无此资源：${pack}`)
    }
  })
}

function writeFileSync (body, pack) {
  const { assets = [] } = JSON.parse(body)
  assets.forEach((asset, index) => {
    if (index === 0) {
      const mkdir = fs.mkdirSync(`${LOCALE_FILE_DIR}/${pack}/${asset.version}`, { recursive: true })
      if (!mkdir) {
        const { files = [] } = asset
        files.forEach(file => {
          const splitFile = file.split('/')
          const len = splitFile.length
          if (len > 1) {
            const createdDir = fs.mkdirSync(`${LOCALE_FILE_DIR}/${pack}/${asset.version}/${splitFile.slice(0, len - 1).join('/')}`, { recursive: true })
            if (!createdDir) writeContent(asset, file, pack)
              .then(() => {})
              .catch(err => console.log(err))
          } else {
            writeContent(asset, file, pack)
              .then(() => {})
              .catch(err => console.log(err))
          }
        })
      }
    }
  })
}

function writeContent (asset, file, pack) {
  return new Promise((resolve, reject) => {
    request(`${STATIC_FILE_DIR}/${pack}/${asset.version}/${file}`, (err, response, body) => {
      if (body === undefined || body.search('<center><h1>503 Service Temporarily Unavailable</h1></center>') !== -1) {
        writeContent(asset, file, pack)
        return
      }
      fs.writeFile(`${LOCALE_FILE_DIR}/${pack}/${asset.version}/${file}`, body, (err) => {
        if (!err) resolve(true)
        else reject()
      })
    })
  })
}

packs.forEach(pack => getPackData(pack))
setTimeout(() => packs.forEach(pack => getPackData(pack)), 7 * 24 * 60 * 60 * 1000)