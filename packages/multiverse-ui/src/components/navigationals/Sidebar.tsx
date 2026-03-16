/// <reference types="vite/client" />
import { HiChevronDown, HiChevronUp } from "react-icons/hi";
import { type IconType } from "react-icons";
import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { type ComponentPropsWithoutRef, Fragment, useState } from "react";

import { Avatar, ColoredLogo, Text } from "../informationals";
import { Button } from "../input_controls";

import { cn } from "../../utilities";
import { useOnClickOutside } from "../../hooks";

type NavItemProps = Omit<
  ComponentPropsWithoutRef<typeof NavLink>,
  "className" | "children"
> & {
  icon: IconType;
  label: string;
  subRoutes?: Array<{
    label: string;
    to: string;
  }>;
};

const NavItem = ({ label, icon: Icon, subRoutes, ...rest }: NavItemProps) => {
  return (
    <>
      <NavLink
        className={cn(
          "flex items-center space-x-2 rounded border border-transparent px-[0.6875rem] py-[0.5625rem] text-subtle",
          "[&:is(.active,:hover)>.icon]:text-icon-brand [&:is(.active,:hover)]:border-subtle [&:is(.active,:hover)]:bg-brand-subtle [&:is(.active,:hover)]:text-on-brand-subtle [&>.icon]:text-subtle",
        )}
        {...rest}
      >
        {({ isActive }) => (
          <>
            <Icon className="icon h-4 w-4" />{" "}
            <span className="text-sm font-medium leading-4">{label}</span>
            {subRoutes && (
              <div className="ml-auto">
                {isActive ? (
                  <HiChevronUp className="icon h-5 w-5" />
                ) : (
                  <HiChevronDown className="icon h-5 w-5" />
                )}
              </div>
            )}
          </>
        )}
      </NavLink>
      <Routes>
        <Route
          path={`${rest.to as string}/*`}
          element={
            <ul className="ml-4 mt-0.5">
              {subRoutes?.map((subRoute) => (
                <li key={subRoute.to}>
                  <NavLink
                    to={subRoute.to}
                    className={({ isActive }) =>
                      cn(
                        "px-4 py-1.5 flex items-center border-l-2",
                        isActive && "border-l-brand",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <Text size="body" color={isActive ? "brand" : "default"}>
                        {subRoute.label}
                      </Text>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          }
        />
      </Routes>
    </>
  );
};

type SidebarProps = {
  showInMdAndBelow: boolean;
  onBackdropClicked: () => void;
  title: string;
  format: Array<{
    groupTitle?: string;
    className?: string;
    items: Array<NavItemProps>;
  }>;
  user?: {
    name: string;
    role: string;
  };
};

const Sidebar = ({
  showInMdAndBelow,
  onBackdropClicked,
  title,
  format,
  user,
}: SidebarProps) => {
  const navigate = useNavigate();

  const [isOptionVisible, setIsOptionVisible] = useState(false);
  const { ref } = useOnClickOutside(() => setIsOptionVisible(false));

  return (
    <Fragment>
      <aside
        className={cn(
          "bottom-0 top-0 z-20 flex h-full w-[17.5rem] flex-shrink-0 flex-col divide-y border-r border-subtle bg-surface shadow-md",
          "transition-transform ease-[cubic-bezier(0.47,1.64,0.41,0.8)] md:static md:translate-x-0",
          !showInMdAndBelow ? "-translate-x-full" : "",
        )}
      >
        <nav className="h-0 flex flex-col flex-grow space-y-2 px-4 pt-6 pb-2 overflow-scroll">
          <ColoredLogo className="mb-4 w-32" />
          <Text size="caption" weight="semibold" color="subtle">
            {title}
          </Text>
          <ul className="divide-y divide-subtle flex flex-col flex-grow">
            {format.map((group, i) => (
              <li key={i} className={cn("space-y-1 py-2", group.className)}>
                {group.groupTitle && (
                  <div className="p-1">
                    <Text size="caption" color="subtle" weight="medium">
                      {group.groupTitle}
                    </Text>
                  </div>
                )}
                <ul>
                  {group.items.map((d, i) => {
                    return (
                      <li key={i}>
                        <NavItem {...d} />
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center p-6 bg-white">
          <Avatar initials="SP" rounded variant="initials" size={32} />
          <div className="ml-3">
            <h6 className="text-xs font-bold leading-[0.875rem] text-brand">
              {user?.name ?? "-"}
            </h6>
            <p className="mt-0.5 text-xs leading-[0.875rem] text-subtle">
              {user?.role ?? "-"}
            </p>
          </div>
          <span className="relative ml-auto">
            <Button
              variant="icon"
              size="sm"
              icon={HiChevronDown}
              className={cn(isOptionVisible ? "pointer-events-none" : "")}
              onClick={() => setIsOptionVisible(true)}
            />
            <div
              ref={ref}
              className={cn(
                "absolute bottom-0 right-full -translate-x-2 bg-white shadow-2xl transition-opacity ease-in border",
                !isOptionVisible ? "pointer-events-none opacity-0" : "",
              )}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsOptionVisible(false);
                  navigate("/profile");
                }}
              >
                Profile
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsOptionVisible(false);
                  navigate("/logout");
                }}
              >
                Logout
              </Button>
            </div>
          </span>
        </div>
      </aside>
      <button
        type="button"
        className={cn(
          showInMdAndBelow ? "md:hidden" : "pointer-events-none opacity-0",
          "fixed inset-0 z-10 h-full w-full bg-gray-900/50 backdrop-blur-sm",
        )}
        onClick={onBackdropClicked}
      />
    </Fragment>
  );
};
export default Sidebar;
