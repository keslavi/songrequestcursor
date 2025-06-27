import { FormControl, InputLabel, Select as MuiSelect, MenuItem } from "@mui/material";
import { useMemo, useCallback } from "react";
import { cleanParentProps, colProps } from "./helper";
import { useFormField } from "./form-provider";
import { Info } from "./info";
import { ColPadded } from "@/components/grid";

export const Select = (props) => {
  // Handle both string and boolean values for unbound
  const unbound = props.unbound === true || props.unbound === "true";

  // Use common hook for both patterns
  const { field, error } = useFormField(props);

  // Memoize filtered options to avoid unnecessary recalculations
  const filteredOptions = useMemo(() => {
    return props.options?.filter(option => {
      const text = option.text || option.label || '';
      return !/please select/i.test(text);
    }) || [];
  }, [props.options]);

  // Ensure form events fire first, then custom events
  const onBlur = useCallback((e) => {
    field.onBlur(e.target.value);
    try {
      (props.onBlur || (() => {}))(e);
    } catch (error) {
      console.error('Error in custom onBlur handler:', error);
      // Re-throw to prevent silent failures
      throw error;
    }
  }, [field, props.onBlur]);

  const onChange = useCallback((e) => {
    field.onChange(e.target.value);
    try {
      (props.onChange || (() => {}))(e);
    } catch (error) {
      console.error('Error in custom onChange handler:', error);
      // Re-throw to prevent silent failures
      throw error;
    }
  }, [field, props.onChange]);

  // Optimize option rendering by pre-computing key/value
  const renderOptions = useMemo(() => {
    return filteredOptions.map((option) => {
      const optionValue = option.key || option.value;
      const optionText = option.text || option.label;
      
      return (
        <MenuItem key={optionValue} value={optionValue}>
          {optionText}
        </MenuItem>
      );
    });
  }, [filteredOptions]);

  return (
    <ColPadded {...colProps(props)}>
      {filteredOptions.length > 0 ? (
        <FormControl fullWidth error={!!error}>
          <InputLabel id={`${field.name}-label`}>{props.label}</InputLabel>
          <MuiSelect
            labelId={`${field.name}-label`}
            id={field.name}
            name={field.name}
            inputRef={field.ref}
            displayEmpty
            placeholder={props.placeholder || "Please Select"}
            onBlur={onBlur}
            onChange={onChange}
            aria-describedby={error ? `${field.name}-error` : undefined}
            aria-invalid={!!error}
            {...(!props.defaultvalue && !unbound && { value: field.value || null })}
            {...cleanParentProps(props)}
          >
            {renderOptions}
          </MuiSelect>
          {error && (
            <div id={`${field.name}-error`} role="alert" aria-live="polite">
              {error.message}
            </div>
          )}
        </FormControl>
      ) : (
        // Show placeholder when no options are available
        <div style={{ padding: '16px 0', color: '#666' }}>
          {props.loadingText || "No options available"}
        </div>
      )}
      {props.info && <Info id={`${field.id}Info`} info={props.info} />}
    </ColPadded>
  );
};
