import { createContext, useContext, useMemo } from "react";
import { useForm, useController as useRealController } from "react-hook-form";

const FormContext = createContext();

export const FormProvider = ({ children, ...methods }) => {
  // Debug logging
  // console.log('FormProvider received methods:', methods);
  
  // Handle both cases: when methods is the entire useForm result or individual props
  let control, formState, reset, register, handleSubmit, watch, setValue, getValues;
  
  // Check if methods is the entire useForm result (has formState property)
  if (methods.formState) {
    // This is the entire useForm result
    control = methods.control;
    formState = methods.formState;
    reset = methods.reset;
    register = methods.register;
    handleSubmit = methods.handleSubmit;
    watch = methods.watch;
    setValue = methods.setValue;
    getValues = methods.getValues;
  } else {
    // This is individual props
    control = methods.control;
    formState = methods.formState;
    reset = methods.reset;
    register = methods.register;
    handleSubmit = methods.handleSubmit;
    watch = methods.watch;
    setValue = methods.setValue;
    getValues = methods.getValues;
  }

  // Validate that we have the required methods
  if (!control) {
    console.error('FormProvider: control is missing from methods:', methods);
    throw new Error("FormProvider: 'control' is required but was not provided. Make sure you're passing the result of useFormProvider() or useForm() directly.");
  }

  // Safely extract errors from formState
  const errors = formState?.errors || {};

  // Memoized context value
  const value = useMemo(
    () => ({
      control,
      errors,
      reset,
      register,
      handleSubmit,
      watch,
      setValue,
      getValues,
      // Include original methods object for edge cases
      formMethods: methods,
    }),
    [control, errors, reset, register, handleSubmit, watch, setValue, getValues, methods]
  );

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
};

export const useController = (props) => {
  const ctx = useContext(FormContext);
  
  // If no context is available, throw a helpful error
  if (!ctx) {
    throw new Error("useController must be used within a FormProvider");
  }
  
  const control = props.control || ctx.control;
  const errors = props.errors || ctx.errors;

  // If control is still null/undefined, throw an error
  if (!control) {
    throw new Error("Form control is not available. Make sure FormProvider is properly configured.");
  }

  const controllerProps = useMemo(
    () => ({
      control,
      errors,
      name: props.name,
    }),
    [control, errors, props.name]
  );

  //argued with myself about not paring it down to field, error.
  const ret = useRealController({
    ...controllerProps,
  });

  return ret;
};

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) throw new Error("Missing FormProvider");
  return context;
};

// Enhanced hook with validation support
export const useFormProvider = (options = {}) => {
  // console.log('useFormProvider called with options:', options);
  
  try {
    const formMethods = useForm({
      // Default values
      defaultValues: options.defaultValues || {},
      // Validation resolver (Yup, Zod, etc.)
      resolver: options.resolver,
      // All other useForm() options
      ...options,
    });

    // Debug logging
    // console.log('useFormProvider result:', formMethods);
    // console.log('useFormProvider control:', formMethods.control);
    // console.log('useFormProvider formState:', formMethods.formState);
    
    return formMethods;
  } catch (error) {
    console.error('Error in useFormProvider:', error);
    throw error;
  }
};
