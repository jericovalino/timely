import {
  useRef,
  useState,
  useCallback,
  type DragEvent,
  type ChangeEvent,
} from "react";
import {
  // RiDownloadLine,
  // RiDeleteBinLine,
  RiUploadCloudLine,
  RiExpandDiagonalLine,
  RiFile2Line,
} from "react-icons/ri";
import { AiOutlineLoading } from "react-icons/ai";
// import { IoChevronForwardSharp } from "react-icons/io5";
import {
  RxPlus,
  RxDragHandleDots2,
  // RxZoomIn, RxZoomOut
} from "react-icons/rx";
import { type AxiosInstance } from "axios";

import { cn } from "../../utilities";

import FieldWrapper, {
  type Props as FieldWrapperProps,
} from "../containers/FieldWrapper";
import useFileUpload from "../../../../hooks/src/useFileUpload";
import useGetFileType from "../../../../hooks/src/useGetFileType";

type MultipleUpload = {
  value: string[];
  allowMultiple?: true;
};

type SingleUpload = {
  value: string;
  allowMultiple?: false;
};

type DropzoneState = MultipleUpload | SingleUpload;

type DropzoneFieldProps = FieldWrapperProps & {
  onChange: (value: any) => void;
  api: AxiosInstance;
  imageOnly?: boolean;
  fileLimit?: number;
  className?: string;
  disabled?: boolean;
} & DropzoneState;

export default function DropzoneField({
  value,
  onChange,
  allowMultiple = false,
  fileLimit = 10,
  className,
  disabled = false,
  imageOnly = false,
  api,
  ...props
}: DropzoneFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, setImageIndex] = useState<number>(0);
  // const [zoomIndex, setZoomIndex] = useState<number>(3);
  const [isDragHover, setIsDragHover] = useState<boolean>(false);
  const { getFileType } = useGetFileType();
  const { uploadFile, isUploading } = useFileUpload(api);

  const updateFiles = useCallback(
    async (files: File[]) => {
      if (allowMultiple && Array.isArray(value)) {
        if (value.length + files.length > fileLimit) {
          return alert(`You can only upload a maximum of ${fileLimit} files.`);
        }
      } else {
        if (files.length > fileLimit) {
          return alert(`You can only upload a maximum of ${fileLimit} files.`);
        }
      }
      const uploadedFiles: string[] = [];
      try {
        const uploadPromises = files.map((file) =>
          uploadFile({
            fileName: file.name,
            file: file,
            onUploadDone: (data) => {
              if (data instanceof Error) return;
              uploadedFiles.push(data.signed_url);
            },
          })
        );
        await Promise.all(uploadPromises);
        const updatedFiles =
          allowMultiple && Array.isArray(value)
            ? [...value, ...uploadedFiles]
            : uploadedFiles[0];
        onChange(updatedFiles);
      } catch (error) {
        console.error("Error uploading files:", error);
      }
    },
    [allowMultiple, value, fileLimit, onChange, uploadFile]
  );

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      updateFiles(Array.from(e.target.files));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleOpenFiles = () => !disabled && fileInputRef.current?.click();

  const handleRemoveFile = useCallback(
    (index: number) => {
      if (allowMultiple && Array.isArray(value)) {
        const updatedImages = value.filter((_, i) => i !== index);
        onChange(updatedImages);
        setImageIndex((prevImageIndex) => {
          if (prevImageIndex === index) {
            if (index === updatedImages.length) {
              return updatedImages.length - 1;
            }
            if (index !== updatedImages.length) {
              return prevImageIndex;
            }
          }
          if (prevImageIndex > index) {
            return prevImageIndex - 1;
          }
          return prevImageIndex;
        });
        return;
      }
      return onChange("");
    },
    [value, onChange]
  );

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragHover(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragHover(false);
  };

  const handleDropFiles = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragHover(false);
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files);
      updateFiles(files);
    }
  };

  const renderImage = useCallback(
    (file: string, index: number) => {
      // const isImage = file.mime_type.toLowerCase().includes("image");
      const isImage = getFileType(file) === "image";
      return (
        <li
          key={index}
          className={cn(
            "gallery-item group cursor-move list-none rounded-md",
            index === 0 &&
              Array.isArray(value) &&
              value.length > 1 &&
              "col-span-2 row-span-2"
          )}
          draggable
        >
          <div
            className={cn(
              "relative h-[6.25rem] w-[8.208rem]",
              (index === 0 || (Array.isArray(value) && value.length === 1)) &&
                "h-[13.1rem] w-full"
            )}
          >
            <RxDragHandleDots2 className="absolute left-1 top-2 text-title text-icon-light opacity-0 group-hover:opacity-100" />
            <button
              type="button"
              className="absolute -right-1.5 -top-1.5 rounded-full border border-subtle bg-interface p-0.5 opacity-0 shadow transition-transform hover:scale-125 group-hover:opacity-100"
              onClick={() => handleRemoveFile(index)}
            >
              <RxPlus className="w-auto rotate-45 text-icon-subtle opacity-0 group-hover:opacity-100" />
            </button>
            <RiExpandDiagonalLine
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 transform cursor-pointer text-title text-icon-light opacity-0 transition-transform duration-300 hover:scale-125 group-hover:opacity-100"
              onClick={() => {
                // openLightBox();
                setImageIndex(index);
              }}
            />
            {isImage ? (
              <img
                src={file}
                alt={`file-${index}`}
                className="block h-full w-full rounded-md object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <RiFile2Line className="h-12 w-12 text-brand" />
              </div>
            )}
          </div>
        </li>
      );
    },
    [value, handleRemoveFile, setImageIndex]
  );
  return (
    <FieldWrapper {...props}>
      <div
        className={cn(
          "w-full rounded-mds-4 border bg-interface p-mds-8 shadow-none [&_section]:px-2",
          isDragHover &&
            "border-dashed border-icon-on-brand-subtle bg-brand-subtle",
          props.error && "border-danger-subtle bg-danger-subtle",
          disabled && "border-icon-disabled",
          className
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={allowMultiple}
          onChange={handleFileSelect}
          accept={
            imageOnly
              ? "image/*"
              : ".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xlsx,.ppt,.txt"
          }
          className="sr-only"
          disabled={disabled}
          name={props.name}
        />
        <div
          className={cn(
            "relative flex flex-col items-center justify-center",
            Array.isArray(value) && value.length > 0 && "h-52"
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDropFiles}
          onDragOver={(e) => e.preventDefault()}
        >
          {!value && (
            <button
              type="button"
              onClick={handleOpenFiles}
              className={cn(
                "flex h-[8.75rem] w-full flex-col items-center justify-center gap-0.5 text-on-brand-subtle",
                disabled && "cursor-default"
              )}
            >
              <RiUploadCloudLine
                size={24}
                className={cn(
                  "text-icon",
                  isDragHover && "text-inherit",
                  props.error && "text-on-danger-subtle",
                  disabled && "text-icon-disabled"
                )}
              />
              <div className="flex flex-row items-center gap-1">
                <p
                  className={cn(
                    "whitespace-nowrap text-body text-brand",
                    isDragHover && "text-brand",
                    props.error && "text-on-danger-subtle",
                    disabled && "text-disabled"
                  )}
                >
                  Upload a file
                </p>
                <p
                  className={cn(
                    "text-body text",
                    isDragHover && "text-brand",
                    props.error && "text-on-danger-subtle",
                    disabled && "text-disabled"
                  )}
                >
                  or drag and drop
                </p>
              </div>
              <p
                className={cn(
                  "text-caption text-subtle",
                  disabled && "text-icon-disabled"
                )}
              >
                {imageOnly
                  ? "Accepts images (.jpg, .png, and .gif)"
                  : "Accepts files"}
              </p>
            </button>
          )}
          {Array.isArray(value) && value.length > 0 && (
            <ul
              className={cn(
                "gallery m-0 grid h-[40.25rem] w-full grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-2.5 overflow-scroll p-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                allowMultiple && value.length <= 1 && "grid-cols-2",
                !allowMultiple && "grid-cols-1"
              )}
            >
              {allowMultiple &&
                Array.isArray(value) &&
                value.map((file, index) => renderImage(file, index))}
              {Array.isArray(value) ? null : renderImage(value, 0)}
              {Array.isArray(value) &&
                value.length < fileLimit &&
                allowMultiple && (
                  <li
                    className={cn(
                      "gallery-item group h-[6.25rem] w-[8.208rem] list-none rounded-md",
                      value.length === 1 && "h-[13.1rem] w-full",
                      value.length <= 1 && "col-span-1"
                    )}
                  >
                    <div
                      className={cn(
                        "relative h-[6.25rem] w-[8.208rem]",
                        value.length === 1 && "h-full w-full"
                      )}
                    >
                      <button
                        type="button"
                        onClick={handleOpenFiles}
                        className="flex h-full w-full items-center justify-center rounded-md border-2 border-dashed border-subtle bg-interface hover:bg-interface-hovered"
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <AiOutlineLoading className="animate-spin text-display text-icon-subtle" />
                        ) : (
                          <RxPlus className="w-auto text-display text-icon-subtle" />
                        )}
                      </button>
                    </div>
                  </li>
                )}
            </ul>
          )}
          {!Array.isArray(value) && value && renderImage(value, 0)}
        </div>
      </div>
    </FieldWrapper>
  );
}
