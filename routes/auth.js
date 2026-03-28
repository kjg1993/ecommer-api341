const express = require('express');
const router = express.Router();
const passport = require('passport');


router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));


router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/'); 
  }
);

router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/');
  });
});

module.exports = router;