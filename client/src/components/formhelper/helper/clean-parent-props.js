import { useMemo } from 'react';
//import { clone } from '@/helpers';

export const cleanParentProps = (props) => {
  return useMemo(() => {
    const ret = { ...props };
    const exclude = [
      'name',
      "id",
      "info",
      "xs",
      "sm",
      "md",
      "lg",
      "xl",
      "label",
      "options",
      "optionsRadio",
      "optionsMulti",
      "datepicker",
      "checkbox",
      "onChange",
      "onBlur",
      "min",
      "max",
      "size",
      "password",
    ];

    exclude.forEach(key => {
      if (ret[key]) {
        delete ret[key];
      }
    });

    if (props.label) {
      ret.placeholder = props.label;
    }

    return ret;
  }, [props]); // Only recalculate when props change
};