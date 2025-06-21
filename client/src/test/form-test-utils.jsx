import React from 'react';
import { render } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { FormProvider } from '../components/formhelper/form-provider';

/**
 * Test utility for rendering form components with proper context
 * This follows React testing best practices and provides isolation
 */
export const renderWithFormProvider = (Component, formOptions = {}) => {
  const TestWrapper = ({ children, ...props }) => {
    const methods = useForm({
      defaultValues: formOptions.defaultValues || {},
      resolver: formOptions.resolver,
      ...formOptions
    });

    return (
      <FormProvider {...methods}>
        {React.cloneElement(children, { ...props, ...methods })}
      </FormProvider>
    );
  };

  return render(
    <TestWrapper>
      {Component}
    </TestWrapper>
  );
};

/**
 * Simple form wrapper for testing individual form components
 */
export const FormTestWrapper = ({ children, defaultValues = {}, resolver }) => {
  const methods = useForm({
    defaultValues,
    resolver
  });

  return (
    <FormProvider {...methods}>
      {children}
    </FormProvider>
  );
}; 