import { useMemo } from "react";
import { Autocomplete, TextField as MuiTextField, Box, Chip } from "@mui/material";
import { cleanParentProps, colProps } from "./helper";
import { useFormField } from "./form-provider";
import { Info } from "./info";
import { ColPadded } from "@/components/grid";
// import { Help } from "@mui/icons-material";
// import { color } from "@/theme-material";

export const SelectMulti = (props) => {
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
        value: field.value || [],
      };
    }
  }

  const selectedOptions = useMemo(() => {
    return Array.isArray(field.value)
      ? props.optionsMulti.filter((opt) => field.value.includes(opt.key))
      : [];
  }, [field.value, props.optionsMulti]);

  //  Filter out already selected options from dropdown
  const filteredOptions = useMemo(() => {
    const keys = field.value ? field.value.map(val => val.key) : [];
    
    return props.optionsMulti.filter(option => 
      !keys.includes(option.key)
    );
  }, [field.value, props.optionsMulti]);

  return (
    <ColPadded {...colProps(props)}>
      <Box sx={{ position: 'relative' }}>
        <Autocomplete
          multiple
          id={field.name}
          options={filteredOptions}
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
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                label={option.text || option.label}
                {...getTagProps({ index })}
              />
            ))
          }
          renderInput={(params) => (
            <MuiTextField
              {...params}
              label={props.label}
              error={!!error}
              helperText={error?.message}
            />
          )}
        />
        {props.info && <Info id={`${field.id}Info`} info={props.info} />}
      </Box>
    </ColPadded>
  );
};