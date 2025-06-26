import { createContext, useContext, useMemo, useEffect, useRef } from "react";
import { useForm, useController as useRealController } from "react-hook-form";
import { errorNotification } from "@/helpers/form-validation/errorNotification";

const FormContext = createContext();

// Global registry to store form methods
const formMethodsRegistry = new Map();

// Re-export useRealController for components that need it directly
export { useRealController };

// Enhanced hook with validation support
export const useFormProvider = (options = {}) => {
  try {
    const formMethods = useForm({
      // Default values
      defaultValues: options.defaultValues || {},
      // Validation resolver (Yup, Zod, etc.)
      resolver: options.resolver,
      // All other useForm() options
      ...options,
    });
    
    // Register the form methods with a unique ID
    const formId = useRef(Math.random().toString(36).substr(2, 9)).current;
    formMethodsRegistry.set(formId, formMethods);
    
    // Add cleanup function to remove from registry when component unmounts
    useEffect(() => {
      return () => {
        formMethodsRegistry.delete(formId);
      };
    }, [formId]);
    
    // Add the formId to the formMethods for later retrieval
    formMethods._formId = formId;
    
    return formMethods;
  } catch (error) {
    console.error('Error in useFormProvider:', error);
    throw error;
  }
};

export const FormProvider = ({ 
  children, 
  onSubmit, 
  formProps = {}, 
  formOptions = {},
  formMethods: externalFormMethods,
  ...rest 
}) => {
  // Use external form methods if provided, otherwise create new ones
  const frmMethods = externalFormMethods || useForm({
    defaultValues: formOptions.defaultValues || {},
    resolver: formOptions.resolver,
    ...formOptions,
  });

  const { control, formState, reset, register, handleSubmit, watch, setValue, getValues } = frmMethods;
  const errors = formState?.errors || {};

  // Handle error notifications automatically
  useEffect(() => {
    if (errors && Object.keys(errors).length > 0) {
      errorNotification(errors);
    }
  }, [errors]);

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
      formMethods: frmMethods,
    }),
    [control, errors, reset, register, handleSubmit, watch, setValue, getValues, frmMethods]
  );

  return (
    <FormContext.Provider value={value}>
      <form onSubmit={handleSubmit(onSubmit)} {...formProps}>
        {children}
      </form>
    </FormContext.Provider>
  );
};

export const useController = (props) => {
  const ctx = useContext(FormContext);
  
  // If no context is available, throw a helpful error
  if (!ctx) {
    throw new Error("useController must be used within a FormProvider");
  }
  
  const control = props.control || ctx.control;
  const errors = props.errors || ctx.errors;

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

// Common hook for all input controls to handle both patterns
export const useFormField = (props) => {
  let field, error;

  try {
    if (props.control && props.errors) {
      // Direct props pattern (task-old.jsx style)
      const result = useRealController({ control: props.control, name: props.name });
      field = result.field;
      error = result.fieldState.error;
    } else {
      // Context pattern (task.jsx style)
      const result = useController(props);
      field = result.field;
      error = result.fieldState.error;
    }
  } catch (err) {
    // Fallback: try context if direct fails
    const result = useController(props);
    field = result.field;
    error = result.fieldState.error;
  }

  return { field, error };
};
