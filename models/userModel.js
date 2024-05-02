const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/youtubeclone')


const watchedVideoSchema = new mongoose.Schema({
  video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'video' // 'Video' ko aap apne actual model ka naam se replace karen
  },
  watchedAt: {
      type: Date,
      default: Date.now
  }
});



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
  watchedVideo: [watchedVideoSchema],
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