import { isEqual } from "lodash";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  UseFormWatch,
  UseFormSetError,
  UseFormGetValues,
  UseFormClearErrors,
} from "react-geek-form";
import type { AxiosError } from "axios";

export type FormErrorResponse = {
  error: string;
  message: string;
  error_description: string;
  errors: {
    [x: string]: string[];
  };
};

export type Config<TFieldValues extends Record<string, any> = any> = {
  watch: UseFormWatch<TFieldValues>;
  setError: UseFormSetError<TFieldValues>;
  getValues: UseFormGetValues<TFieldValues>;
  clearErrors: UseFormClearErrors<TFieldValues>;
};

type OnError = (err: AxiosError<FormErrorResponse>) => void;

type ReturnA = {
  onError: OnError;
};

type ReturnB = {
  onError: OnError;
  setConfig: (config: Config) => void;
};

function use422FormErrorSetter(props: Config): ReturnA;
function use422FormErrorSetter(): ReturnB;
function use422FormErrorSetter(props?: unknown) {
  const [inlineConfig, setInlineConfig] = useState<Config | null>(null);
  const [errors422obj, setError422obj] = useState<Record<string, any>>({});

  const propsRef = useRef<Config | null>(null);

  useEffect(() => {
    configRef.current =
      (propsRef.current as Config) ?? (inlineConfig as Config);
  }, [inlineConfig]);
  const configRef = useRef<Config | null>(null);

  const setConfig = useCallback(
    (config: Config) => {
      setInlineConfig(config);
    },
    [setInlineConfig],
  );

  useEffect(() => {
    propsRef.current = props as Config;
  }, [props]);

  const prevErrorFieldsValuesRef = useRef<Record<string, any>>({});
  const watchErrorFieldsValuesStrinyfy = JSON.stringify(
    configRef.current?.watch(Object.keys(errors422obj)),
  );

  // This is an object of all field with errors from the API, and it's form value
  const errorFieldsValues = useMemo(() => {
    const values: Record<string, any> = {};
    let watchErrorFieldsValues: Record<string, any> = {};
    try {
      watchErrorFieldsValues = JSON.parse(watchErrorFieldsValuesStrinyfy);
    } catch {
      // Do nothing
    }
    Object.keys(errors422obj).forEach((key, i) => {
      values[key] =
        watchErrorFieldsValues?.[i] ?? configRef.current?.getValues(key);
    });
    return values;
  }, [errors422obj, watchErrorFieldsValuesStrinyfy]);

  const onError = useCallback(
    (err: AxiosError<FormErrorResponse>) => {
      if (!configRef.current) {
        return console.error(
          "Config is undefined. Pass config when initializing the hook or pass it using setConfig.",
        );
      }
      if (err?.response?.status === 422) {
        setError422obj(err?.response?.data?.errors || {});
      }
    },
    [setError422obj],
  );

  // This useEffect sets the field errors from the API
  useEffect(() => {
    Object.keys(errors422obj).forEach((key) => {
      configRef.current?.setError(key, { message: errors422obj[key][0] });
    });
  }, [errors422obj]);

  // This useEffect removes the field errors from the API on field change
  useEffect(() => {
    if (isEqual(prevErrorFieldsValuesRef.current, errorFieldsValues)) return;
    const removeErrorFieldNames: string[] = [];
    Object.keys(prevErrorFieldsValuesRef.current).forEach((key) => {
      if (
        !isEqual(
          prevErrorFieldsValuesRef?.current?.[key],
          errorFieldsValues?.[key],
        )
      ) {
        removeErrorFieldNames.push(key);
      }
    });
    configRef.current?.clearErrors(removeErrorFieldNames);
    prevErrorFieldsValuesRef.current = errorFieldsValues;
  }, [errorFieldsValues]);

  return { onError, setConfig };
}

export default use422FormErrorSetter;
