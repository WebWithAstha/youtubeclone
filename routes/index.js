const express = require('express');
const router = express.Router();
const userModel = require('./users')
const videoModel = require('./video')
const playlistModel = require('./playlist')
const uploadVid = require('./multer')
const uploadImg = require('./multer2')
const GoogleStrategy = require('passport-google-oidc');
const passport = require('passport')
const env = require('dotenv');
const fs = require('fs')
env.config()

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
  })
  return cb(null, newUser)

}));




/* GET home page. */
router.get('/', async function (req, res, next) {
  // const loggedUser = await userModel.findOne({ email: req.user.email });

  const allVideos = await videoModel.find().populate('user')

  function shuffle(array) {
    for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
  }
  const shuffledVideos = shuffle(allVideos)



  res.render('index.ejs', {leftSection:true, loggedUser:req.user,shuffledVideos });
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
  const video = await videoModel.findById(req.params.videoid).populate('user');
  res.render('viewVideo.ejs', {leftSection:false, loggedUser: req.user,video });
});
router.get('/history', function (req, res, next) {
  res.render('history.ejs', {leftSection:true, loggedUser: req.user });
});
router.get('/results', function (req, res, next) {
  res.render('results.ejs', {leftSection:true, loggedUser: req.user });
});
router.get('/shorts', function (req, res, next) {
  res.render('shorts.ejs', {leftSection:true, loggedUser: req.user });
});
router.get('/you', function (req, res, next) {
  res.render('you.ejs', {leftSection:true, loggedUser: req.user });
});
router.get('/channel', function (req, res, next) {
  res.render('profile.ejs', {leftSection:true, loggedUser: req.user });
});
router.get('/playlist/:some', function (req, res, next) {
  res.render('playlist.ejs', {leftSection:true, loggedUser: req.user });
});
router.get('/studio', async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.user.username });
  const videos = await videoModel.find({ user: loggedUser._id })
  res.render('studio.ejs', {leftSection:true, loggedUser, videos });
});


// uploading video route

router.post('/upload/video', uploadVid.single('video'), async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.user.username });
  const newVideo = await videoModel.create({
    user: loggedUser._id,
    type:req.body.type,
    title: req.file.originalname.split('.')[0],
    videoName: req.file.filename
  })
  res.status(200).json(newVideo)

})
router.post('/upload/thumbnail/:videoId', uploadImg.single('thumbnail'), async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.user.username });
  const video = await videoModel.findOne(
    { _id: req.params.videoId }
  )
  video.thumbnail = req.file.filename
  await video.save()
  res.status(200).json(video)

})
router.post('/upload/details/:videoId', async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.user.username });
  const video = await videoModel.findOneAndUpdate(
    { _id: req.params.videoId },
    {description:req.body.description,visibility:req.body.visibility,title:req.body.title ,tags:req.body.tags.split(',')},
    {new:true}
    )
  res.redirect('/studio')
})



// deleting the video

router.get('/delete/video/:videoId', async function (req, res, next) {
  const loggedUser = await userModel.findOne({ username: req.user.username });
  const video = await videoModel.findOneAndDelete({_id:req.params.videoId})

  fs.readdir('./public/uploads',{withFileTypes:true},(err,files)=>{
    fs.unlink('./public/uploads/videos/'+video.videoName,(err)=>{
    })
    fs.unlink('./public/uploads/images/'+video.thumbnail,(err)=>{
    })
  })


  res.redirect('/studio')




})








module.exports = router;
