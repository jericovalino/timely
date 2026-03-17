import { useState, useEffect, useCallback } from "react";
import useScanDetection from "use-scan-detection";
import api from "./utilities/api";

type ScanStatus =
  | "TIME_IN"
  | "TIME_OUT"
  | "ALREADY_RECORDED"
  | "NOT_FOUND"
  | "ERROR";

type ScanResult = {
  employeeName: string;
  employeePhoto?: string;
  currentTime: string;
  status: ScanStatus;
};

const STATUS_CONFIG: Record<
  ScanStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  TIME_IN: {
    label: "TIME IN",
    bg: "#16a34a",
    text: "#ffffff",
    border: "#15803d",
  },
  TIME_OUT: {
    label: "TIME OUT",
    bg: "#2563eb",
    text: "#ffffff",
    border: "#1d4ed8",
  },
  ALREADY_RECORDED: {
    label: "ALREADY RECORDED",
    bg: "#d97706",
    text: "#ffffff",
    border: "#b45309",
  },
  NOT_FOUND: {
    label: "NOT FOUND",
    bg: "#dc2626",
    text: "#ffffff",
    border: "#b91c1c",
  },
  ERROR: {
    label: "ERROR",
    bg: "#6b7280",
    text: "#ffffff",
    border: "#4b5563",
  },
};

const formatTime = (date: Date): string =>
  date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

const formatDate = (date: Date): string =>
  date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const Clock = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontSize: "6rem",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          color: "#ffffff",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatTime(now)}
      </div>
      <div
        style={{
          fontSize: "1.5rem",
          color: "#9ca3af",
          marginTop: "0.75rem",
          fontWeight: 400,
        }}
      >
        {formatDate(now)}
      </div>
    </div>
  );
};

const DarkBg = () => (
  <>
    <div
      style={{
        pointerEvents: "none",
        position: "absolute",
        top: "-8rem",
        right: "-8rem",
        width: "24rem",
        height: "24rem",
        borderRadius: "50%",
        background: "hsla(313,95%,24%,0.25)",
        filter: "blur(80px)",
      }}
    />
    <div
      style={{
        pointerEvents: "none",
        position: "absolute",
        bottom: "-8rem",
        left: "-8rem",
        width: "24rem",
        height: "24rem",
        borderRadius: "50%",
        background: "hsla(280,70%,30%,0.2)",
        filter: "blur(80px)",
      }}
    />
    <div
      style={{
        pointerEvents: "none",
        position: "absolute",
        top: "33%",
        left: "33%",
        width: "18rem",
        height: "18rem",
        transform: "translate(-50%,-50%)",
        borderRadius: "50%",
        background: "hsla(313,80%,40%,0.1)",
        filter: "blur(80px)",
      }}
    />
    <div
      style={{
        pointerEvents: "none",
        position: "absolute",
        inset: 0,
        opacity: 0.04,
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    />
  </>
);

const IdleScreen = () => (
  <div
    style={{
      position: "relative",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      background: "linear-gradient(to bottom right, #09090b, #171717, #18181b)",
      gap: "3rem",
      padding: "2rem",
      overflow: "hidden",
    }}
  >
    <DarkBg />
    <Clock />
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1rem",
      }}
    >
      <div
        style={{
          width: "5rem",
          height: "5rem",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
          border: "2px solid rgba(255,255,255,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" />
          <path d="M7 8h.01M12 8h.01M17 8h.01M7 12h10" />
        </svg>
      </div>
      <p
        style={{
          fontSize: "1.75rem",
          color: "rgba(255,255,255,0.6)",
          textAlign: "center",
          fontWeight: 500,
          maxWidth: "36rem",
          lineHeight: 1.4,
        }}
      >
        Scan your ID to record attendance
      </p>
    </div>
    <div style={{ position: "absolute", bottom: "2rem", opacity: 0.3 }}>
      <p style={{ fontSize: "0.875rem", color: "#ffffff", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        Timely DTR
      </p>
    </div>
  </div>
);

type FeedbackScreenProps = {
  result: ScanResult;
};

const FeedbackScreen = ({ result }: FeedbackScreenProps) => {
  const statusConfig = STATUS_CONFIG[result.status];

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "linear-gradient(to bottom right, #09090b, #171717, #18181b)",
        gap: "2rem",
        padding: "2rem",
        overflow: "hidden",
      }}
    >
      <DarkBg />
      {/* Avatar / Photo */}
      <div
        style={{
          width: "10rem",
          height: "10rem",
          borderRadius: "50%",
          overflow: "hidden",
          border: `4px solid ${statusConfig.border}`,
          background: "#1f2937",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {result.employeePhoto ? (
          <img
            src={result.employeePhoto}
            alt={result.employeeName}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        )}
      </div>

      {/* Name */}
      <div
        style={{
          fontSize: "3.5rem",
          fontWeight: 700,
          color: "#ffffff",
          textAlign: "center",
          lineHeight: 1.2,
          maxWidth: "40rem",
        }}
      >
        {result.employeeName}
      </div>

      {/* Time */}
      <div
        style={{
          fontSize: "2rem",
          color: "#9ca3af",
          fontVariantNumeric: "tabular-nums",
          fontWeight: 500,
        }}
      >
        {result.currentTime}
      </div>

      {/* Status Badge */}
      <div
        style={{
          background: statusConfig.bg,
          color: statusConfig.text,
          border: `2px solid ${statusConfig.border}`,
          borderRadius: "9999px",
          padding: "0.75rem 2.5rem",
          fontSize: "1.75rem",
          fontWeight: 700,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        {statusConfig.label}
      </div>
    </div>
  );
};

type ScanApiResponse = {
  employeeName: string;
  employeePhoto?: string;
  status: ScanStatus;
};

const App = () => {
  const [feedbackResult, setFeedbackResult] = useState<ScanResult | null>(null);
  const [feedbackTimer, setFeedbackTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const dismissFeedback = useCallback(() => {
    setFeedbackResult(null);
  }, []);

  const showFeedback = useCallback(
    (result: ScanResult) => {
      if (feedbackTimer) {
        clearTimeout(feedbackTimer);
      }
      setFeedbackResult(result);
      const timer = setTimeout(() => {
        dismissFeedback();
      }, 4500);
      setFeedbackTimer(timer);
    },
    [feedbackTimer, dismissFeedback]
  );

  const handleScan = useCallback(
    async (barcode: string) => {
      const trimmed = barcode.trim();
      if (!trimmed) return;

      try {
        const response = await api.post<ScanApiResponse>("/attendance/scan", {
          employeeNumber: trimmed,
        });

        showFeedback({
          employeeName: response.data.employeeName,
          employeePhoto: response.data.employeePhoto,
          currentTime: formatTime(new Date()),
          status: response.data.status,
        });
      } catch (err: unknown) {
        const axiosErr = err as {
          response?: {
            status?: number;
            data?: { status?: string; employeeName?: string };
          };
        };

        if (axiosErr.response?.status === 404) {
          showFeedback({
            employeeName: "Unknown Employee",
            currentTime: formatTime(new Date()),
            status: "NOT_FOUND",
          });
        } else if (axiosErr.response?.data?.status === "ALREADY_RECORDED") {
          showFeedback({
            employeeName: axiosErr.response.data.employeeName ?? "Employee",
            currentTime: formatTime(new Date()),
            status: "ALREADY_RECORDED",
          });
        } else {
          showFeedback({
            employeeName: "Scan Error",
            currentTime: formatTime(new Date()),
            status: "ERROR",
          });
        }
      }
    },
    [showFeedback]
  );

  useScanDetection({
    onComplete: (code) => {
      handleScan(String(code));
    },
    minLength: 3,
  });

  useEffect(() => {
    return () => {
      if (feedbackTimer) clearTimeout(feedbackTimer);
    };
  }, [feedbackTimer]);

  if (feedbackResult) {
    return <FeedbackScreen result={feedbackResult} />;
  }

  return <IdleScreen />;
};

export default App;
