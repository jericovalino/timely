const objectToFormData = (
  obj: Record<string, any>,
  form = new FormData(),
  namespace = "",
) => {
  for (const key in obj) {
    if (!obj.hasOwnProperty(key) || obj[key] === undefined || obj[key] === null)
      continue;

    const formKey = namespace ? `${namespace}[${key}]` : key;
    const value = obj[key];

    if (value instanceof Date) {
      form.append(formKey, value.toISOString());
    } else if (value instanceof File || value instanceof Blob) {
      form.append(formKey, value);
    } else if (typeof value === "object" && !(value instanceof File)) {
      objectToFormData(value, form, formKey);
    } else {
      form.append(formKey, value);
    }
  }

  return form;
};

export default objectToFormData;
