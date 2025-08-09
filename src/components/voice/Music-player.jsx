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
    audio.volume = 0.1;

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
      {/* your existing styles */}
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: white !important;
          cursor: pointer;
          box-shadow: 0 0 4px rgba(255, 255, 255, 0.7);
          border: none;
          margin-top: -5px;
        }
        input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: white !important;
          cursor: pointer;
          box-shadow: 0 0 4px rgba(255, 255, 255, 0.7);
          border: none;
        }
      `}</style>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          width: 300,
          padding: 12,
          borderRadius: 10,
          color: "#fff",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        }}
      >
        <button
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play"}
          style={{
            cursor: "pointer",
            border: "none",
            background: "none",
            color: "#fff",
            fontSize: 26,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 44,
            height: 44,
            borderRadius: "50%",
            boxShadow: playing
              ? "0 0 12px #ffffff"
              : "0 0 4px rgba(0, 0, 0, 0)",
            transition: "box-shadow 0.3s ease",
          }}
        >
          {playing ? "❚❚" : "▶"}
        </button>

        <div style={{ flexGrow: 1 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: 14,
              marginBottom: 4,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
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
              height: 5,
              borderRadius: 3,
              background:
                "linear-gradient(90deg, #ffffff " +
                ((progress / duration) * 100 || 0) +
                "%, #404040 " +
                ((progress / duration) * 100 || 0) +
                "%)",
            }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              marginTop: 3,
              color: "#b3b3b3",
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
