import React, { useEffect, useRef, useState } from "react";
import FocusMeter from "../hud/focus-meter";

export default function WebcamPreview({ onDrowsinessAlert, onFocusChange }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("Loading...");
  const [isAlertActive, setIsAlertActive] = useState(false);

  const EAR_THRESHOLD_LOW = 0.25;
  const EAR_THRESHOLD_HIGH = 0.28;
  const YAWN_THRESHOLD_LOW = 0.75;
  const YAWN_THRESHOLD_HIGH = 0.65;

  const CLOSED_EYE_FRAME_5S = 30 * 2;
  const CLOSED_EYE_FRAME_10S = 30 * 4;

  const closedEyeFrames = useRef(0);
  const eyeAlertSpoken = useRef(false);
  const sirenPlaying = useRef(false);
  const sirenAudioRef = useRef(null);
  const yawnAlertSpoken = useRef(false);
  const noFaceAlertSpoken = useRef(false);

  const earBuffer = useRef([]);
  const marBuffer = useRef([]);

  function distance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  function calculateEAR(landmarks, left) {
    const indices = left
      ? [33, 160, 158, 133, 153, 144]
      : [263, 387, 385, 362, 380, 373];
    const p1 = landmarks[indices[0]];
    const p2 = landmarks[indices[1]];
    const p3 = landmarks[indices[2]];
    const p4 = landmarks[indices[3]];
    const p5 = landmarks[indices[4]];
    const p6 = landmarks[indices[5]];

    const vertical1 = distance(p2, p6);
    const vertical2 = distance(p3, p5);
    const horizontal = distance(p1, p4);

    return (vertical1 + vertical2) / (2.0 * horizontal);
  }

  function calculateMAR(landmarks) {
    const leftCorner = landmarks[61];
    const rightCorner = landmarks[291];
    const upperLipTop = landmarks[13];
    const lowerLipBottom = landmarks[14];
    const upperInnerLip = landmarks[78];
    const lowerInnerLip = landmarks[308];

    const horizontal = distance(leftCorner, rightCorner);
    const vertical1 = distance(upperLipTop, lowerLipBottom);
    const vertical2 = distance(upperInnerLip, lowerInnerLip);
    const vertical = (vertical1 + vertical2) / 2;

    return vertical / horizontal;
  }

  // Calculate approximate yaw angle in degrees:
  // We'll use nose tip (landmark 1), left eye (33), right eye (263)
  // Calculate angle based on horizontal distances:
  function calculateYawAngle(landmarks) {
    const nose = landmarks[1]; // nose tip
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];

    // Midpoint between eyes
    const midX = (leftEye.x + rightEye.x) / 2;
    const midY = (leftEye.y + rightEye.y) / 2;

    // horizontal offset from nose to midpoint
    const dx = nose.x - midX;
    const dy = nose.y - midY;

    // Use atan2 to get angle
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = (angleRad * 180) / Math.PI;

    // The angle here is relative horizontal, but we care mostly about yaw left-right.
    // Since face turning left moves nose tip right relative to eyes midpoint (depending on camera), we'll flip sign:
    // After some testing, just use dx * -1 to approximate yaw:
    const yawDeg = -dx * 180; // scale for intuition, not precise but good for threshold

    return yawDeg;
  }

  function speak(text) {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  }

  function earToFocusPercent(ear) {
    const minEAR = 0.15;
    const maxEAR = 0.35;
    const clampedEAR = Math.min(Math.max(ear, minEAR), maxEAR);
    const normalized = (clampedEAR - minEAR) / (maxEAR - minEAR);
    return Math.round(normalized * 100);
  }

  useEffect(() => {
    sirenAudioRef.current = new Audio("/audio/alert.mp3");
    sirenAudioRef.current.loop = true;
    return () => {
      if (sirenAudioRef.current) {
        sirenAudioRef.current.pause();
        sirenAudioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!videoRef.current) return;

    let faceMesh = null;
    let camera = null;

    async function loadFaceMesh() {
      if (!("FaceMesh" in window)) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src =
            "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js";
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }
      if (!("Camera" in window)) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src =
            "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js";
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }

      faceMesh = new window.FaceMesh({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.8,
        minTrackingConfidence: 0.8,
      });
      faceMesh.onResults(onResults);

      camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          await faceMesh.send({ image: videoRef.current });
        },
        width: 640,
        height: 480,
      });
      camera.start();
    }

    function average(arr) {
      if (arr.length === 0) return 0;
      return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    function onResults(results) {
      const canvasCtx = canvasRef.current.getContext("2d");
      canvasCtx.save();
      canvasCtx.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
      canvasCtx.drawImage(
        results.image,
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );

      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];

        // Calculate yaw angle
        const yaw = calculateYawAngle(landmarks);
        // console.log("Yaw angle:", yaw);

        // Only allow alerts if yaw is beyond ±90°
        const isYawOutsideThreshold = Math.abs(yaw) > 90;

        if (!isYawOutsideThreshold) {
          // Face detected and facing mostly front, clear noFace alert flags
          noFaceAlertSpoken.current = false;
        }

        // If yaw inside threshold, consider face detected
        if (!isYawOutsideThreshold) {
          // --- Existing face detection logic ---

          closedEyeFrames.current = closedEyeFrames.current || 0; // safety init

          const leftEAR = calculateEAR(landmarks, true);
          const rightEAR = calculateEAR(landmarks, false);
          const currentEAR = (leftEAR + rightEAR) / 2;

          const currentMAR = calculateMAR(landmarks);

          if (earBuffer.current.length >= 5) earBuffer.current.shift();
          earBuffer.current.push(currentEAR);

          if (marBuffer.current.length >= 5) marBuffer.current.shift();
          marBuffer.current.push(currentMAR);

          const smoothEAR = average(earBuffer.current);
          const smoothMAR = average(marBuffer.current);

          const focusPercent = earToFocusPercent(smoothEAR);
          if (onFocusChange) onFocusChange(focusPercent);

          if (smoothEAR < EAR_THRESHOLD_LOW) {
            closedEyeFrames.current += 1;

            if (
              closedEyeFrames.current >= CLOSED_EYE_FRAME_5S &&
              closedEyeFrames.current < CLOSED_EYE_FRAME_10S
            ) {
              setStatus("Sleepy 😴 (Eyes closed 5+ seconds)");

              if (!eyeAlertSpoken.current) {
                speak("Stay with me");
                eyeAlertSpoken.current = true;

                if (onDrowsinessAlert) {
                  onDrowsinessAlert({
                    id: Date.now().toString(),
                    type: "drowsiness",
                    message: "Drowsiness detected: Eyes closed for 5+ seconds",
                    severity: "high",
                    time: new Date().toLocaleTimeString(),
                  });
                }
              }
              if (sirenPlaying.current && sirenAudioRef.current) {
                sirenAudioRef.current.pause();
                sirenPlaying.current = false;
                setIsAlertActive(false);
              }
            } else if (closedEyeFrames.current >= CLOSED_EYE_FRAME_10S) {
              setStatus("Very Sleepy! Siren ON 🚨");

              if (!sirenPlaying.current && sirenAudioRef.current) {
                sirenAudioRef.current.play().catch(() => {});
                sirenPlaying.current = true;
                setIsAlertActive(true);

                if (onDrowsinessAlert) {
                  onDrowsinessAlert({
                    id: Date.now().toString(),
                    type: "drowsiness",
                    message:
                      "Drowsiness detected: Eyes closed for 10+ seconds, siren ON",
                    severity: "critical",
                    time: new Date().toLocaleTimeString(),
                  });
                }
              }
            }
          } else if (smoothEAR > EAR_THRESHOLD_HIGH) {
            setStatus("Awake 😊");
            closedEyeFrames.current = 0;
            eyeAlertSpoken.current = false;

            if (sirenPlaying.current && sirenAudioRef.current) {
              sirenAudioRef.current.pause();
              sirenPlaying.current = false;
              setIsAlertActive(false);
            }
          }

          if (smoothMAR > YAWN_THRESHOLD_LOW) {
            setStatus("Yawning 😮");

            if (!yawnAlertSpoken.current) {
              speak("You seem tired, take a break");
              yawnAlertSpoken.current = true;

              if (onDrowsinessAlert) {
                onDrowsinessAlert({
                  id: Date.now().toString(),
                  type: "yawn",
                  message: "Yawning detected",
                  severity: "medium",
                  time: new Date().toLocaleTimeString(),
                });
              }
            }
          } else if (smoothMAR < YAWN_THRESHOLD_HIGH) {
            yawnAlertSpoken.current = false;
          }

          // Draw landmarks
          canvasCtx.fillStyle = "rgba(0, 0, 0, 0)";
          [
            33, 160, 158, 133, 153, 144, 263, 387, 385, 362, 380, 373, 61, 291,
            13, 14, 78, 308,
          ].forEach((i) => {
            const x = landmarks[i].x * canvasRef.current.width;
            const y = landmarks[i].y * canvasRef.current.height;
            canvasCtx.beginPath();
            canvasCtx.arc(x, y, 2, 0, 2 * Math.PI);
            canvasCtx.fill();
          });

          return; // exit early since face detected inside yaw range
        }

        // If here, yaw outside threshold → consider as no face detected

        setStatus("No face detected");
        closedEyeFrames.current = 0;
        eyeAlertSpoken.current = false;
        yawnAlertSpoken.current = false;

        if (!noFaceAlertSpoken.current) {
          speak("Keep eyes on the road");
          noFaceAlertSpoken.current = true;
        }

        if (sirenPlaying.current && sirenAudioRef.current) {
          sirenAudioRef.current.pause();
          sirenPlaying.current = false;
          setIsAlertActive(false);
        }
      } else {
        // No face detected at all
        setStatus("No face detected");
        closedEyeFrames.current = 0;
        eyeAlertSpoken.current = false;
        yawnAlertSpoken.current = false;

        if (!noFaceAlertSpoken.current) {
          speak("Keep eyes on the road");
          noFaceAlertSpoken.current = true;
        }

        if (sirenPlaying.current && sirenAudioRef.current) {
          sirenAudioRef.current.pause();
          sirenPlaying.current = false;
          setIsAlertActive(false);
        }
      }

      canvasCtx.restore();
    }

    loadFaceMesh();

    return () => {
      if (camera) camera.stop();
      if (sirenAudioRef.current) {
        sirenAudioRef.current.pause();
        setIsAlertActive(false);
      }
    };
  }, []); // run once on mount

  return (
    <>
      <div style={{ textAlign: "center" }}>
        <video ref={videoRef} style={{ display: "none" }} muted playsInline />
        <canvas
          ref={canvasRef}
          width="550"
          height="350"
          className="rounded"
          style={{ display: "inline-block" }}
        />
        <div
          style={{
            marginTop: 8,
            fontWeight: "bold",
            fontSize: 18,
            color: "#333",
          }}
        >
          {status}
        </div>

        <div style={{ marginTop: 20, display: "inline-block" }}>
          {/* You can add FocusMeter here if you want */}
        </div>
      </div>

      {isAlertActive && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            pointerEvents: "none",
            backgroundColor: "#ff0000",
            animation: "blinkNeonRed 1s infinite",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 30,
            flexDirection: "row",
            userSelect: "none",
            padding: "0 20px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: 0,
            }}
          >
            <div
              style={{
                color: "#ffff33",
                fontSize: "6rem",
                fontWeight: "900",
                textShadow: "0 0 3px #ffff33, 0 0 6px #ffff00",
                fontFamily: "Arial, sans-serif",
                lineHeight: 1,
              }}
            >
              ALERT
            </div>
            <div
              style={{
                color: "#ffff33",
                fontSize: "2.5rem",
                fontWeight: "700",
                textShadow: "0 0 2px #ffff33, 0 0 4px #ffff00",
                fontFamily: "Arial, sans-serif",
                marginTop: "-10px",
              }}
            >
              WARNING
            </div>
          </div>

          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="150"
            viewBox="0 0 24 24"
            width="150"
            fill="#ffff33"
            style={{
              filter:
                "drop-shadow(0 0 2px #ffff33) drop-shadow(0 0 4px #ffff00)",
            }}
          >
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
          </svg>
        </div>
      )}

      <style>{`
        @keyframes blinkNeonRed {
          0%, 100% {
            background-color: #660000;
            box-shadow:
              0 0 80px 50px #990000,
              0 0 120px 80px #cc0000,
              0 0 160px 110px #ff0000,
              0 0 200px 140px #ff3333;
          }
          50% {
            background-color: #ff0000;
            box-shadow:
              0 0 160px 100px #ff1a1a,
              0 0 220px 140px #ff4d4d,
              0 0 280px 180px #ff6666,
              0 0 340px 220px #ff9999;
          }
        }
      `}</style>
    </>
  );
}
