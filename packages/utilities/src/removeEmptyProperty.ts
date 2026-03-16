import { isEmpty, omitBy } from "lodash";

const removeEmptyProperty = (obj: Record<any, any>) =>
  omitBy(obj, (x) => isEmpty(x) && typeof x !== "number");

export default removeEmptyProperty;
