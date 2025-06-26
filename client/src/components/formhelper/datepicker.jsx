import { TextField as MuiTextField, Box } from "@mui/material";
import { cleanParentProps, colProps } from "./helper";
import { useFormField } from "./form-provider";
import { Info } from "./info";
import { ColPadded } from "@/components/grid";
import dayjs from "dayjs";
import { isEmpty } from "lodash";

export const Datepicker = (props) => {
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
        value: field.value || "",
      };
    }
  }

  // Determine if this is a datetime picker or date picker
  const isDateTime = props.datetimepicker;
  const inputType = isDateTime ? "datetime-local" : "date";

  // Format the value for datetime-local input
  let formattedValue = field.value;
  if (isDateTime && field.value && !isEmpty(field.value)) {
    try {
      formattedValue = dayjs(field.value).format("YYYY-MM-DDTHH:mm");
    } catch (e) {
      console.warn("Invalid date format:", field.value);
      formattedValue = "";
    }
  } else if (!isDateTime && field.value && !isEmpty(field.value)) {
    try {
      formattedValue = dayjs(field.value).format("YYYY-MM-DD");
    } catch (e) {
      console.warn("Invalid date format:", field.value);
      formattedValue = "";
    }
  }

  const attributes = {
    ...cleanParentProps(props),
  };

  return (
    <ColPadded {...colProps(props)}>
      <Box sx={{ position: 'relative' }}>
        <MuiTextField
          fullWidth
          type={inputType}
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
          InputLabelProps={{
            shrink: true,
          }}
          {...attributes}
        />
        {props.info && <Info id={`${field.id}Info`} info={props.info} />}
      </Box>
    </ColPadded>
  );
};
