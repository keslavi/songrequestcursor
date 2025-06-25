import { TextField as MuiTextField } from "@mui/material";
import { cleanParentProps, colProps } from "./helper";

import { useController } from "./form-provider";

import { ColPadded } from "components/grid";
import dayjs from "dayjs";
import { isEmpty } from "lodash";

export const Datepicker = (props) => {
  const placeholder = (e) => {
    return;
  };
  const onChange = props.onChange || placeholder;

  const {field,fieldState:{error}}=useController(props);

  // Determine if this is a datetime picker or date picker
  const isDateTime = props.datetimepicker || false;
  const inputType = isDateTime ? "datetime-local" : "date";
  const format = isDateTime ? "YYYY-MM-DDTHH:mm" : "YYYY-MM-DD";

  const attributes = { inputProps: {} };
  if (!isEmpty(props.min)){
    attributes.inputProps.min = dayjs(props.min).format(format);
  }
  if (!isEmpty(props.max)){
    attributes.inputProps.max = dayjs(props.max).format(format);
  }

  return (
    <ColPadded {...colProps(props)}>
      <MuiTextField
        {...cleanParentProps(props)}
        type={inputType}
        id={field.name}
        label={props.label}
        inputRef={field.ref}
        onBlur={field.onBlur}
        onChange={(e)=>{field.onChange(e.target.value);onChange(e);}}
        value={field.value || ''} //avoid uncontrolled ref error
        {...attributes} //note.. NOT <Input {...attributes} /> :)
        fullWidth
        {...{error: !!error || undefined, helperText: error?.message}}
      />
    </ColPadded>
  )

};
