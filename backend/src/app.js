const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');
const { requestLogger } = require('./utils/logger.util');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : true,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
  app.use(requestLogger);
}

app.use('/api', routes);
app.get('/', (req, res) => res.redirect('/api'));

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
