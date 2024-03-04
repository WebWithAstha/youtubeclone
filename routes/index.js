var express = require('express');
var router = express.Router();
const userModel = require('./users')


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index.ejs', { loggedUser: req.user});
});

router.get('/history', function(req, res, next) {
  res.render('history.ejs', { loggedUser: req.user});
});
router.get('/results', function(req, res, next) {
  res.render('results.ejs', { loggedUser: req.user});
});
router.get('/shorts', function(req, res, next) {
  res.render('shorts.ejs', { loggedUser: req.user});
});

router.get('/you', function(req, res, next) {
  res.render('you.ejs', { loggedUser: req.user});
});

module.exports = router;
