import {
  Checkbox as MuiCheckbox,
  FormControlLabel,
  Typography,
  FormHelperText,
  Box,
} from "@mui/material";

import { useFormField } from "./form-provider";

import { color } from "@/theme-material";
import { cleanParentProps, colProps } from "./helper";

import { ColPadded } from "@/components/grid";
import { isTruthy } from "helpers";
import { Info } from "./info";

export const Checkbox = (props) => {
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
        checked: field.value || false,
      };
    }
  }

  let label = props.label || "";
  switch (props.variant) {
    case "h1":
      label = (
        <Typography
          style={{
            fontSize: "1.2rem",
            fontWeight: "500",
            color: color.primary.blue,
          }}
        >
          {label}
        </Typography>
      );
      break;
    case "h2":
      label = (
        <Typography style={{ fontWeight: "400", color: color.primary.blue }}>
          {label}
        </Typography>
      );
      break;
    case "h3":
      label = (
        <Typography
          style={{
            fontSize: ".8rem",
            fontWeight: "300",
            color: color.primary.blue,
          }}
        >
          {label}
        </Typography>
      );
      break;
  }

  return (
    <ColPadded {...colProps(props)}>
      <Box sx={{ position: 'relative' }}>
        <FormControlLabel
          control={
            <MuiCheckbox
              id={field.name}
              name={field.name}
              inputRef={field.ref}
              onBlur={(e) => {
                field.onBlur(e.target.checked);
                onBlur(e);
              }}
              onChange={(e) => {
                field.onChange(e.target.checked);
                onChange(e);
              }}
              {...valueProp}
              {...{ error: !!error || undefined }}
              {...cleanParentProps(props)}
            />
          }
          label={label}
        />
        {props.info && <Info id={`${field.id}Info`} info={props.info} />}
      </Box>
      {error && (
        <FormHelperText className="mui-error">{error.message}</FormHelperText>
      )}
    </ColPadded>
  );
};
