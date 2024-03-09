const mongoose = require('mongoose');

const videoSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    videoName:String,
    description: String,
    thumbnail:String,
    views:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user'
    }],
    likes:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user'
    }],
    dislikes:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user'
    }],
    comments:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'comment'
    }],
    uploadDate:{
        type: Date,
        default: Date.now
    },
    duration:Number,
    type:{
        type:String,
        default:'video'
    },
    visibility:{
        type:String,
        default:'private'
    },
    tags:{
        type:Array,
        default:[]
    }
    


})

module.exports = mongoose.model('video', videoSchema)