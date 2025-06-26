import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio as MuiRadio,
  RadioGroup,
  Box,
} from "@mui/material";
import { cleanParentProps, colProps } from "./helper";
import { useFormField } from "./form-provider";
import { Info } from "./info";
import { ColPadded } from "@/components/grid";

export const Radio = (props) => {
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
        <FormControl error={!!error}>
          <FormLabel component="legend">{props.label}</FormLabel>
          <RadioGroup
            id={field.name}
            name={field.name}
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
            {props.optionsRadio?.map((option) => (
              <FormControlLabel
                key={option.key || option.value}
                value={option.key || option.value}
                control={<MuiRadio />}
                label={option.text || option.label}
              />
            ))}
          </RadioGroup>
        </FormControl>
        {props.info && <Info id={`${field.id}Info`} info={props.info} />}
      </Box>
    </ColPadded>
  );
};
