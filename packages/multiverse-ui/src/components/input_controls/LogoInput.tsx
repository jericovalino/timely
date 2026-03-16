import { isEmpty } from "lodash";
import { HiPlus } from "react-icons/hi";
import { IoClose } from "react-icons/io5";
import { type AxiosInstance } from "axios";
import { type IconType } from "react-icons";
import { useCallback, useMemo } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

import { useFileSystem, useFileUpload, useImageEditor } from "@repo/hooks";

import { cn } from "../../utilities";

import FieldWrapper, {
  type Props as WrapperProps,
} from "../containers/FieldWrapper";
import Button from "./Button";

type Props = {
  name: string;
  testId?: string;
  icon?: IconType;
  value: string | { file_url_signed: string };
  label: string;
  error?: {
    message: string;
  };
  disabled?: boolean;
  readOnly?: boolean;
  maxLength?: number;
  placeholder?: string;
  optional?: boolean;
  errorDescription?: string;
  onChange: (value: any) => void;
  api: AxiosInstance;
} & WrapperProps;

function FormLogo({
  name,
  value,
  error,
  icon: Icon,
  disabled = false,
  readOnly = false,
  onChange,
  api,
  ...rest
}: Props) {
  const { selectFileFromFileSystem } = useFileSystem();
  const { openImageEditor } = useImageEditor();
  const { uploadFile, isUploading } = useFileUpload(api);

  const renderedIcon = useMemo(() => {
    if (!Icon)
      return (
        <HiPlus
          className={cn("h-6 w-6", error ? "text-red-500" : "text-gray-500")}
        />
      );
    return (
      <Icon
        className={cn("h-6 w-6", error ? "text-red-500" : "text-gray-500")}
      />
    );
  }, [Icon, error]);

  const selectAndUploadImage = useCallback(() => {
    selectFileFromFileSystem({
      accept: "image/*",
      onFileSelected: (data) => {
        openImageEditor({
          src: data.src,
          onEditDone: ({ srcFile }) => {
            uploadFile({
              fileName: `${name}.png`,
              file: srcFile,
              onUploadDone: (data) => {
                if (data instanceof Error) return;
                onChange(data?.signed_url);
              },
            });
          },
        });
      },
    });
  }, []);

  return (
    <FieldWrapper name={name} error={error} readOnly={readOnly} {...rest}>
      <div
        className={cn(
          "relative h-[7rem] w-[7rem] overflow-hidden rounded border bg-white",
          error
            ? "border-danger-subtle bg-danger-subtle text-on-danger-subtle"
            : "focus:border-selected",
        )}
      >
        {isUploading ? (
          <div className="absolute inset-0 grid h-full w-full place-items-center bg-gray-50">
            <AiOutlineLoading3Quarters className="h-4 w-4 animate-spin text-gray-500" />
          </div>
        ) : (
          <>
            {isEmpty(value) ? (
              <>
                <button
                  className="absolute inset-0 grid h-full w-full place-items-center hover:bg-gray-50"
                  type="button"
                  onClick={selectAndUploadImage}
                  disabled={isUploading || disabled}
                >
                  {renderedIcon}
                </button>
              </>
            ) : (
              <div className="relative h-full w-full p-1">
                <Button
                  variant="icon"
                  size="sm"
                  icon={IoClose}
                  className={cn(
                    "absolute right-0 top-0",
                    disabled ? "hidden" : "",
                  )}
                  onClick={() => onChange("")}
                />
                <img
                  src={
                    typeof value === "string" ? value : value?.file_url_signed
                  }
                  className="h-full w-full border object-contain"
                />
              </div>
            )}
          </>
        )}
      </div>
      {!readOnly && (
        <Button
          size="sm"
          className="w-[7rem]"
          disabled={isUploading || disabled}
          onClick={selectAndUploadImage}
          intent={error ? "danger" : "primary"}
          variant="ghost"
        >
          {value ? "Change" : "Upload"}
        </Button>
      )}
    </FieldWrapper>
  );
}

export default FormLogo;
