require('dotenv').config()
const express = require('express');
const router = express.Router();
const userModel = require('../models/userModel.js')
const videoModel = require('../models/videoModel.js')
const commentModel = require('../models/commentModel.js')
const playlistModel = require('../models/playlistModel.js')
const uploadVid = require('./multer')
const uploadImg = require('./multer2.js')
const GoogleStrategy = require('passport-google-oidc');
const passport = require('passport')
const fs = require('fs')
const axios = require('axios');
// const utilsController = require('../controllers/utils_controller.js');
const { timeSpanFromNow, getLatestContent, getAllContent,subscribe } = require('../utils/utils.js');
const { categorizeVideos } = require('../utils/shortsDate.js');
const { populate } = require('dotenv');
const path = require('path');







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
  const allContent = await getAllContent()
  const allContentWithTime = allContent.map(video => ({ ...video.toObject(), timespan: timeSpanFromNow(video.createdDate) }))
  res.render('index.ejs', { leftSection: true, loggedUser: req.user, shuffledVideos: allContentWithTime });
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


// ---------- video routes --------------------------------

// opening one video
router.get('/video/:videoid', async function (req, res, next) {
  let loggedUser = req.user
  let isLogged = false
  const video = await videoModel.findById(req.params.videoid).populate('user')
    .populate({ path: 'comments',populate: 'user replies',})
 
  const videoUrl = `https://${HOSTNAME}/${STORAGE_ZONE_NAME}/${video.videoName}?accessKey=${STREAM_KEY}`
  if (loggedUser) {
    isLogged = true
    loggedUser = await userModel.findOne({ username: req.user.username })

    if (video.views.indexOf(loggedUser._id) === -1) {
      video.views.push(loggedUser._id)
      await video.save()
    }
    const alreadyWatchedIndex = loggedUser.watchedVideo.findIndex(item => item.video.equals(video._id));
    if (alreadyWatchedIndex !== -1) {
      loggedUser.watchedVideo.splice(alreadyWatchedIndex, 1);
    }
    loggedUser.watchedVideo.push({ video: video._id });
    await loggedUser.save();
  }

  const videos = await videoModel.find({ _id: { $ne: req.params.videoid } });


  res.render('viewVideo.ejs', { leftSection: false, loggedUser, video, videoUrl,isLogged,videos });

});

// finding all videos
router.post('/video/all', async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.session.passport.user.username })
  const videos = await videoModel.find({ user: loggedUser._id })
  res.status(200).json(videos)
});

// uploading video to cloud
router.post('/video/upload', uploadVid.single('video'), async function (req, res, next) {
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

// updating video details
router.post('/video/details/:videoId', uploadImg.single('thumbnail'), async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.user.username });
  const video = await videoModel.findOneAndUpdate(
    { _id: req.params.videoId },
    { description: req.body.description, visibility: req.body.visibility, title: req.body.title },
    { new: true }
  )
  if (req.file) {
    video.thumbnail = req.file.filename
    await video.save()
  }
  res.redirect('/studio')
})

// deleting the video
router.get('/video/delete/:videoId', async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.user.username });
  const video = await videoModel.findOneAndDelete({ _id: req.params.videoId })
  fs.readdir('./public/uploads', { withFileTypes: true }, (err, files) => {
    fs.unlink('./public/uploads/images/' + video.thumbnail, (err) => {
    })
  })
  res.redirect('/studio')
})

// liking the video
router.post('/video/like/:videoId', async function (req, res, next) {
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

router.post('/video/dislike/:videoId', async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.user.username })
  const video = await videoModel.findOne({ _id: req.params.videoId })
  if (video.dislikes.indexOf(loggedUser._id) === -1) {
    video.dislikes.push(loggedUser._id)
    if (!(video.likes.indexOf(loggedUser._id) === -1)) {
      video.likes.splice(video.likes.indexOf(loggedUser._id), 1)
      loggedUser.likedVideo.splice(loggedUser.likedVideo.indexOf(video._id), 1)
    }
  } else {
    video.dislikes.splice(video.dislikes.indexOf(loggedUser._id), 1)
  }
  await loggedUser.save()
  await video.save()
  res.status(200).json(video.likes.length)
})

// adding to watchlater
router.post('/video/watchlater/:videoId', async function (req, res, next) {
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

// commenting video
router.post('/video/comment/:videoId', async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.user.username })
  const video = await videoModel.findOne({ _id: req.params.videoId })
  const comment = await new commentModel({
    comment: req.body.comment,
    user: loggedUser._id,
  }).populate('user')
  await comment.save()
  video.comments.push(comment._id)
  await video.save()
  res.status(200).json(comment)
})

// ---------- relpy comment routes ---------------------------

// reply comment
router.post('/reply/comment/:commentId', async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.user.username })
  let comment = await commentModel.findOne({ _id: req.params.commentId })
  const reply = await commentModel.create({
    comment: req.body.comment,
    user: loggedUser._id,

  })
  if (comment.level == 0) {
    reply.level = 1
  } else if (comment.level == 1) {
    reply.level = comment._id
  } else {
    comment = await commentModel.findOne({ _id: comment.level })
    reply.level = comment._id
  }

  reply.save()
  comment.replies.push(reply._id)
  await comment.save()
  res.status(200).json(reply)
})

// showing comment's all replies
router.post('/reply/showall', async function (req, res, next) {
  const comment = await commentModel.findOne({ _id: req.body.commentId }).populate('replies')
  res.status(200).json(comment.replies)
})



// ---------- history routes --------------------------------

router.get('/history', async function (req, res, next) {
  let loggedUser,allHistory
  if(req.user){

    loggedUser = await userModel.findOne({ username: req.session.passport.user.username })
      .populate('watchedVideo')
      .populate({ path: 'watchedVideo', populate: 'video' })
  
    allHistory = await categorizeVideos(loggedUser.watchedVideo);
  }

  res.render('history.ejs', { leftSection: true, loggedUser, allHistory });
});


router.get('/watchlater', async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.session.passport.user.username })
    .populate('watchLater')
    // .populate({path:'watchLater',populate:'video'})
  res.render('watchlater.ejs', { leftSection: true, loggedUser });
});
router.post('/history/remove/:videoId', async function (req, res, next) {
  try {
    const loggedUser = await userModel.findOne({ username: req.session.passport.user.username });
    const videoToRemoveIndex = loggedUser.watchedVideo.findIndex(entry => entry.video.toString() === req.params.videoId);
    
    if (videoToRemoveIndex !== -1) {
      loggedUser.watchedVideo.splice(videoToRemoveIndex, 1);
      await loggedUser.save();
      res.status(200).json('Video removed from history successfully.');
    } else {
      res.status(404).json('Video not found in history.');
    }
  } catch (error) {
    res.status(500).json('Internal server error.');
  }
});
router.post('/history/clearall', async function (req, res, next) {
  const loggedUser = await userModel.findOneAndUpdate({ username: req.session.passport.user.username }, { $set: { watchedVideo: [] } })
  res.status(200).json('watch history cleared successfully.');
});


// ----------- playlist routes --------------------------------

// rendering playlist page
router.get('/playlist/:playlistId', async function (req, res, next) {
  const playlist = await playlistModel.findOne({ _id: req.params.playlistId })
    .populate('user videos')
  res.render('playlist.ejs', { leftSection: true, loggedUser: req.user, playlist });
});

// creating playlist
router.post('/playlist/create', async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.session.passport.user.username })
  const videoIds = req.body['video[]']
  const video = await videoModel.findOne({_id: videoIds[0]})
  const newPlaylist = new playlistModel({
    user: loggedUser._id,
    title: req.body.title,
    description: req.body.description,
    videos: videoIds.map(videoId => videoId),
    thumbnail:video.thumbnail,
    visibility: req.body.visibility
  })
  await newPlaylist.save()
  res.redirect('back')
});


router.post('/showall/:type', async function (req, res, next) {
  if (req.params.type === 'content') {
    const mergedAndSorted = await getLatestContent(req.body.userId)
    res.status(200).json(mergedAndSorted)
  } else if (req.params.type === 'playlist') {
    const playlists = await playlistModel.find({ user: req.body.userId })
    .populate('user')
    res.status(200).json(playlists)
  } else {
    const videos = await videoModel.find({ user: req.body.userId, type: req.params.type })
    .populate('user')
    res.status(200).json(videos)
  }

})


// ----------- subscribe routes --------------------------------

// subscribing channel
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

// showing all subscribtions
router.get('/subscriptions', async function (req, res, next) {
  let loggedUser,videos
  if(req.user){
    loggedUser = await userModel.findOne({ username: req.session.passport.user.username });
    videos = await subscribe(loggedUser.subscriptions)
    videos = videos.map(video=>({...video.toObject(),timespan:timeSpanFromNow(video.createdDate)}))
  }
  res.render('subscriptions.ejs', { loggedUser, leftSection: true,videos });
});

// ----------- other rendering routes --------------------------------
router.get('/results', function (req, res, next) {
  res.render('results.ejs', { leftSection: true, loggedUser: req.user });
});
router.get('/shorts', async function (req, res, next) {

  let loggedUser
  let isLogged = false
  if(req.user){
    loggedUser = await userModel.findOne({ username: req.session.passport.user.username });
    isLogged=true
  }
  const shorts = await videoModel.find({ type: 'short' })
  const shortUrl = `https://${HOSTNAME}/${STORAGE_ZONE_NAME}/${shorts[0].videoName}?accessKey=${STREAM_KEY}`
  
  res.render('shorts.ejs', { leftSection: true, shorts, loggedUser, short: shorts[0], index: 1, shortUrl,isLogged });
});
router.get('/shorts/:index', async function (req, res, next) {
  let loggedUser
  let isLogged = false
  if(req.user){
    loggedUser = await userModel.findOne({ username: req.session.passport.user.username });
    isLogged=true
  }
  const shorts = await videoModel.find({ type: 'short' })
  let index;
  if (shorts.length - 1 === Number(req.params.index)) {
    index = Number(req.params.index);
  } else {
    index = Number(req.params.index) + 1;
  }
  const shortUrl = `https://${HOSTNAME}/${STORAGE_ZONE_NAME}/${shorts[index].videoName}?accessKey=${STREAM_KEY}`
  res.render('shorts.ejs', { leftSection: true, shorts, loggedUser, short: shorts[index], index, shortUrl,isLogged });
});
router.get('/you', async function (req, res, next) {
  let loggedUser = req.user
  if (loggedUser) {
    loggedUser = await userModel.findOne({ username: req.session.passport.user.username })
      .populate('watchedVideo', 'likedVideo', 'watchLater')
      .populate({ path: 'likedVideo', populate: 'user' })
      .populate({ path: 'watchLater', populate: 'user' })
      .populate({ path: 'watchedVideo', populate: { path: 'video', populate: 'user' } })
  }

  res.render('you.ejs', { leftSection: true, loggedUser });
});
router.get('/channel/:userId', async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.user.username })
  const user = await userModel.findOne({ _id: req.params.userId })
  const allUserContent = await getLatestContent(user._id)
  const allUserContentWithTime = allUserContent.map(video => ({ ...video.toObject(), timespan: timeSpanFromNow(video.createdDate) }))
  res.render('profile.ejs', { leftSection: true, loggedUser, user, videos: allUserContentWithTime });
});

router.get('/studio', async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.user.username });
  const mergedAndSorted = await getLatestContent(loggedUser._id)
  res.render('studio.ejs', { leftSection: true, loggedUser, mergedAndSorted });
});

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









module.exports = router;
