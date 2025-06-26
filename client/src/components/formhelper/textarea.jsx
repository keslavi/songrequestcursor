import { TextField as MuiTextField, Box } from "@mui/material";
import { cleanParentProps, colProps } from "./helper";
import { useFormField } from "./form-provider";
import { Info } from "./info";
import { ColPadded } from "@/components/grid";

export const Textarea = (props) => {
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

  return (
    <ColPadded {...colProps(props)}>
      <Box sx={{ position: 'relative' }}>
        <MuiTextField
          fullWidth
          multiline
          rows={props.rows || 4}
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
        />
        {props.info && <Info id={`${field.id}Info`} info={props.info} />}
      </Box>
    </ColPadded>
  );
};
