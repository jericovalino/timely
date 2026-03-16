import React from "react";
import { Fragment } from "react/jsx-runtime";
import { Stack } from "../containers";

import Text from "./Text";

type Props = {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actionElements?: React.ReactNode[];
};

const ModuleHeader = ({ title, subtitle, actionElements }: Props) => {
  return (
    <Stack
      horizontal
      gap={24}
      width="full"
      justify="start"
      align="center"
      distribute="between"
    >
      <Stack gap={4}>
        <Text size="lead" weight="semibold" color="default">
          {title}
        </Text>
        {subtitle && (
          <Text size="caption" color="subtle">
            {subtitle}
          </Text>
        )}
      </Stack>
      {Boolean(actionElements) && (
        <Stack horizontal gap={4} className="ml-auto">
          {actionElements!.map((el, i) => (
            <Fragment key={i}>{el}</Fragment>
          ))}
        </Stack>
      )}
    </Stack>
  );
};

export default ModuleHeader;
