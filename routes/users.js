const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/youtubeclone')

const userSchema = mongoose.Schema({
  username: String,
  email: String,
  uploadedVideo:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:'video'
    }
  ],
  watchedVideo:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:'video'
    }
  ],
  likedVideo:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:'video'
    }
  ],
  subscribers:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:'user'
    }
  ],
  subscribed:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:'user'
    }
  ]
  

})

module.exports = mongoose.model('user',userSchema)