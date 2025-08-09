import React, { useState, useEffect, useRef } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { getWeatherSummary } from "../panels/weather-panel"; // adjust path as needed

export default function VoiceAssistant({ musicPlayerRef }) {
  const [activated, setActivated] = useState(false);

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

  // Music control using musicPlayerRef
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

  const volumeUp = () => {
    console.log("Volume turned up.");
    // Implement volume up logic if possible
  };

  const volumeDown = () => {
    console.log("Volume turned down.");
    // Implement volume down logic if possible
  };

  const changeMusic = () => {
    console.log("Changing music...");
    // Implement music change logic if you have it
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

  useEffect(() => {
    if (!browserSupportsSpeechRecognition) return;
    if (!listening) {
      SpeechRecognition.startListening({
        continuous: true,
        language: "en-US",
        interimResults: true,
      });
    }
  }, [listening, browserSupportsSpeechRecognition]);

  useEffect(() => {
    if (activated) return;
    if (!transcript) return;

    const text = transcript.toLowerCase();
    if (text.includes("jarvis")) {
      setActivated(true);
      speak("Hi, I'm Jarvis. How can I help you?");
      resetTranscript();
    }
  }, [transcript, activated, resetTranscript]);

  const handleCommand = async (text) => {
    if (text.includes("play music")) {
      playMusic();
      return "Playing your favorite song.";
    } else if (text.includes("stop music")) {
      pauseMusic();
      return "Music stopped.";
    } else if (text.includes("volume up")) {
      musicPlayerRef?.current?.volumeUp();
      return "Turning volume up.";
    } else if (text.includes("volume down")) {
      musicPlayerRef?.current?.volumeDown();
      return "Turning volume down.";
    } else if (
      text.includes("what's the weather") ||
      text.includes("weather")
    ) {
      return await getWeather();
    }
    return "Sorry, I didn't understand that command.";
  };

  const getBotResponse = (input) => {
    if (input.includes("hello") || input.includes("hi")) {
      return "";
    }
    if (input.includes("time")) {
      const now = new Date();
      return `It is ${now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })} now.`;
    }
    return "Sorry, I didn't get that. Can you please repeat?";
  };

  useEffect(() => {
    if (!activated) return;

    if (inactivityTimeoutRef.current)
      clearTimeout(inactivityTimeoutRef.current);

    inactivityTimeoutRef.current = setTimeout(async () => {
      if (!speakingRef.current) {
        await speak("goodbye. focus on your ride");
        setActivated(false);
        resetTranscript();
      }
    }, 11000);

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
          return;
        }

        const responseFromCommand = await handleCommand(text);

        const response = responseFromCommand || getBotResponse(text);

        await speak(response);
        resetTranscript();
      }
    }, 1200);

    return () => {
      clearTimeout(processTimeoutRef.current);
      clearTimeout(inactivityTimeoutRef.current);
    };
  }, [finalTranscript, activated, resetTranscript]);

  if (!browserSupportsSpeechRecognition) {
    return (
      <div style={{ color: "red", padding: 10 }}>
        Your browser does not support Speech Recognition.
      </div>
    );
  }

  return (
    <>
      {activated && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 9998,
          }}
        />
      )}

      {!activated && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            background: "#0008",
            color: "#fff",
            padding: 12,
            borderRadius: 8,
            maxWidth: 280,
            fontFamily: "sans-serif",
            zIndex: 10000,
            cursor: "pointer",
            userSelect: "none",
          }}
          onClick={() => {
            setActivated(true);
            resetTranscript();
            speak("Hi, I'm Jarvis. How can I help you?");
          }}
          title="Click to activate Jarvis"
        >
          Say "Jarvis" or click here to activate
        </div>
      )}

      {activated && (
        <div
          aria-label="Voice assistant listening indicator"
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -300%)",
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
