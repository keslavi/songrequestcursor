import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from 'react-toastify';
import { useEffect } from 'react';

export const useFormValidation = (validationSchema, defaultValues = {}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
    control
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues,
    mode: 'onBlur'
  });

  const onSubmit = (submitHandler) => {
    return handleSubmit(async (data) => {
      try {
        await submitHandler(data);
        reset();
        toast.success('Success!');
      } catch (error) {
        toast.error(error.response?.data?.message || 'An error occurred');
        console.error('Form submission error:', error);
      }
    });
  };

  // Show validation errors as toasts when they occur
  useEffect(() => {
    const errorMessages = Object.entries(errors).map(([field, error]) => {
      if (typeof error === 'object' && error.message) {
        return error.message;
      }
      return `${field}: Invalid value`;
    });

    if (errorMessages.length > 0) {
      toast.error(errorMessages.join('\n'));
    }
  }, [errors]);

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
    handleSubmit: onSubmit,
    formState: { errors, isSubmitting },
    hasError,
    getErrorMessage,
    getFieldProps,
    setValue,
    watch,
    control,
    reset
  };
}; 