const express = require('express');
const router = express.Router();

const passport = require('passport');
const passportConfig = require('@root/passport');

const StorageController = require('@controllers/storage');

router.post('/media',
    passport.authenticate('jwt-general', { session: false }),
    StorageController.uploadMedia
);

module.exports = router;
