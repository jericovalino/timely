import {
  useLocation,
  useSearchParams,
  type NavigateOptions,
  type URLSearchParamsInit,
} from 'react-router-dom';
import { useCallback, useMemo, useRef } from 'react';

const useNormalizedSearchParams = <T>(defaultSearchParams?: T) => {
  const location = useLocation();
  const initSearchParamsRef = useRef(defaultSearchParams);

  type NormalizedSearchParamsObject = T extends undefined
    ? Record<string, any>
    : { [K in keyof T]?: T[K] };
  const [, setSP] = useSearchParams(defaultSearchParams as URLSearchParamsInit);

  const searchParams = useMemo(() => {
    let value = {};
    try {
      const params = location.search.substring(1);
      value = JSON.parse(
        `{"${params.replace(/&/g, '","').replace(/=/g, '":"')}"}`,
        (key, value) => {
          return key === '' ? value : decodeURIComponent(value);
        }
      );
    } catch {
      // Do nothing
    }
    return { ...initSearchParamsRef.current, ...value };
  }, [location.search]) as NormalizedSearchParamsObject;

  const setSearchParams = useCallback(
    (
      nextSearchParams:
        | NormalizedSearchParamsObject
        | ((
            prev: NormalizedSearchParamsObject
          ) => NormalizedSearchParamsObject),
      navigateOpts?: NavigateOptions
    ) => {
      const value =
        typeof nextSearchParams === 'function'
          ? nextSearchParams(searchParams)
          : nextSearchParams;
      setSP(value, navigateOpts);
    },

    [setSP, searchParams]
  );

  return [searchParams, setSearchParams] as const;
};

export default useNormalizedSearchParams;
