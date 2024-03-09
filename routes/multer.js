const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { default: mongoose } = require('mongoose');


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/uploads/videos')
    },
    filename: function (req, file, cb) {
      const fn = crypto.randomBytes(15).toString('hex')+path.extname(file.originalname)
      cb(null, fn)
    }
  })
  
  const upload = multer({ storage: storage })

  module.exports= upload



  
