const express = require('express');
const morgan = require('morgan');
const body_parser = require('body-parser');
const config = require('config');
const fs = require('fs');
const path = require('path');
const fileUpload = require('express-fileupload');
const cors = require('cors');

const storageWriter = require('@routes/writer');
const storageReader = require('@routes/reader');

const app = express();
const http = require('http');
const server = http.createServer(app);

app.use(body_parser.json());
app.use(fileUpload());
app.use(cors());

app.use('/', (req, res, next) => {
    console.log('request: ', new Date(Date.now()));
    next();
})

app.use('/store', storageWriter);
app.use('/get', storageReader);

module.exports = server;
