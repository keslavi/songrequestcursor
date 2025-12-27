import { useMemo, useState } from "react";
import { useController } from "./form-provider";

import {
  Box,
  TextField as MuiTextField,
  Autocomplete as MuiAutocomplete,
} from "@mui/material";

import { cleanParentProps, colProps } from "./helper";
import { Info } from "./info";

import { ColPadded } from "@/components/grid";
import { KeyboardArrowDown } from "@mui/icons-material";

export const SelectAutocompleteFreesolo = (props) => {
  const [inputValue, setInputValue] = useState('');
  const onChange = props.onChange || (() => {});
  const onInputChange = props.onInputChange || (() => {});
  const options = useMemo(() => props.options || [], [props.options]);

  const {field, fieldState:{error}} = useController(props);

  const getOptionKey = (opt) => opt?.key ?? opt?.value ?? null;

  // Similar to SelectAutocomplete: store the key/string in RHF, but provide an object to MUI when needed.
  const selectedOption = useMemo(() => {
    const v = field.value;
    if (!v) return null;
    if (typeof v === 'object') return v;
    return options.find((o) => String(getOptionKey(o)) === String(v)) || null;
  }, [field.value, options]);

  return (
    <ColPadded {...colProps(props)}>
      <MuiAutocomplete
        id={field.name}
        name={field.name}
        options={options}
        freeSolo={true}
        getOptionLabel={(option) => {
          // Handle both string and object options
          if (typeof option === 'string') {
            return option;
          }
          return option.text || option.songname || "";
        }}
        onChange={(event, newValue) => {
          // Handle both selected option and free text input
          if (typeof newValue === 'string') {
            // Free text input
            field.onChange(newValue);
            onChange(event, { songname: newValue, isCustom: true });
          } else if (newValue) {
            // Selected from dropdown
            const key = getOptionKey(newValue);
            field.onChange(key ?? '');
            onChange(event, newValue);
          } else {
            // No value
            field.onChange('');
            onChange(event, null);
          }
        }}
        onInputChange={(event, newInputValue) => {
          console.log('MUI onInputChange:', newInputValue);
          setInputValue(newInputValue);
          // Call parent's onInputChange if provided (for dynamic autocomplete)
          if (onInputChange) {
            console.log('Calling parent onInputChange');
            onInputChange(event, newInputValue);
          }
        }}
        inputValue={inputValue}
        onBlur={field.onBlur}
        value={selectedOption || field.value || ''}
        fullWidth
        popupIcon={<KeyboardArrowDown />}
        renderInput={(params) => {
          return (
            <Box sx={{position:'relative'}}>
              <MuiTextField
                {...params}
                label={props.label}
                placeholder={props.placeholder}
                {...{ error: !!error || undefined, helperText: error?.message }}
              />
              {props.info && <Info id={`${field.id}Info`} info={props.info} />}
            </Box>
          );
        }}
        {...cleanParentProps(props)}
      />
    </ColPadded>
  );
}; 