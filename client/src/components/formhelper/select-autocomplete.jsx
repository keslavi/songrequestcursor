import { useMemo } from "react";
import { useFormField } from "./form-provider";

import {
  Box,
  TextField as MuiTextField,
  Autocomplete as MuiAutocomplete,
} from "@mui/material";

import { cleanParentProps, colProps } from "./helper";
import { Info } from "./info";

import { ColPadded } from "@/components/grid";
import { KeyboardArrowDown } from "@mui/icons-material";

export const SelectAutocomplete = (props) => {
  const placeholder = (e) => {
    return;
  };

  const onBlur = props.onBlur || placeholder;
  const onChange = props.onChange || placeholder;
  const unbound = props.unbound === "true" ? true : false;

  // Use common hook for both patterns
  const { field, error } = useFormField(props);

  let valueProp = {};
  if (!props.defaultvalue) {
    if (!unbound) {
      valueProp = {
        value: field.value || null,
      };
    }
  }

  const options = useMemo(() => props.options || [], [props.options]);

  return (
    <ColPadded {...colProps(props)}>
      <Box sx={{ position: 'relative' }}>
        <MuiAutocomplete
          id={field.name}
          name={field.name}
          options={options}
          getOptionLabel={(option) => option.text || option.label || ""}
          isOptionEqualToValue={(option, value) => option.key === value?.key || option.value === value?.value}
          onBlur={(e) => {
            field.onBlur(e.target.value);
            onBlur(e);
          }}
          onChange={(event, newValue) => {
            field.onChange(newValue);
            onChange(event);
          }}
          {...valueProp}
          {...cleanParentProps(props)}
          renderInput={(params) => {
            return (
              <Box sx={{ position: 'relative' }}>
                <MuiTextField
                  {...params}
                  label={props.label}
                  error={!!error}
                  helperText={error?.message}
                />
                {props.info && <Info id={`${field.id}Info`} info={props.info} />}
              </Box>
            );
          }}
        />
      </Box>
    </ColPadded>
  );
};