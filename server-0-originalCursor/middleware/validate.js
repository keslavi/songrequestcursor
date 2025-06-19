import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

export const validateBody = (schema) => {
  const validate = ajv.compile({
    type: 'object',
    properties: schema,
    additionalProperties: false
  });

  return async (ctx, next) => {
    const valid = validate(ctx.request.body);
    
    if (!valid) {
      ctx.status = 400;
      ctx.body = {
        message: 'Validation failed',
        errors: validate.errors.map(error => ({
          field: error.instancePath.slice(1),
          message: error.message
        }))
      };
      return;
    }

    await next();
  };
};

export const validateQuery = (schema) => {
  const validate = ajv.compile({
    type: 'object',
    properties: schema,
    additionalProperties: false
  });

  return async (ctx, next) => {
    const valid = validate(ctx.query);
    
    if (!valid) {
      ctx.status = 400;
      ctx.body = {
        message: 'Validation failed',
        errors: validate.errors.map(error => ({
          field: error.instancePath.slice(1),
          message: error.message
        }))
      };
      return;
    }

    await next();
  };
}; 