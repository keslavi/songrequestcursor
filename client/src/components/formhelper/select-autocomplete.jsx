import { useMemo } from "react";
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

export const SelectAutocomplete = (props) => {
  const placeholder = (e) => {
    return;
  };

  const onChange = props.onChange || placeholder;
  // const textPleaseSelect=props.textPleaseSelect || "Please Select";
  const options = useMemo(() => props.options || [], [props.options]);


  const {field,fieldState:{error}}=useController(props);
  return (
    <ColPadded {...colProps(props)}>
      <MuiAutocomplete
        id={field.name}
        name={field.name}
        options={options}
        getOptionLabel={(option) => option.text || ""}
        onChange={(event, newValue) => {
          field.onChange(newValue ? newValue.key : "");
          onChange(event, newValue);
        }}
        onBlur={field.onBlur}
        value={options.find(
          (option) => option.key == field.value || options[0]
        )} //avoid uncontrolled ref errors
        fullWidth
        popupIcon={<KeyboardArrowDown />}
        renderInput={(params) => {
          return (
            <Box xs={{position:'relative'}}>
              <MuiTextField
                {...params}
                label={props.label}
                {...{ error: !!error || undefined, helperText: error?.message }}
                //placeholder={textPleaseSelect}
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