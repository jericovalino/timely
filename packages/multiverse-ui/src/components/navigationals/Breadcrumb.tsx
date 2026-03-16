import { createPortal } from "react-dom";
import { type IconType } from "react-icons";
import { isValidElement, useEffect, useState } from "react";

import "./Breadcrumb.css";

import Text from "./../informationals/Text";
import Stack from "./../containers/Stack";

import { cn } from "./../../utilities";

export const BreadcrumbMarker = () => {
  return (
    <Stack as="section" horizontal align="center" justify="center">
      <div id="breadcrumbs" />
    </Stack>
  );
};

type Icon = IconType | React.ReactElement;
type Props = {
  /** Optional function to trigger on breadcrumb click.  */
  action?: () => void;
  active?: boolean;
  label: string;
  icon?: Icon;
};

const renderIcon = (Icon: Icon) => {
  if (isValidElement(Icon)) {
    return Icon;
  }
  if (typeof Icon === "function") {
    return <Icon size={16} className="group-hover:text-on-brand-subtle" />;
  }
  return null;
};

export const Breadcrumb = ({ action, label, icon }: Props) => {
  const [breadcrumbOutlet, setBreadcrumbOutlet] = useState<HTMLElement | null>(
    null,
  );

  useEffect(() => {
    setBreadcrumbOutlet(document.getElementById("breadcrumbs"));
  }, [setBreadcrumbOutlet]);

  return (
    <>
      {breadcrumbOutlet &&
        createPortal(
          <Stack
            gap={8}
            horizontal
            align="center"
            className="breadcrumb group"
            {...(action && {
              role: "button",
              onClick: action,
              className: "breadcrumb group cursor-pointer",
            })}
          >
            {icon && renderIcon(icon)}
            <Text
              size="body"
              weight="semibold"
              className={cn(
                "text-subtle",
                action &&
                  "transition duration-300 group-hover:text-on-brand-subtle",
                "text-caption md:text-body",
              )}
            >
              {label}
            </Text>
          </Stack>,
          breadcrumbOutlet,
        )}
    </>
  );
};
