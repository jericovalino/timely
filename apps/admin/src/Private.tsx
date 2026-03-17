import { useState } from "react";
import { HiClock, HiMenuAlt2, HiOutlineBell, HiUserGroup } from "react-icons/hi";
import { Navigate, Route, Routes, useNavigate } from "react-router";
import { LuBuilding2, LuCalendarDays, LuChartBar } from "react-icons/lu";

import {
  cn,
  Button,
  Sidebar,
  EmptyState,
  BreadcrumbMarker,
} from "@repo/multiverse-ui";

import Employees from "./app/employees/page";
import Departments from "./app/departments/page";
import Schedules from "./app/schedules/page";
import Attendance from "./app/attendance/page";
import Reports from "./app/reports/page";
import Logout from "./app/logout/page";

const Private = () => {
  const navigate = useNavigate();
  const [showSidebarInSmallScreen, setShowSidebarInSmallScreen] =
    useState(false);

  return (
    <div className="relative sm:flex sm:h-screen sm:flex-col overflow-hidden bg-gradient-to-br from-zinc-950 via-neutral-900 to-zinc-900">
      {/* Decorative blobs — brand magenta + purple */}
      <div
        className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full blur-3xl"
        style={{ background: "hsla(313,95%,24%,0.25)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full blur-3xl"
        style={{ background: "hsla(280,70%,30%,0.2)" }}
      />
      <div
        className="pointer-events-none absolute top-1/3 left-1/3 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: "hsla(313,80%,40%,0.1)" }}
      />
      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="relative flex sm:h-0 sm:flex-grow">
        <Sidebar
          title="Timely Admin"
          format={[
            {
              groupTitle: "Workforce",
              items: [
                {
                  icon: HiUserGroup,
                  label: "Employees",
                  to: "/employees",
                },
                {
                  icon: LuBuilding2,
                  label: "Departments",
                  to: "/departments",
                },
                {
                  icon: HiClock,
                  label: "Schedules",
                  to: "/schedules",
                },
              ],
            },
            {
              groupTitle: "Tracking",
              items: [
                {
                  icon: LuCalendarDays,
                  label: "Attendance",
                  to: "/attendance",
                },
                {
                  icon: LuChartBar,
                  label: "Reports",
                  to: "/reports",
                },
              ],
            },
          ]}
          showInMdAndBelow={showSidebarInSmallScreen}
          onBackdropClicked={() => setShowSidebarInSmallScreen(false)}
        />
        <main className="w-full sm:flex-grow overflow-x-auto flex flex-col">
          <header
            className={cn(
              "sticky left-0 right-0 top-0 z-10 flex h-[4.5rem] w-full items-center justify-between shrink-0",
              "border-b border-white/10 bg-white/5 backdrop-blur-md px-3 shadow-sm md:px-6",
            )}
          >
            <Button
              variant="icon"
              icon={HiMenuAlt2}
              className="md:hidden"
              onClick={() => setShowSidebarInSmallScreen(true)}
            />
            <div className="flex items-center flex-col sm:flex-row">
              <BreadcrumbMarker />
            </div>

            <button className="p-2 text-white/50 hover:text-white/80 transition-colors">
              <HiOutlineBell className="h-4 w-4" />
            </button>
          </header>
          <div className="flex-grow p-6 overflow-auto">
            <Routes>
              <Route path="/employees/*" element={<Employees />} />
              <Route path="/departments/*" element={<Departments />} />
              <Route path="/schedules/*" element={<Schedules />} />
              <Route path="/attendance/*" element={<Attendance />} />
              <Route path="/reports/*" element={<Reports />} />
              <Route path="/logout/*" element={<Logout />} />
              <Route index element={<Navigate to="/employees" />} />
              <Route path="/login" element={<Navigate to="/employees" />} />
              <Route
                path="*"
                element={
                  <EmptyState
                    heading="Page not found"
                    message="The page you are looking for does not exist."
                    primaryAction={{
                      label: "Return to Employees",
                      onClick: () => {
                        navigate("/employees");
                      },
                    }}
                  />
                }
              />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Private;
