const express = require('express');
const path = require('path');
const config = require('config');
const router = express.Router();

const StorageController = require('@controllers/storage');

router.use('/',
    express.static(path.join(config.get('RESOURCES_DIRECTORY'), 'media'))
);

module.exports = router;
