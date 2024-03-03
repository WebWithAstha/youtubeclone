var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/history', function(req, res, next) {
  res.render('history', { title: 'Express' });
});
router.get('/results', function(req, res, next) {
  res.render('results', { title: 'Express' });
});
router.get('/shorts', function(req, res, next) {
  res.render('shorts', { title: 'Express' });
});

router.get('/you', function(req, res, next) {
  res.render('you', { title: 'Express' });
});

module.exports = router;
