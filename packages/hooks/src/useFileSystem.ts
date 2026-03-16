import { useCallback } from "react";

const useFileSystem = () => {
  type SelectImageFromFileSystemProps = {
    accept?: string;
    onFileSelected: (data: {
      file: File | Blob;
      src: string;
      name: string;
    }) => void;
  };
  const selectFileFromFileSystem = useCallback(
    ({ accept, onFileSelected }: SelectImageFromFileSystemProps) => {
      const inputFile = document.createElement("input");
      inputFile.setAttribute("type", "file");
      if (accept) {
        inputFile.setAttribute("accept", accept);
      }
      document.body.appendChild(inputFile);
      inputFile.onchange = (e) => {
        const { files: f } = e.target as HTMLInputElement;
        const files = Array.from(f as FileList);
        const selectedFile = files[0];
        if (!selectedFile) return;
        const selectedFileSrc = URL.createObjectURL(selectedFile);
        onFileSelected({
          file: selectedFile,
          src: selectedFileSrc,
          name: selectedFile.name,
        });
      };
      inputFile.click();
      document.body.removeChild(inputFile);
    },
    [],
  );

  return {
    selectFileFromFileSystem,
  };
};

export default useFileSystem;
