import { /* InputAdornment, */ TextField as MuiTextField } from "@mui/material";
import { cleanParentProps, colProps } from "./helper";
import { useController } from "./form-provider";
import { Info } from "./info";
import { ColPadded } from "@/components/grid";
//import { BootstrapTooltip } from "./infotooltip";
import { Help /*HelpOutline*/ as Help } from "@mui/icons-material";
import { color } from "@/theme-material";
import { use } from "react";

export const TextField = (props) => {
  const placeholder = (e) => {
    return;
  };
  const onBlur = props.onBlur || placeholder;
  const onChange = props.onChange || placeholder;
  const unbound = props.unbound === "true" ? true : false;

  const {field,fieldState:{error}}=useController(props);
  //fieldstate{error, invalid, isTouched, isDirty, }

  let valueProp = {};
  if (!props.defaultvalue) {
    if (!unbound) {
      valueProp = {
        value: field.value || "",
      };
    }
  }

  return (
    <ColPadded {...colProps(props)}>
      <MuiTextField
        fullWidth
        id={field.name}
        name={field.name}
        label={props.label}
        inputRef={field.ref}
        onBlur={(e) => {
          field.onBlur(e.target.value);
          onBlur(e);
        }}
        onChange={(e) => {
          field.onChange(e.target.value);
          onChange(e);
        }}
        {...valueProp}
        {...{ error: !!error || undefined, helperText: error?.message }}
        {...cleanParentProps(props)}
        slotProps={{
          input: props.InputProps
        }}
      />
      {props.info && <Info id={`${field.id}Info`} info={props.info} />}
      {/* {props.info &&  Info(`${field.id}Info`, props.info)}       */}
    </ColPadded>
  );
};
