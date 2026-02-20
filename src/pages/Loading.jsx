import { useEffect, useState, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom"; 
import { Button } from "@/components/ui/button"; 
import { cn } from "@/lib/utils"; 

const LandingScene = lazy(() => import("@/components/three/landing-scene"));
const LoadingDrive = lazy(() => import("@/components/three/loading-drive"));

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [showDriveSafely, setShowDriveSafely] = useState(false); 

  useEffect(() => {
    const t1 = setTimeout(() => setShowDriveSafely(true), 3000);

    const t2 = setTimeout(() => setLoading(false), 4200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{ backgroundColor: "#0B0C10" }}
    >
      <AnimatePresence>
        {loading && (
          <motion.div
            key="loading"
            className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            aria-label="Loading animation"
          >
            <div
              className="absolute inset-0"
              role="img"
              aria-label="Car driving animation"
            >
              <Suspense fallback={null}>
                <LoadingDrive />
              </Suspense>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: showDriveSafely ? 1 : 0 }}
              className="absolute bottom-20 text-4xl md:text-6xl font-semibold tracking-widest"
              style={{
                color: "#E0FFFF",
                textShadow:
                  "0 0 8px #00FFF7, 0 0 16px #00FFF7, 0 0 32px rgba(0,255,247,0.5)",
              }}
            >
              Drive Safely
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Show landing scene and main content only AFTER loading */}
      {!loading && (
        <>
          <div className="absolute inset-0 z-0">
            <Suspense fallback={null}>
              <LandingScene dayMode={false} />
            </Suspense>
          </div>

          <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
            <h1
              className={cn("text-3xl md:text-6xl font-bold mb-8 text-[#E0FFFF]")}
              style={{
                textShadow:
                  "0 0 6px rgba(0,255,247,0.8), 0 0 18px rgba(31,81,255,0.6)",
              }}
            >
              <Typewriter text=" AI Co-Pilot for Driver Safety " />
            </h1>

            <Link to="/dashboard">
              <Button
                size="lg"
                className="relative px-8 py-6 text-lg font-semibold"
                style={{
                  background: "linear-gradient(90deg, #00FFF7 0%, #1F51FF 100%)",
                  boxShadow:
                    "0 0 10px rgba(0,255,247,0.7), 0 0 20px rgba(31,81,255,0.5)",
                  color: "#0B0C10",
                }}
              >
                Start Simulation
                <span
                  className="absolute inset-0 -z-10 rounded-md"
                  style={{
                    boxShadow:
                      "0 0 24px rgba(0,255,247,0.6), 0 0 48px rgba(31,81,255,0.5)",
                  }}
                />
              </Button>
            </Link>
          </main>
        </>
      )}
    </div>
  );
}

function Typewriter({ text = "AI Co-Pilot for Driver Safety", speed = 55 }) {
  const [display, setDisplay] = useState("");
useEffect(() => {
  setDisplay(""); 
  let i = 0;

  const interval = setInterval(() => {
    if (i < text.length) {
      setDisplay((prev) => prev + text.charAt(i));
      i++;
    } else {
      clearInterval(interval);
    }
  }, speed);

  return () => clearInterval(interval);
}, [text, speed]);

  return (
    <span>
      {display}
      {display.length < text.length ? "▌" : ""}
    </span>
  );
}