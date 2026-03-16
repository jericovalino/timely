import { useCallback } from "react";
import { GiSquare } from "react-icons/gi";
import FilerobotImageEditor, { TABS } from "react-filerobot-image-editor";

import { Modal, useCreateOverlay } from "@repo/multiverse-ui";

type ImageEditorModalProps = {
  src: string;
  onEditDone: (data: { srcFile: Blob; srcUrl: string }) => void;
  onClose: () => void;
};

export const ImageEditorModal = ({
  src,
  onEditDone,
  onClose,
}: ImageEditorModalProps) => {
  return (
    <Modal title="Editor" size="2xl" onClose={onClose}>
      <div className="-m-6 h-[30rem]">
        <FilerobotImageEditor
          moreSaveOptions={[]}
          source={src}
          previewPixelRatio={90}
          savingPixelRatio={90}
          tabsIds={[TABS.ADJUST, TABS.RESIZE]}
          onBeforeSave={() => false}
          Crop={{
            presetsItems: [
              {
                icon: () => <GiSquare className="w-3 h-3 text-gray-500" />,
                titleKey: "Square",
                ratio: 1,
                descriptionKey: "1:1",
              },
            ],
          }}
          onSave={(data) => {
            data.imageCanvas?.toBlob((file) => {
              if (!file) return;
              const src = URL.createObjectURL(file);
              onEditDone({ srcFile: file, srcUrl: src });
            });
          }}
        />
      </div>
    </Modal>
  );
};

const useImageEditor = () => {
  const createOverlay = useCreateOverlay("");

  const openImageEditor = useCallback(
    ({
      src,
      onEditDone,
    }: Pick<ImageEditorModalProps, "onEditDone" | "src">) => {
      createOverlay({
        component: ({ close }) => (
          <ImageEditorModal
            src={src}
            onClose={close}
            onEditDone={(data) => {
              onEditDone(data);
              close();
            }}
          />
        ),
      });
    },
    [createOverlay],
  );

  return {
    openImageEditor,
  };
};

export default useImageEditor;
