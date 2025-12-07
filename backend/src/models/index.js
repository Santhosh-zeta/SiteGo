/**
 * Models Index
 * Export all models
 */

const User = require('./user.model');
const Site = require('./site.model');
const Attendance = require('./attendance.model');

module.exports = {
  User,
  Site,
  Attendance
};
