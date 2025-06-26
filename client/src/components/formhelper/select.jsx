import { FormControl, InputLabel, Select as MuiSelect, MenuItem, Box } from "@mui/material";
import { cleanParentProps, colProps } from "./helper";
import { useFormField } from "./form-provider";
import { Info } from "./info";
import { ColPadded } from "@/components/grid";

export const Select = (props) => {
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
        <FormControl fullWidth error={!!error}>
          <InputLabel id={`${field.name}-label`}>{props.label}</InputLabel>
          <MuiSelect
            labelId={`${field.name}-label`}
            id={field.name}
            name={field.name}
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
            {...cleanParentProps(props)}
          >
            {props.options?.map((option) => (
              <MenuItem key={option.key || option.value} value={option.key || option.value}>
                {option.text || option.label}
              </MenuItem>
            ))}
          </MuiSelect>
        </FormControl>
        {props.info && <Info id={`${field.id}Info`} info={props.info} />}
      </Box>
    </ColPadded>
  );
};
