const Joi = require('joi');

const mobilePattern = /^\+91[0-9]{10}$/;

const createRationCardSchema = Joi.object({
    card_number: Joi.string().required(),
    category: Joi.string().valid('APL', 'BPL', 'AAY').required(),
    shop_id: Joi.string().uuid().required(),
    head: Joi.object({
        name: Joi.string().min(2).required(),
        age: Joi.number().min(18).max(100).required(),
        mobile: Joi.string()
            .pattern(mobilePattern)
            .required()
            .messages({ 'string.pattern.base': 'Mobile must be in format +91XXXXXXXXXX' }),
    }).required(),
    members: Joi.array()
        .items(
            Joi.object({
                name: Joi.string().min(2).required(),
                age: Joi.number().min(0).max(120).required(),
            })
        )
        .default([]),
});

const createShopkeeperSchema = Joi.object({
    name: Joi.string().min(2).required(),
    email: Joi.string().email().required(),
    mobile: Joi.string()
        .pattern(mobilePattern)
        .required()
        .messages({ 'string.pattern.base': 'Mobile must be in format +91XXXXXXXXXX' }),
    password: Joi.string().min(6).required(),
    shop_id: Joi.string().uuid().required(),
});

module.exports = { createRationCardSchema, createShopkeeperSchema };
