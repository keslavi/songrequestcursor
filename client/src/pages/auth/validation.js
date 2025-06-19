import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";

export * from '@/helpers/form-validation/errorNotification';

const schemaLogin = yup.object().shape({
  // username: yup.string().required("Username is required"),
  // email: yup.string().email("Invalid email").required("Email is required"),
  // password: yup.string()
  //   .required("Password is required")
  //   .min(8, "Password must be at least 8 characters"),
  // confirmPassword: yup.string()
  //   .oneOf([yup.ref('password'), null], 'Passwords must match')
  //   .required("Confirm password is required"),
  // firstName: yup.string(),
  // lastName: yup.string(),
  // phone: yup.string(),
  // zipCode: yup.string(),
  // comments: yup.string()
});

export const resolverLogin = yupResolver(schemaLogin);

const schemaRegister = yup.object().shape({});
export const resolverRegister = yupResolver(schemaRegister);

export const errorNotification = (errors) => {
  if (errors) {
    const errorMessages = Object.values(errors).map(error => error.message);
    toast.error(errorMessages.join('\n'));
  }
}; 