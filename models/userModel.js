const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/youtubeclone')

const userSchema = mongoose.Schema({
  username: String,
  profileImg: {
    type: String,
    default:'def.jpg'
  },
  channelBg: String,
  email: String,
  channel:String,
  createdDate: {
    type: Date,
    default: Date.now
  },
  watchedVideo: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'video'
    }
  ],
  watchLater: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'video'
    }
  ],
  likedVideo: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'video'
    }
  ],
  subscribers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    }
  ],
  subscriptions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    }
  ]


})

module.exports = mongoose.model('user', userSchema)