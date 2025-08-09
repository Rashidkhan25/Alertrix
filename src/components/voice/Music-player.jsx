import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";

const MusicPlayer = forwardRef((props, ref) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const songUrl = "/audio/song.mp3";

  // Expose play and pause methods to parent via ref
  useImperativeHandle(ref, () => ({
    play() {
      if (audioRef.current) {
        audioRef.current.play();
        setPlaying(true);
      }
    },
    pause() {
      if (audioRef.current) {
        audioRef.current.pause();
        setPlaying(false);
      }
    },
    volumeUp() {
      if (audioRef.current) {
        const newVolume = Math.min(audioRef.current.volume + 0.1, 1);
        audioRef.current.volume = newVolume;
      }
    },
    volumeDown() {
      if (audioRef.current) {
        const newVolume = Math.max(audioRef.current.volume - 0.1, 0);
        audioRef.current.volume = newVolume;
      }
    },
  }));

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.6;

    const updateProgress = () => setProgress(audio.currentTime);
    const setAudioDuration = () => setDuration(audio.duration);

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", setAudioDuration);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("loadedmetadata", setAudioDuration);
    };
  }, []);

  const togglePlay = () => {
    if (!playing) {
      audioRef.current.play();
      setPlaying(true);
    } else {
      audioRef.current.pause();
      setPlaying(false);
    }
  };

  const formatTime = (sec) => {
    if (isNaN(sec)) return "0:00";
    const minutes = Math.floor(sec / 60);
    const seconds = Math.floor(sec % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const onSeek = (e) => {
    const val = Number(e.target.value);
    audioRef.current.currentTime = val;
    setProgress(val);
  };

  return (
    <>
      {/* Neon cyan slider thumb styles */}
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #00fff7;
          cursor: pointer;
          box-shadow: 0 0 8px #00fff7, 0 0 12px #00fff7;
          border: none;
         
          transition: box-shadow 0.3s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          box-shadow: 0 0 16px #00fff7, 0 0 24px #00fff7;
        }
        input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #00fff7;
          cursor: pointer;
          box-shadow: 0 0 8px #00fff7, 0 0 12px #00fff7;
          border: none;
          transition: box-shadow 0.3s ease;
        }
        input[type="range"]::-moz-range-thumb:hover {
          box-shadow: 0 0 16px #00fff7, 0 0 24px #00fff7;
        }
      `}</style>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 15,
          width: 280, // reduced from 320
          borderRadius: 10,
          color: "#00fff7",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          userSelect: "none",
        }}
      >
        <button
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play"}
          style={{
            cursor: "pointer",
            border: "none",
            background: "none",
            color: "#ffffff",
            fontSize: 24, // slightly smaller button font size
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40, // smaller button size
            height: 40,
            borderRadius: "50%",
            boxShadow: playing
              ? "0 0 16px #00fff7, 0 0 24px #00fff7"
              : "0 0 6px rgba(0, 255, 247, 0.4)",
            transition: "box-shadow 0.3s ease",
            userSelect: "none",
          }}
        >
          {playing ? "❚❚" : "▶"}
        </button>

        <div style={{ flexGrow: 1 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 14, // smaller font size
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              textShadow: "0 0 5px #ffffff",
              color: "#ffffff",
            }}
            title="Cheap Thrills - Sia"
          >
            Cheap Thrills - Sia
          </div>

          <input
            type="range"
            min="0"
            max={duration}
            value={progress}
            onChange={onSeek}
            style={{
              width: "100%",
              cursor: "pointer",
              appearance: "none",
              height: 3, // thinner slider track
              borderRadius: 3,
              background: `linear-gradient(90deg, #00fff7 ${
                (progress / duration) * 100 || 0
              }%, #002f33 ${(progress / duration) * 100 || 0}%)`,
              boxShadow: "inset 0 0 8px #00fff7",
              outline: "none",
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11, // smaller time font size
              color: "#00fff7aa",
              textShadow: "0 0 5px #00fff7aa",
            }}
          >
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <audio ref={audioRef} src={songUrl} preload="metadata" />
      </div>
    </>
  );
});

export default MusicPlayer;
