import {
  isValidElement,
  type ReactNode,
  type ComponentPropsWithoutRef,
} from "react";

import { cn } from "./../../utilities";

import Text from "./Text";
import Button from "./../input_controls/Button";
import Stack from "./../containers/Stack";

type ButtonProps = Partial<ComponentPropsWithoutRef<typeof Button>> & {
  label: string;
};

type ImageProps = {
  src: string;
  alt?: string;
  width?: string | number;
  height?: string | number;
  className?: string;
};

export type Props = {
  heading?: string;
  message?: string;
  image?: ImageProps | ReactNode;
  className?: string;
  primaryAction?: ButtonProps;
  secondaryAction?: ButtonProps;
  tertiaryAction?: ButtonProps;
};

const isImageProps = (image: unknown): image is ImageProps => {
  return !!image && typeof image === "object" && "src" in image;
};

const renderImage = (image: ImageProps | ReactNode) => {
  if (!image) return null;
  if (isValidElement(image)) return <>{image}</>;
  if (isImageProps(image)) {
    return (
      <img
        {...image}
        alt={image.alt ?? ""}
        className={cn("mb-4 object-contain", image.className)}
      />
    );
  }
};

const EmptyState = ({
  heading = "No data available",
  message = "There’s nothing to display here right now.",
  image,
  className,
  primaryAction,
  secondaryAction,
  tertiaryAction,
}: Props) => {
  return (
    <Stack
      gap={24}
      className={cn(
        "flex h-full w-full flex-col items-center justify-center",
        className
      )}
    >
      <Stack gap={8} align="center">
        {renderImage(image)}
        <Text as="h1" size="heading" weight="semibold" className="text-center">
          {heading}
        </Text>
        {message && (
          <Text
            as="span"
            size="body"
            lineHeight="relaxed"
            className="w-full text-wrap text-center text-subtle"
          >
            {message}
          </Text>
        )}
      </Stack>
      {primaryAction && (
        <Stack gap={12} align="center">
          <Stack gap={8} horizontal>
            {secondaryAction && (
              <Button intent="primary" variant="ghost" {...secondaryAction}>
                {secondaryAction.label}
              </Button>
            )}
            <Button intent="primary" variant="solid" {...primaryAction}>
              {primaryAction.label}
            </Button>
          </Stack>
          {tertiaryAction && (
            <Button
              intent="info"
              variant="text"
              {...tertiaryAction}
              className="w-fit"
            >
              {tertiaryAction.label}
            </Button>
          )}
        </Stack>
      )}
    </Stack>
  );
};

export default EmptyState;
