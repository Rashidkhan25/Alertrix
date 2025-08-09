import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Siren, AlertTriangle, TicketIcon as Seatbelt } from "lucide-react";

export default function AlertsDisplay({ alerts = [] }) {
  const [currentAlert, setCurrentAlert] = useState(null);
  const timerRef = useRef(null);
  const latestAlertIdRef = useRef(null);

  useEffect(() => {
    if (alerts.length === 0) return;

    // Pick the most recent alert (last in array)
    const newestAlert = alerts[alerts.length - 1];

    // If it's already showing this alert, do nothing
    if (latestAlertIdRef.current === newestAlert.id) {
      return;
    }

    // Show newest alert immediately
    setCurrentAlert(newestAlert);
    latestAlertIdRef.current = newestAlert.id;

    // Reset hide timer
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setCurrentAlert(null);
      latestAlertIdRef.current = null;
    }, 3000);
  }, [alerts]);

  // Vibrate & alert border animation for high severity
  useEffect(() => {
    if (!currentAlert) return;
    if (currentAlert.severity === "high" && "vibrate" in navigator) {
      navigator.vibrate([80, 60, 80]);
      const el = document.getElementById("root") || document.body;
      el.classList.add("alert-border");
      const t = setTimeout(() => el.classList.remove("alert-border"), 1800);
      return () => clearTimeout(t);
    }
  }, [currentAlert]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 9999,
        maxWidth: "320px",
        pointerEvents: "none",
      }}
    >
      <AnimatePresence>
        {currentAlert && (
          <motion.div
            key={currentAlert.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            style={{
              pointerEvents: "auto",
              background: "rgba(31,81,255,0.12)",
              border: "1px solid rgba(0,255,247,0.15)",
              boxShadow: "0 0 12px rgba(0,255,247,0.1)",
              borderRadius: 8,
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: "#E0FFFF",
              fontSize: 14,
              userSelect: "none",
              fontWeight: "500",
            }}
          >
            <AlertIcon
              type={currentAlert.type}
              severity={currentAlert.severity}
            />
            <div>
              {currentAlert.message}{" "}
              <span style={{ opacity: 0.7, marginLeft: 8 }}>
                [{currentAlert.time}]
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style
        dangerouslySetInnerHTML={{
          __html: `
          .alert-border {
            animation: borderPulse 0.8s ease-in-out 2;
          }
          @keyframes borderPulse {
            0% { box-shadow: 0 0 0 0 rgba(255,23,68,0.0) inset; }
            50% { box-shadow: 0 0 0 8px rgba(255,23,68,0.5) inset; }
            100% { box-shadow: 0 0 0 0 rgba(255,23,68,0.0) inset; }
          }
        `,
        }}
      />
    </div>
  );
}

function AlertIcon({ type, severity }) {
  const color =
    severity === "high"
      ? "#FF1744"
      : severity === "medium"
      ? "#FFC300"
      : "#00FFF7";
  const style = { color, filter: `drop-shadow(0 0 6px ${color})` };
  if (type === "drowsiness") return <Siren style={style} />;
  if (type === "seatbelt") return <Seatbelt style={style} />;
  return <AlertTriangle style={style} />;
}
