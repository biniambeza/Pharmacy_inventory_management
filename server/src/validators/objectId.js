const Joi = require('joi');

const objectId = Joi.string().regex(/^[a-fA-F0-9]{24}$/).message('Invalid id');

module.exports = { objectId };
