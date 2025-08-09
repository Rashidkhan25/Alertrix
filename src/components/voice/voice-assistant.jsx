import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function CarVoiceAssistant() {
  const recognitionRef = useRef(null);
  const hideTimeoutRef = useRef(null);     // 3-sec hide after command
  const waitTimeoutRef = useRef(null);     // 4-sec wait for follow-up after wake word
  const [waitingForCommand, setWaitingForCommand] = useState(false);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    // Inject keyframe styles once when component mounts
    const styleSheet = `
      @keyframes floatMove {
        0% { transform: translate(0, 0); }
        25% { transform: translate(20px, -10px); }
        50% { transform: translate(0, -20px); }
        75% { transform: translate(-20px, -10px); }
        100% { transform: translate(0, 0); }
      }
    `;
    const styleTag = document.createElement("style");
    styleTag.textContent = styleSheet;
    document.head.appendChild(styleTag);
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition not supported in your browser");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = false;

    let isRecognizing = false;

    const clearAllTimeoutsAndHide = () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      if (waitTimeoutRef.current) {
        clearTimeout(waitTimeoutRef.current);
        waitTimeoutRef.current = null;
      }
      setListening(false);
      setWaitingForCommand(false);
      console.log("UI hidden, states reset");
    };

    const startHideTimeout = () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = setTimeout(() => {
        console.log("3-sec hide timeout after command, hiding UI");
        clearAllTimeoutsAndHide();
      }, 3000);
    };

    const startWaitForCommandTimeout = () => {
      if (waitTimeoutRef.current) clearTimeout(waitTimeoutRef.current);
      waitTimeoutRef.current = setTimeout(() => {
        console.log("4-sec wait for follow-up expired, hiding UI");
        clearAllTimeoutsAndHide();
      }, 4000);
    };

    const speak = (text, callback) => {
      if (!window.speechSynthesis) {
        if (callback) callback();
        return;
      }
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1.05;
      let ended = false;
      utter.onend = () => {
        ended = true;
        if (callback) callback();
      };
      speechSynthesis.speak(utter);

      setTimeout(() => {
        if (!ended && callback) callback();
      }, 5000);
    };

    const startRecognition = () => {
      if (!isRecognizing) {
        try {
          rec.start();
          isRecognizing = true;
          console.log("Recognition started");
        } catch (e) {
          console.warn("Recognition start error:", e.message);
        }
      }
    };

    rec.onstart = () => {
      isRecognizing = true;
      console.log("Recognition event: started");
    };

    rec.onend = () => {
      isRecognizing = false;
      console.log("Recognition event: ended, restarting...");
      startRecognition();
    };

    rec.onerror = (e) => {
      console.error("Recognition error:", e.error);
      if (e.error === "no-speech" || e.error === "aborted") {
        if (isRecognizing) {
          try {
            rec.stop();
          } catch (err) {
            console.warn("Error stopping recognition:", err.message);
          }
        } else {
          startRecognition();
        }
      }
    };

    rec.onresult = (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript.toLowerCase().trim();

      console.log("Heard:", transcript);

      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      if (waitTimeoutRef.current) {
        clearTimeout(waitTimeoutRef.current);
        waitTimeoutRef.current = null;
      }

      if (transcript.includes("jarvis")) {
        clearAllTimeoutsAndHide();

        setListening(true);
        setWaitingForCommand(false);

        const afterHotword = transcript.replace("jarvis", "").trim();

        if (afterHotword) {
          speak(`Okay, ${afterHotword}`, () => {
            handleCommand(afterHotword);
            startHideTimeout();
          });
        } else {
          speak("Hi, what can I help you with?", () => {
            setWaitingForCommand(true);
            startWaitForCommandTimeout();
          });
        }
        return;
      }

      if (waitingForCommand) {
        speak(`Okay, ${transcript}`, () => {
          handleCommand(transcript);
          setWaitingForCommand(false);
          startHideTimeout();
        });
      }
    };

    recognitionRef.current = rec;
    startRecognition();

    return () => {
      rec.onend = null;
      if (isRecognizing) {
        try {
          rec.stop();
        } catch {}
      }
      clearAllTimeoutsAndHide();
    };
  }, [waitingForCommand]);

  const handleCommand = (text) => {
    if (text.includes("play music")) {
      playMusic();
    } else if (text.includes("volume up")) {
      volumeUp();
    } else if (text.includes("volume down")) {
      volumeDown();
    } else if (text.includes("change music") || text.includes("next song")) {
      changeMusic();
    } else if (text.includes("what's the weather") || text.includes("weather")) {
      getWeather();
    } else {
      if (window.speechSynthesis) {
        const utter = new SpeechSynthesisUtterance("Sorry, I can't help with that");
        speechSynthesis.speak(utter);
      } else {
        console.log("Sorry, I can't help with that");
      }
    }
  };

  const playMusic = () => console.log("🎵 Playing music...");
  const volumeUp = () => console.log("🔊 Increasing volume");
  const volumeDown = () => console.log("🔉 Decreasing volume");
  const changeMusic = () => console.log("⏭ Changing track");
  const getWeather = () => console.log("🌦 Getting weather...");

  return (
    <>
      {listening &&
        createPortal(
          <div style={overlayStyle}>
            <div style={floatingCircleStyle} />
          </div>,
          document.body
        )}
    </>
  );
}

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0, 0, 0, 0.7)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
  overflow: "hidden",
};

const floatingCircleStyle = {
  width: "150px",
  height: "150px",
  borderRadius: "50%",
  background: "linear-gradient(135deg, #4cafef, #0066cc, #4cafef)",
  boxShadow:
    "0 0 30px #4cafef, inset 5px 5px 15px #60a0ff, inset -5px -5px 15px #0050a0",
  animation: "floatMove 6s ease-in-out infinite",
};
