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
  const allowFreeText = props.allowFreeText || false;

  // Use common hook for both patterns
  const { field, error } = useFormField(props);

  const getOptionKey = (opt) => opt?.key ?? opt?.value ?? null;

  // RHF stores an array of keys (strings), but MUI Autocomplete expects an array of option objects.
  const selectedKeys = useMemo(() => {
    if (!Array.isArray(field.value)) return [];
    return field.value
      .map((v) => (typeof v === "object" ? getOptionKey(v) : v))
      .filter((v) => v !== null && v !== undefined)
      .map((v) => String(v));
  }, [field.value]);

  const selectedOptions = useMemo(() => {
    const opts = props.optionsMulti || [];
    if (!selectedKeys.length) return [];
    
    // Map selected keys to option objects or strings (for freeSolo custom tags)
    return selectedKeys.map(key => {
      const found = opts.find(opt => String(getOptionKey(opt)) === key);
      // If found in options, return the option object
      if (found) return found;
      // If allowFreeText and not found, return the key as a string (custom tag)
      if (allowFreeText) return key;
      return null;
    }).filter(Boolean);
  }, [props.optionsMulti, selectedKeys, allowFreeText]);

  //  Filter out already selected options from dropdown
  const filteredOptions = useMemo(() => {
    const opts = props.optionsMulti || [];
    if (!selectedKeys.length) return opts;
    return opts.filter((option) => !selectedKeys.includes(String(getOptionKey(option))));
  }, [props.optionsMulti, selectedKeys]);

  return (
    <ColPadded {...colProps(props)}>
      <Box sx={{ position: 'relative' }}>
        <Autocomplete
          multiple
          freeSolo={allowFreeText}
          id={field.name}
          options={filteredOptions}
          getOptionLabel={(option) => {
            // Handle string values (custom tags from freeSolo)
            if (typeof option === 'string') return option;
            return option.text || option.label || "";
          }}
          isOptionEqualToValue={(option, value) => {
            if (typeof option === 'string' && typeof value === 'string') return option === value;
            return String(getOptionKey(option)) === String(getOptionKey(value));
          }}
          onBlur={(e) => {
            field.onBlur(e.target.value);
            onBlur(e);
          }}
          onChange={(event, newValue) => {
            // Save keys/strings into RHF
            const keys = Array.isArray(newValue)
              ? newValue
                  .map((v) => {
                    // If it's a string (custom tag), keep it as-is
                    if (typeof v === 'string') return v;
                    // Otherwise get the key from the option object
                    return getOptionKey(v);
                  })
                  .filter((v) => v !== null && v !== undefined)
                  .map((v) => String(v))
              : [];

            field.onChange(keys);
            onChange(event, newValue);
          }}
          {...(!props.defaultvalue && !unbound && { value: selectedOptions })}
          {...cleanParentProps(props)}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const label = typeof option === 'string' ? option : (option.text || option.label);
              return (
                <Chip
                  key={typeof option === 'string' ? option : getOptionKey(option)}
                  label={label}
                  {...getTagProps({ index })}
                />
              );
            })
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