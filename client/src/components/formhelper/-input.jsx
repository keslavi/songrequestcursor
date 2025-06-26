import { isEmpty } from "lodash";

import { Checkbox } from "./checkbox";
import { Datepicker } from "./datepicker";
import { SelectMulti } from "./select-multi";
import { Select } from "./select";
import { Radio } from "./radio";
import { SelectAutocomplete } from "./select-autocomplete";
import { SelectAutocompleteFreesolo } from "./select-autocomplete-freesolo";
import { SelectCheckbox } from "./select-checkbox";
import { Textarea } from "./textarea";
import { TextField } from "./text-field";
import { Password } from "./password";

/**
 * @property {react-hook Form Input} multitype Input control (default TextField)
 *
 * - label="Text for label" (optional)
 *
 * add properties for different controls:
 *  - datepicker
 *  - options= {[value:"",text:""]} autocomplete
 *  - select options={} select
 *  - optionsMulti={} multi-select
 *  - allowFreeText options=[] autocomplete that allows free text
 *  * - xs={4} number of columns (optionsl, default 4)
 *  @param control required for react-hook-form
 *  @param name required
 *  @param value normally not needed, react-hook-form will fill this
 *  @param options returns autocomplete
 *  @param optionsMulti returns multiselect
 *  @param optionsRadio returns as radio buttons
 *  @param optionsCheckbox string[] returns as radio buttons
 *  @param datepicker returns date control
 *  @param checkbox returns checkbox control
 *  @param textarea returns textarea
 *  @param xs={4} number of columns (optional, default 4)
 *  @returns {wrapped Form Input inside Col}
 */

export const Input = (props) => {
  const {
    checkbox,
    datepicker,
    datetimepicker,
    options,
    optionsMulti,
    optionsRadio,
    optionscheckbox,
    select,
    textarea,
    password,
    allowFreeText,
  } = props;

  const Ctl = datepicker || datetimepicker
    ? Datepicker
    : checkbox
    ? Checkbox
    : !isEmpty(options)
    ? allowFreeText
      ? SelectAutocompleteFreesolo
      : select
        ? Select
        : SelectAutocomplete
    : !isEmpty(optionsMulti)
    ? SelectMulti
    : !isEmpty(optionsRadio)
    ? Radio 
    : optionscheckbox
    ? SelectCheckbox
    : textarea
    ? Textarea
    : password
    ? Password
    : TextField;

  //const Ctl = TextField;
  return <Ctl {...props} />;
};
