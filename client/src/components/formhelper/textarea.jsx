import { useController } from "./form-provider";
//const {field,fieldState:{error}}=useController(props);

import { 
  TextareaAutosize,
  InputLabel,
  FormHelperText, 
  Link,
} from "@mui/material";
import { cleanParentProps, colProps } from "./helper";
import { Info } from "./info";
import { ColPadded } from "components/grid";

export const Textarea = (props) => {
  const placeholder = (e) => {return};
  const onBluer = props.onBlur || placeholder;
  const onChange = props.onChange || placeholder;
  const unbound = props.unbound === "true" ? true : false;
  const { field, fieldState: { error } } = useController(props);

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
      <InputLabel htmlFor={field.name}>{props.label}</InputLabel>
      <TextareaAutosize
        style={{width: "100%"}}
        id={field.name}
        name={field.name}
        // minRows={3}
        // maxRows={6}
        ref={field.ref}
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
      />
      {props.info && <Info id={`${field.id}Info`} info={props.info} />}
      {props.helperText && <FormHelperText error>{error?.message}</FormHelperText>}
    </ColPadded>
  );

}
