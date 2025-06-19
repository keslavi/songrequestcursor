import { TextField, Autocomplete, Checkbox } from "@mui/material";
import { cleanParentProps, colProps } from "./helper";
import { Info } from "./info";
import { useController } from "./form-provider";
import { ColPadded } from "@/components/grid";
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { useMemo } from "react";
import { useFormContext } from "./form-provider";

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

export const SelectCheckbox = (props) => {
  const {
    optionscheckbox: options,
    onBlur = () => {},
    onChange = () => {},
    unbound = props.unbound === "true",
    label,
    info,
    defaultvalue,
    ...restProps
  } = props;

  const {field,fieldState:{error}}=useController(props);

  const selectedOptions = useMemo(() => {
    return Array.isArray(field.value) 
      ? options.filter((opt) => field.value.includes(opt.key))
      : [];
  }, [field.value, options]);

  return (
    <ColPadded {...colProps(props)}>
      <Autocomplete
        id={field.name}
        multiple
        onBlur={(e) => {
          field.onBlur();
          onBlur(e);
        }}
        onChange={(e, newValue) => {
          const selectedValues = Array.isArray(newValue)
            ? newValue.map((item) => item.key)
            : [];
          field.onChange(selectedValues);
          onChange(selectedValues);
        }}
        options={options}
        disableCloseOnSelect
        getOptionLabel={(option) => option?.text || ""}
        isOptionEqualToValue={(option, value) => option?.key == value?.key}
        renderOption={(props, option, { selected }) => {
          // Destructure the key from props to use it separately
          const { key, ...rest } = props;
          return (
            <li key={key} {...rest}>
              <Checkbox
                icon={icon}
                checkedIcon={checkedIcon}
                style={{ marginRight: 8 }}
                checked={selected}
              />
              {option.text}
            </li>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            inputRef={field.ref}
            label={label}
            variant="outlined"
            error={Boolean(error)}
            helperText={error?.message || ""}
          />
        )}
        value={selectedOptions}
        {...cleanParentProps(restProps)}
      />
      {info && <Info id={`${field.id}Info`} info={info} />}
    </ColPadded>
  );
};