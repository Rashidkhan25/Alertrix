

import React, { useState, useEffect, useRef } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { getWeatherSummary } from "../panels/weather-panel"; 
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";

export default function VoiceAssistant({ musicPlayerRef }) {
  const [activated, setActivated] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [listeningActive, setListeningActive] = useState(false); // New state to toggle listening

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    finalTranscript,
  } = useSpeechRecognition();

  const speakingRef = useRef(false);
  const lastProcessedRef = useRef("");
  const processTimeoutRef = useRef(null);
  const inactivityTimeoutRef = useRef(null);
  const fadeAnimationRef = useRef(null);
  const originalVolumesRef = useRef(new Map());

  const FADE_VOLUME = 0.06;
  const FADE_SPEED = 0.2;

  // Toggle listening and handle mic permission request
  const toggleListening = async () => {
    if (!listeningActive) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        SpeechRecognition.startListening({
          continuous: true,
          language: "en-US",
          interimResults: true,
        });
        setListeningActive(true);
        setPermissionDenied(false);
      } catch (err) {
        setPermissionDenied(true);
        console.warn("Microphone permission denied or error:", err);
      }
    } else {
      SpeechRecognition.stopListening();
      resetTranscript();
      setListeningActive(false);
      setActivated(false);
    }
  };

  // Activate assistant only when "jarvis" is detected in transcript
  useEffect(() => {
    if (!activated && transcript.toLowerCase().includes("jarvis")) {
      setActivated(true);
      resetTranscript();
      speak("Hi, I'm Jarvis. How can I help you?");
    }
  }, [transcript, activated, resetTranscript]);

  // Existing functions unchanged
  const playMusic = () => {
    if (musicPlayerRef?.current?.play) {
      musicPlayerRef.current.play();
      console.log("Playing music via ref");
    }
  };

  const pauseMusic = () => {
    if (musicPlayerRef?.current?.pause) {
      musicPlayerRef.current.pause();
      console.log("Pausing music via ref");
    }
  };

  const getWeather = async () => {
    try {
      const weatherSummary = await getWeatherSummary();
      return weatherSummary || "Sorry, I couldn't fetch the weather right now.";
    } catch {
      return "Sorry, there was an error fetching the weather.";
    }
  };

  const speak = (text) =>
    new Promise((resolve) => {
      if (!window.speechSynthesis) return resolve();
      speakingRef.current = true;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.onend = () => {
        speakingRef.current = false;
        resolve();
      };
      window.speechSynthesis.speak(utterance);
    });

  const handleCommand = async (text) => {
    if (text.includes("play music")) {
      playMusic();
      return "Playing your favorite song.";
    } else if (text.includes("stop music")) {
      pauseMusic();
      return "Music stopped.";
    } else if (text.includes("volume up")) {
      musicPlayerRef?.current?.volumeUp?.();
      return "Turning volume up.";
    } else if (text.includes("volume down")) {
      musicPlayerRef?.current?.volumeDown?.();
      return "Turning volume down.";
    } else if (
      text.includes("weather") ||
      text.includes("what's the weather")
    ) {
      return await getWeather();
    }
    return "";
  };

  const getBotResponse = (input) => {
    if (input.includes("hello") || input.includes("hi")) return "";
    if (input.includes("time")) {
      const now = new Date();
      return `It is ${now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })} now.`;
    }
    return "Sorry, I didn't get that. Can you please repeat?";
  };

  // Fade volumes for all audios on activation/deactivation
  useEffect(() => {
    const audios = Array.from(document.querySelectorAll("audio"));

    if (activated) {
      audios.forEach((audio) => {
        if (!originalVolumesRef.current.has(audio)) {
          originalVolumesRef.current.set(audio, audio.volume);
        }
      });
    } else {
      if (originalVolumesRef.current.size === 0) return;
    }

    function fadeVolumes() {
      let stillFading = false;
      audios.forEach((audio) => {
        if (!audio) return;
        const originalVolume = originalVolumesRef.current.get(audio) ?? 1;
        const targetVolume = activated ? FADE_VOLUME : originalVolume;
        const currentVolume = audio.volume;
        const diff = targetVolume - currentVolume;

        if (Math.abs(diff) > 0.01) {
          audio.volume = currentVolume + diff * FADE_SPEED;
          stillFading = true;
        } else {
          audio.volume = targetVolume;
        }
      });

      if (stillFading) {
        fadeAnimationRef.current = requestAnimationFrame(fadeVolumes);
      } else if (!activated) {
        originalVolumesRef.current.clear();
      }
    }

    fadeVolumes();

    return () => {
      if (fadeAnimationRef.current)
        cancelAnimationFrame(fadeAnimationRef.current);
    };
  }, [activated]);

  useEffect(() => {
    if (!activated) return;

    if (inactivityTimeoutRef.current)
      clearTimeout(inactivityTimeoutRef.current);

    inactivityTimeoutRef.current = setTimeout(async () => {
      if (!speakingRef.current) {
        await speak("Goodbye. Focus on your ride.");
        setActivated(false);
        resetTranscript();
      }
    }, 8000);

    if (processTimeoutRef.current) clearTimeout(processTimeoutRef.current);

    if (!finalTranscript) return;

    processTimeoutRef.current = setTimeout(async () => {
      const text = finalTranscript.trim().toLowerCase();

      if (text && text !== lastProcessedRef.current && !speakingRef.current) {
        lastProcessedRef.current = text;

        if (
          text.includes("close") ||
          text.includes("stop listening") ||
          text.includes("goodbye")
        ) {
          await speak("Goodbye! Stopping voice assistant.");
          setActivated(false);
          resetTranscript();
          SpeechRecognition.stopListening();
          setListeningActive(false);
          return;
        }

        const responseFromCommand = await handleCommand(text);
        const response = responseFromCommand || getBotResponse(text);

        await speak(response);
        resetTranscript();
      }
    }, 1000);

    return () => {
      clearTimeout(processTimeoutRef.current);
      clearTimeout(inactivityTimeoutRef.current);
    };
  }, [finalTranscript, activated, resetTranscript]);

  // Check mic permission on mount (no change)
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: "microphone" }).then((result) => {
        if (result.state === "granted") {
          setPermissionDenied(false);
        } else if (result.state === "denied") {
          setPermissionDenied(true);
        }
      });
    }
  }, []);

  if (!browserSupportsSpeechRecognition) {
    return (
      <div style={{ color: "red", padding: 10 }}>
        Your browser does not support Speech Recognition.
      </div>
    );
  }

  return (
    <>
      <div>
          <button
            type="button"
            style={{
              position: "fixed",
              bottom: 20,
              left: 50,
              background: "#0008",
              color: "#ffffff",
              padding: 12,
              borderRadius: 30,
              maxWidth: 280,
              fontFamily: "sans-serif",
              zIndex: 10000,
              cursor: "pointer",
              userSelect: "none",
              border: "none",
              fontSize: 14,
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
            onClick={() => {
              setActivated(true);
              resetTranscript();
              speak("Hi, I'm Jarvis. How can I help you?");
            }}
            title="Click to activate Jarvis"
          >
            <FontAwesomeIcon icon={faMicrophone} />
          </button>
          <p
            style={{
              position: "fixed",
              bottom: 17,
              left: 85,
              color: "#00fff7",
              padding: 12,
              borderRadius: 30,
              maxWidth: 280,
              fontFamily: "sans-serif",
              zIndex: 10000,
              cursor: "pointer",
              userSelect: "none",
              border: "none",
              fontSize: 14,
              textAlign: "center",
              display: "flex",
              alignItems: "center",
            }}
          >
            Voice Assistant
          </p>
        </div>{/* Mic toggle button */}
      {/* Only show button if not listening */}
      {!listeningActive && (
        <button
          type="button"
          onClick={toggleListening}
          style={{
            position: "fixed",
            bottom: 20,
            right: 50,
            background: "#000000",
            color: "#00fff7",
            padding: 12,
            borderRadius: 30,
            maxWidth: 280,
            fontFamily: "sans-serif",
            zIndex: 10000,
            cursor: "pointer",
            userSelect: "none",
            border: "none",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
          title="Start Listening"
        >
          Start Listening
        </button>
      )}

      {/* Show permission denied message */}
      {permissionDenied && (
        <p
          style={{
            position: "fixed",
            bottom: 60,
            left: 50,
            color: "red",
            maxWidth: 280,
            fontFamily: "sans-serif",
            zIndex: 10000,
          }}
        >
          Please allow microphone access for voice assistant to work.
        </p>
      )}

      {/* Your existing assistant UI */}
      {activated && (
        <>
          <div
            aria-hidden="true"
            style={{
              position: "fixed",
              top: -670,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(10, 9, 9, 0.9)",
              backdropFilter: "blur(10px)",
              zIndex: 9997,
              pointerEvents: "none",
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              zIndex: 9998,
            }}
          />
          <div
            aria-label="Voice assistant listening indicator"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -275%)",
              width: 160,
              height: 160,
              borderRadius: "50%",
              background:
                "radial-gradient(circle at center, #00fff7 0%, #0066cc 70%)",
              boxShadow:
                "0 0 30px #00fff7, inset 5px 5px 20px #00fff7, inset -5px -5px 20px #0066cc",
              animation: "pulse 2.5s infinite ease-in-out",
              zIndex: 10000,
              pointerEvents: "none",
            }}
          />
        </>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow:
              0 0 30px #00fff7, 
              inset 5px 5px 20px #00fff7, 
              inset -5px -5px 20px #0066cc;
          }
          50% {
            box-shadow:
              0 0 50px #00fff7, 
              inset 10px 10px 30px #00fff7, 
              inset -10px -10px 30px #0066cc;
          }
        }
      `}</style>
    </>
  );
}

