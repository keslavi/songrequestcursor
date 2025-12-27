import {
  yup,
  yupResolver,
} from '@/helpers/form-validation';

const transformToNullable = (value) => {
  if (typeof value !== 'string') return value ?? null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const schemaProfile = yup.object().shape({
  stageName: yup.string().required('Stage / entertainer name is required'),
  venmoHandle: yup.string().required('Venmo handle is required'),
  venmoConfirmDigits: yup
    .string()
    .transform((value) => {
      if (value === undefined || value === null) return null;
      const digits = String(value).replace(/[^0-9]/g, '');
      return digits.length ? digits : null;
    })
    .nullable()
    .test('venmo-digits', 'Enter the last 4 digits (optional)', (value) => {
      if (!value) return true;
      return value.length === 4;
    }),
  contactEmail: yup
    .string()
    .transform(transformToNullable)
    .nullable()
    .email('Enter a valid email address'),
  contactPhone: yup
    .string()
    .transform((value) => {
      if (value === undefined || value === null) return null;
      const trimmed = value.trim();
      if (!trimmed) return null;
      return trimmed;
    })
    .nullable()
    .test('contact-phone', 'Enter a valid phone number', (value) => {
      if (!value) return true;
      const digits = value.replace(/[^0-9]/g, '');
      return digits.length >= 10 && digits.length <= 15;
    }),
  description: yup
    .string()
    .transform(transformToNullable)
    .nullable()
    .max(1000, 'Description must be 1000 characters or less'),
  headshotUrl: yup
    .string()
    .transform(transformToNullable)
    .nullable()
    .url('Enter a valid URL'),
});

export const resolverProfile = yupResolver(schemaProfile);
