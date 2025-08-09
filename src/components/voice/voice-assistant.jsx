import { useEffect, useRef, useState } from "react";

export default function CarVoiceAssistant() {
  const recognitionRef = useRef(null);
  const [waitingForCommand, setWaitingForCommand] = useState(false);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition not supported in your browser");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = false;

    rec.onresult = (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript
        .toLowerCase()
        .trim();

      console.log("Heard:", transcript);

      if (transcript.includes("jarvis")) {
        // Remove "hey car" from the command
        const afterHotword = transcript.replace("jarvis", "").trim();

        if (afterHotword) {
          // If command was given immediately after hotword
          speak(`Okay, ${afterHotword}`);
          handleCommand(afterHotword);
        } else {
          // Ask for command
          speak("Hi, what can I help you with?");
          setWaitingForCommand(true);
        }
        return;
      }

      if (waitingForCommand) {
        handleCommand(transcript);
        setWaitingForCommand(false);
      }
    };

    recognitionRef.current = rec;
    rec.start();

    return () => rec.stop();
  }, [waitingForCommand]);

  const speak = (text) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.05;
    speechSynthesis.speak(utter);
  };

  const handleCommand = (text) => {
    if (text.includes("play music")) {
      speak("Playing music");
      playMusic();
    } else if (text.includes("volume up")) {
      speak("Increasing volume");
      volumeUp();
    } else if (text.includes("volume down")) {
      speak("Decreasing volume");
      volumeDown();
    } else if (text.includes("change music") || text.includes("next song")) {
      speak("Changing song");
      changeMusic();
    } else if (text.includes("what's the weather") || text.includes("weather")) {
      speak("Fetching the weather");
      getWeather();
    } else {
      speak("Sorry, I can't help with that");
    }
  };

  // Dummy implementations
  const playMusic = () => console.log("🎵 Playing music...");
  const volumeUp = () => console.log("🔊 Increasing volume");
  const volumeDown = () => console.log("🔉 Decreasing volume");
  const changeMusic = () => console.log("⏭ Changing track");
  const getWeather = () => console.log("🌦 Getting weather...");

  return null;
}
