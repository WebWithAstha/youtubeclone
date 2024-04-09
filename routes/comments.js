const mongoose = require('mongoose');

const commentSchema = mongoose.Schema({
    comment:String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
    },
    commentDate:{
        type: Date,
        default: Date.now
    },
    replies:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'comment'
        }
    ]

})

module.exports = mongoose.model('comment', commentSchema)