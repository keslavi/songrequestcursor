import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

export const useFormValidation = (validationSchema, defaultValues = {}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
    control,
    trigger
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues,
    mode: 'onBlur'
  });

  // Helper function to check if a field has an error
  const hasError = (fieldName) => {
    return !!errors[fieldName];
  };

  // Helper function to get error message
  const getErrorMessage = (fieldName) => {
    return errors[fieldName]?.message || '';
  };

  // Helper function to get field props
  const getFieldProps = (fieldName) => ({
    ...register(fieldName),
    error: hasError(fieldName),
    helperText: getErrorMessage(fieldName)
  });

  return {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    hasError,
    getErrorMessage,
    getFieldProps,
    setValue,
    watch,
    control,
    reset,
    trigger
  };
}; 