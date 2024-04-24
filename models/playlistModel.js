const mongoose = require('mongoose');

const playlistSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    videos:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'video'
    }],
    likes:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'user'
        }
    ],
    comments:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'comment'
        }
    ],
    visibility:{
        type:String,
        default:'public'
    },
    createdDate:{
        type: Date,
        default: Date.now
    },


})

module.exports = mongoose.model('playlist', playlistSchema)