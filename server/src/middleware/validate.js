import Joi from 'joi';

export const validateRequest = (schema) => {
  return async (ctx, next) => {
    try {
      console.log('Validating request body:', ctx.request.body);
      const { error } = schema.validate(ctx.request.body);
      if (error) {
        console.log('Validation error:', error.details);
        ctx.status = 400;
        ctx.body = {
          message: 'Validation error',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value
          }))
        };
        return;
      }
      console.log('Validation passed');
      await next();
    } catch (err) {
      console.error('Validation middleware error:', err);
      ctx.status = 500;
      ctx.body = {
        message: 'Internal server error during validation',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      };
    }
  };
};

// Common validation schemas
export const schemas = {
  user: {
    register: Joi.object({
      username: Joi.string().min(3).max(30).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
      profile: Joi.object({
        firstName: Joi.string(),
        lastName: Joi.string(),
        name: Joi.string()
      })
    }),
    login: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required()
    })
  },
  show: {
    create: Joi.object({
      name: Joi.string().required(),
      dateFrom: Joi.date().required(),
      dateTo: Joi.date().required(),
      location: Joi.string().required(),
      description: Joi.string().allow(''),
      status: Joi.string().valid('draft', 'published', 'cancelled').default('draft'),
  showType: Joi.string().valid('private', 'public').required(),
      additionalPerformers: Joi.array().items(Joi.string()).optional(),
      venue: Joi.object({
        name: Joi.string().allow(''),
        phone: Joi.string().allow(''),
        mapUrl: Joi.string().allow(''),
        address: Joi.object({
          street: Joi.string().allow(''),
          city: Joi.string().allow(''),
          state: Joi.string().allow(''),
          zip: Joi.string().allow('')
        }),
        location: Joi.object({
          coordinates: Joi.array().items(Joi.number()).length(2),
          mapsLink: Joi.string().allow(''),
          placeId: Joi.string().allow('')
        })
      }),
      settings: Joi.object({
        allowRequests: Joi.boolean(),
        maxRequestsPerUser: Joi.number().min(1).max(10),
        requestDeadline: Joi.date().allow(null)
      })
    }),
    update: Joi.object({
      name: Joi.string(),
      dateFrom: Joi.date(),
      dateTo: Joi.date(),
      location: Joi.string(),
      description: Joi.string().allow(''),
      status: Joi.string().valid('draft', 'published', 'cancelled'),
  showType: Joi.string().valid('private', 'public'),
      additionalPerformers: Joi.array().items(Joi.string()).optional(),
      venue: Joi.object({
        name: Joi.string().allow(''),
        phone: Joi.string().allow(''),
        mapUrl: Joi.string().allow(''),
        address: Joi.object({
          street: Joi.string().allow(''),
          city: Joi.string().allow(''),
          state: Joi.string().allow(''),
          zip: Joi.string().allow('')
        }),
        location: Joi.object({
          coordinates: Joi.array().items(Joi.number()).length(2),
          mapsLink: Joi.string().allow(''),
          placeId: Joi.string().allow('')
        })
      }),
      settings: Joi.object({
        allowRequests: Joi.boolean(),
        maxRequestsPerUser: Joi.number().min(1).max(10),
        requestDeadline: Joi.date().allow(null)
      })
    })
  }
}; 