import { RiToolsLine } from "react-icons/ri";
import type { ReactNode } from "react";
import Text from "./Text";

type Props = { children?: ReactNode };

const WorkInProgress = ({ children }: Props) => (
  <div className="relative flex flex-col flex-1 min-h-0">
    <div className="pointer-events-none opacity-30 flex flex-col flex-1 min-h-0">{children}</div>
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4">
      <RiToolsLine className="w-16 h-16 text-brand" />
      <Text as="h2" size="heading" weight="semibold">
        Work in Progress
      </Text>
      <Text size="body" color="subtle">
        This module is currently under development.
      </Text>
    </div>
  </div>
);

export default WorkInProgress;
