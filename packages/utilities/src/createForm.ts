import { createInstance } from "react-geek-form";

import {
  CheckBox,
  TextInput,
  SelectInput,
  LogoInput,
  PasswordInput,
  DatePicker,
  TextArea,
  NumberInput,
  MaskInput,
  RadioGroup,
  CheckBoxGroup,
  DropzoneField,
  Switch,
  YearPicker,
  PinInput,
  QuantityInput,
  TimeInput,
} from "@repo/multiverse-ui";

const { createForm } = createInstance({
  CheckBox,
  LogoInput,
  TextInput,
  SelectInput,
  PasswordInput,
  DatePicker,
  TextArea,
  NumberInput,
  MaskInput,
  RadioGroup,
  CheckBoxGroup,
  DropzoneField,
  Switch,
  YearPicker,
  PinInput,
  QuantityInput,
  TimeInput,
});

export default createForm;
