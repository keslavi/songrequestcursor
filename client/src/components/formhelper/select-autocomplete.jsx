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

  const options = useMemo(() => props.options || [], [props.options]);

  const getOptionKey = (opt) => opt?.key ?? opt?.value ?? null;

  // RHF stores the selected key (string), but MUI Autocomplete expects the full option object.
  const selectedOption = useMemo(() => {
    if (props.defaultvalue || unbound) return undefined;

    const v = field.value;
    if (!v) return null;

    // Backward-compat: if old code stored the full object, honor it.
    if (typeof v === "object") return v;

    return options.find((o) => String(getOptionKey(o)) === String(v)) || null;
  }, [field.value, options, props.defaultvalue, unbound]);

  return (
    <ColPadded {...colProps(props)}>
      <Box sx={{ position: 'relative' }}>
        <MuiAutocomplete
          id={field.name}
          name={field.name}
          options={options}
          getOptionLabel={(option) => option.text || option.label || ""}
          isOptionEqualToValue={(option, value) => String(getOptionKey(option)) === String(getOptionKey(value))}
          onBlur={(e) => {
            field.onBlur(e.target.value);
            onBlur(e);
          }}
          onChange={(event, newValue) => {
            // Save only the key into RHF, not the whole object.
            const key = getOptionKey(newValue);
            field.onChange(key ?? null);
            onChange(event);
          }}
          {...(!props.defaultvalue && !unbound && { value: selectedOption })}
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