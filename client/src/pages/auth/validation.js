import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";

export * from '@/helpers/form-validation/errorNotification';

const schemaLogin = yup.object().shape({
  phoneNumber: yup
    .string()
    .required("Phone number is required")
    .test("phone-basic", "Enter a valid phone number", (v) => {
      if (!v) return false;
      const digits = String(v).replace(/[^\d]/g, "");
      return digits.length >= 10 && digits.length <= 15;
    }),
});

export const resolverLogin = yupResolver(schemaLogin);

const trimOrNull = (value) => {
  if (typeof value !== 'string') return value ?? null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const schemaRegister = yup.object().shape({
  username: yup
    .string()
    .transform(trimOrNull)
    .required('Username is required'),
  email: yup
    .string()
    .transform(trimOrNull)
    .email('Enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters long'),
  confirmPassword: yup
    .string()
    .required('Confirm your password')
    .oneOf([yup.ref('password'), null], 'Passwords must match'),
  stageName: yup
    .string()
    .transform(trimOrNull)
    .required('Stage / Entertainer Name is required'),
  venmoHandle: yup
    .string()
    .transform(trimOrNull)
    .required('Venmo handle is required'),
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
    .transform(trimOrNull)
    .nullable()
    .email('Enter a valid email address'),
  contactPhone: yup
    .string()
    .transform((value) => {
      if (value === undefined || value === null) return null;
      const trimmed = value.trim();
      return trimmed.length ? trimmed : null;
    })
    .nullable()
    .test('contact-phone', 'Enter a valid phone number', (value) => {
      if (!value) return true;
      const digits = value.replace(/[^0-9]/g, '');
      return digits.length >= 10 && digits.length <= 15;
    }),
  headshotUrl: yup
    .string()
    .transform(trimOrNull)
    .nullable()
    .url('Enter a valid URL'),
  description: yup
    .string()
    .transform(trimOrNull)
    .nullable()
    .max(1000, 'Description must be 1000 characters or less'),
});
export const resolverRegister = yupResolver(schemaRegister);

export const errorNotification = (errors) => {
  if (errors) {
    const errorMessages = Object.values(errors).map(error => error.message);
    toast.error(errorMessages.join('\n'));
  }
}; 