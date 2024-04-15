require('dotenv').config()
const express = require('express');
const router = express.Router();
const userModel = require('./users')
const videoModel = require('./video')
const commentModel = require('./comments')
const playlistModel = require('./playlist')
const uploadVid = require('./multer')
const uploadImg = require('./multer2.js')
const GoogleStrategy = require('passport-google-oidc');
const passport = require('passport')
const fs = require('fs')
const axios = require('axios');
const comments = require('./comments');

const utilsController = require('../controllers/utils_controller.js')













const HOSTNAME = process.env.HOSTNAME;
const STORAGE_ZONE_NAME = process.env.STORAGE_ZONE_NAME;
const ACCESS_KEY = process.env.UPLOAD_KEY;
const STREAM_KEY = process.env.STREAM_KEY;


passport.use(new GoogleStrategy({
  clientID: process.env['GOOGLE_CLIENT_ID'],
  clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
  callbackURL: '/oauth2/redirect/google',
  scope: ['profile', 'email']
}, async function verify(issuer, profile, cb) {
  const user = await userModel.findOne({ email: profile.emails[0].value })
  if (user) {
    return cb(null, user)
  }
  const newUser = await userModel.create({
    username: profile.displayName,
    email: profile.emails[0].value,
    channel: '@' + profile.emails[0].value.split('@')[0]
  })
  return cb(null, newUser)

}));




/* GET home page. */
router.get('/', async function (req, res, next) {
  const allVideos = await videoModel.find().populate('user')
  const updatedVideos = allVideos.map(video=>({...video.toObject(),timespan:utilsController.timeSpanFromNow(video.uploadDate)}))
  function shuffle(array) {
    for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
  }
  const shuffledVideos = shuffle(updatedVideos)



  res.render('index.ejs', { leftSection: true, loggedUser: req.user, shuffledVideos });
});
router.get('/login/federated/google', passport.authenticate('google'));

router.get('/oauth2/redirect/google', passport.authenticate('google', {
  successRedirect: '/',
  failureRedirect: '/results'
}));
router.get('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

// ejs page rendering routes



router.get('/video/:videoid', async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.user.username })
  const video = await videoModel.findById(req.params.videoid).populate('user')
    .populate({
      path: 'comments',
      populate: {
        path: 'user',
      },
      populate: {
        path: 'replies',
        populate: {
          path: 'user',
        },
        populate: {
          path: 'replies',
        }
      }
    })

  if(video.views.indexOf(loggedUser._id)===-1){
    video.views.push(loggedUser._id)
    await video.save()
  }
  console.log(video)

   
  const videoUrl = `https://${HOSTNAME}/${STORAGE_ZONE_NAME}/${video.videoName}?accessKey=${STREAM_KEY}`
  res.render('viewVideo.ejs', { leftSection: false, loggedUser, video, videoUrl });
});
router.get('/history', function (req, res, next) {
  res.render('history.ejs', { leftSection: true, loggedUser: req.user });
});
router.get('/results', function (req, res, next) {
  res.render('results.ejs', { leftSection: true, loggedUser: req.user });
});
router.get('/shorts', function (req, res, next) {
  res.render('shorts.ejs', { leftSection: true, loggedUser: req.user });
});
router.get('/you', function (req, res, next) {
  res.render('you.ejs', { leftSection: true, loggedUser: req.user });
});
router.get('/channel/:userId', async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.user.username })
  const user = await userModel.findOne({ _id: req.params.userId })
  const videos = await videoModel.find({user:req.params.userId})
  res.render('profile.ejs', { leftSection: true, loggedUser, user,videos });
});
router.get('/playlist/:some', function (req, res, next) {
  res.render('playlist.ejs', { leftSection: true, loggedUser: req.user });
});
router.get('/studio', async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.user.username });
  const videos = await videoModel.find({ user: loggedUser._id })
  res.render('studio.ejs', { leftSection: true, loggedUser, videos });
});

router.get('/subscriptions', async function (req, res, next) {
  res.render('subscriptions.ejs', { leftSection: true, loggedUser: req.user });
});


// uploading video route



const uploadFileToBunnyCDN = (filePath, fileName) => {
  return new Promise(async (resolve, reject) => {
    const readStream = fs.createReadStream(filePath);

    try {
      const response = await axios.put(`https://${HOSTNAME}/${STORAGE_ZONE_NAME}/${fileName}`, fs.createReadStream(filePath), {
        headers: {
          AccessKey: ACCESS_KEY,
          'Content-Type': 'application/octet-stream',
        },
      });

      resolve(response.data);
    } catch (error) {
      reject(error);
    }
  });
};




router.post('/upload/video', uploadVid.single('video'), async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.user.username });
  const response = await uploadFileToBunnyCDN(`./public/uploads/videos/${req.file.filename}`, req.file.filename)
  const newVideo = await videoModel.create({
    user: loggedUser._id,
    type: req.body.type,
    title: req.file.originalname.split('.')[0],
    videoName: req.file.filename
  })

  fs.unlinkSync(`./public/uploads/videos/${req.file.filename}`)
  res.status(200).json(newVideo)

})

router.post('/upload/details/:videoId',uploadImg.single('thumbnail'), async function (req, res, next) {
  console.log('route hit')
  const loggedUser = await userModel.findOne({ username: req.user.username });
  console.log(req.file)
  const video = await videoModel.findOneAndUpdate(
    { _id: req.params.videoId },
    { description: req.body.description, visibility: req.body.visibility, title: req.body.title,thumbnail: req.file.filename},
    { new: true }
  )
  res.redirect('/studio')
})



// deleting the video
router.get('/delete/video/:videoId', async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.user.username });
  const video = await videoModel.findOneAndDelete({ _id: req.params.videoId })
  fs.readdir('./public/uploads', { withFileTypes: true }, (err, files) => {
    fs.unlink('./public/uploads/videos/' + video.videoName, (err) => {
    })
    fs.unlink('./public/uploads/images/' + video.thumbnail, (err) => {
    })
  })


  res.redirect('/studio')




})

// liking the video
router.post('/like/video/:videoId', async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.user.username })
  const video = await videoModel.findOne({ _id: req.params.videoId })
  if (video.likes.indexOf(loggedUser._id) === -1) {
    video.likes.push(loggedUser._id)
    loggedUser.likedVideo.push(video._id)
    if (video.dislikes.indexOf(loggedUser._id) !== -1) {
      video.dislikes.splice(video.dislikes.indexOf(loggedUser._id), 1)
    }
  } else {
    video.likes.splice(video.likes.indexOf(loggedUser._id), 1)
    loggedUser.likedVideo.splice(loggedUser.likedVideo.indexOf(video._id), 1)
  }
  await video.save()
  await loggedUser.save()
  res.status(200).json(video.likes.length)
})

// disliking the video
router.post('/dislike/video/:videoId', async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.user.username })
  const video = await videoModel.findOne({ _id: req.params.videoId })
  if (video.dislikes.indexOf(loggedUser._id) === -1) {
    video.dislikes.push(loggedUser._id)
    if (video.likes.indexOf(loggedUser._id) !== -1) {
      video.likes.splice(video.likes.indexOf(loggedUser._id), 1)
    }
  } else {
    video.dislikes.splice(video.dislikes.indexOf(loggedUser._id), 1)
  }
  await video.save()
  res.status(200).json(video.likes.length)
})

// subscibing user
router.post('/subscribe/user/:userId', async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.user.username })
  const user = await userModel.findOne({ _id: req.params.userId })
  if (user.subscribers.indexOf(loggedUser._id) === -1) {
    user.subscribers.push(loggedUser._id)
    loggedUser.subscriptions.push(user._id)
  } else {
    user.subscribers.splice(user.subscribers.indexOf(loggedUser._id), 1)
    loggedUser.subscriptions.splice(loggedUser.subscriptions.indexOf(user._id), 1)
  }
  await loggedUser.save()
  await user.save()
  res.status(200).json("subscribers managed.")

})

// adding to watchlater
router.post('/watchlater/video/:videoId', async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.user.username })
  const video = await videoModel.findOne({ _id: req.params.videoId })
  if (loggedUser.watchLater.indexOf(video._id) === -1) {
    loggedUser.watchLater.push(video._id)
  } else {
    loggedUser.watchLater.splice(loggedUser.watchLater.indexOf(video._id), 1)
  }
  await loggedUser.save()
  res.status(200).json("done")
})

// comment video

router.post('/comment/video/:videoId', async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.user.username })
  const video = await videoModel.findOne({ _id: req.params.videoId })
  const comment = await commentModel.create({
    comment: req.body.comment,
    user: loggedUser._id,
  })
  video.comments.push(comment._id)
  await video.save()
  res.status(200).json(comment)
})
// reply comment

router.post('/reply/comment/:commentId', async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.user.username })
  let comment = await commentModel.findOne({ _id: req.params.commentId })
  const reply = await commentModel.create({
    comment: req.body.comment,
    user: loggedUser._id,

  })
  if(comment.level ==0){
    reply.level = 1
    reply.save()
  }else if(comment.level==1){
    reply.level =comment._id
    reply.save()
  }else{
    comment = await commentModel.findOne({ _id: comment.level})
  }

  comment.replies.push(reply._id)
  await comment.save()
  res.status(200).json(reply)
})

router.post('/replies', async function (req, res, next) {
  const comment = await commentModel.findOne({ _id: req.body.commentId}).populate('replies')
  res.status(200).json(comment.replies)
})




module.exports = router;
