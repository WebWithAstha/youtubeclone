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
    createdDate:{
        type: Date,
        default: Date.now
    },
    visibility:{
        type:String,
        default:'public'
    },
    tags:{
        type:Array,
        default:[]
    }
    


})

module.exports = mongoose.model('playlist', playlistSchema)