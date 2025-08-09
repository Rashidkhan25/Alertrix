import React, { useEffect, useRef, useState } from "react";
import FocusMeter from "../hud/focus-meter";

export default function WebcamPreview({ onDrowsinessAlert, onFocusChange }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const lastEarRef = useRef(null);
  const lastFocusPercentRef = useRef(null);

  const STABLE_TIME_MS = 2000; // 2 seconds stable time required
  const BLINK_MAX_FRAMES = 12; // max frames considered as a blink (~400ms at 30fps)
  const MAX_CLOSED_FRAMES = 30 * 10; // 10 seconds max closed eye duration

  const [status, setStatus] = useState("");
  const [isAlertActive, setIsAlertActive] = useState(false);

  const EAR_THRESHOLD_LOW = 0.25;
  const EAR_THRESHOLD_HIGH = 0.28;

  const CLOSED_EYE_FRAME_5S = 10 * 4;
  const CLOSED_EYE_FRAME_10S = 10 * 8;

  // Yawning detection thresholds
  const MAR_THRESHOLD = 0.6; // mouth aspect ratio threshold for yawning
  const YAWN_FRAME_THRESHOLD = 15; // frames required to confirm yawning (~0.5s at 30fps)

  // Head-turn thresholds using degrees (±90 degrees)
  // We will calculate headYaw and headPitch in degrees, so threshold is 90 degrees
  const HEAD_TURN_ANGLE_THRESHOLD = 90;

  const closedEyeFrames = useRef(0);
  const eyeAlertSpoken = useRef(false);
  const sirenPlaying = useRef(false);
  const sirenAudioRef = useRef(null);

  const yawnFrames = useRef(0);
  const yawnAlertSpoken = useRef(false);

  const earBuffer = useRef([]);

  // New refs for head turn and no face detection alerts
  const headTurnAlertSpoken = useRef(false);
  const headTurnCooldown = useRef(false);

  const noFaceAlertSpoken = useRef(false);
  const noFaceCooldown = useRef(false);

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
    // Mouth landmarks indices for MAR calculation
    const p61 = landmarks[61];
    const p291 = landmarks[291];
    const p78 = landmarks[78];
    const p308 = landmarks[308];
    const p13 = landmarks[13];
    const p14 = landmarks[14];
    const p311 = landmarks[311];
    const p81 = landmarks[81];

    const vertical1 = distance(p13, p14);
    const vertical2 = (distance(p61, p311) + distance(p291, p81)) / 2;
    const horizontal = distance(p78, p308);

    return (vertical1 + vertical2) / (2.0 * horizontal);
  }

  function earToFocusPercent(ear) {
    const minEAR = 0.15;
    const maxEAR = 0.35;
    const clampedEAR = Math.min(Math.max(ear, minEAR), maxEAR);
    const normalized = (clampedEAR - minEAR) / (maxEAR - minEAR);
    return Math.round(normalized * 100);
  }

  function speak(text) {
    if (!window.speechSynthesis) return;
    console.log("Speaking:", text); // debug
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    try {
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("speechSynthesis failed:", e);
    }
  }

  // NEW function to calculate approximate yaw angle in degrees from landmarks
  // Using nose tip and cheeks X coords (0 to 1), compute head yaw roughly:
  // yawDegrees: negative = left turn, positive = right turn
  function getHeadYawDegrees(landmarks) {
    const noseX = landmarks[1].x;
    const leftCheekX = landmarks[33].x;
    const rightCheekX = landmarks[263].x;
    const faceWidth = rightCheekX - leftCheekX || 1e-6;
    const nosePosNorm = (noseX - leftCheekX) / faceWidth; // normalized 0 to 1

    // Map nosePosNorm from [0,1] to approx yaw angle [-90,90]
    // 0 means fully left, 1 means fully right, 0.5 center
    const yaw = (nosePosNorm - 0.5) * 2 * HEAD_TURN_ANGLE_THRESHOLD; // -90 to 90 degrees

    return yaw;
  }

  // NEW function to calculate approximate pitch angle in degrees from landmarks
  // Using nose tip, forehead and chin Y coords
  // pitchDegrees: negative = looking up, positive = looking down
  function getHeadPitchDegrees(landmarks) {
    // landmark 10 ~ upper forehead, 152 ~ chin, 1 ~ nose tip
    const noseY = landmarks[1].y;
    const foreheadY = landmarks[10].y;
    const chinY = landmarks[152].y;
    const faceHeight = chinY - foreheadY || 1e-6;
    // normalized nose position relative to face vertical center (0..1)
    const nosePosNorm = (noseY - foreheadY) / faceHeight; // 0 = top, 1 = bottom
    // map normalized position to [-90, 90], center at 0.5 -> 0 deg
    const pitch = (nosePosNorm - 0.5) * 2 * HEAD_TURN_ANGLE_THRESHOLD;
    return pitch;
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

      const framesThreshold = Math.round(STABLE_TIME_MS / (1000 / 30));

      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        // face detected — reset no-face counters/flags
        noFaceAlertSpoken.current = false;
        noFaceCooldown.current = false;

        const landmarks = results.multiFaceLandmarks[0];

        // --- HEAD TURN logic updated (yaw OR pitch) ---
        const headYaw = getHeadYawDegrees(landmarks);
        const headPitch = getHeadPitchDegrees(landmarks);

        // trigger if yaw or pitch beyond threshold
        if (
          Math.abs(headYaw) >= HEAD_TURN_ANGLE_THRESHOLD ||
          Math.abs(headPitch) >= HEAD_TURN_ANGLE_THRESHOLD
        ) {
          

          if (!headTurnAlertSpoken.current && !headTurnCooldown.current) {
            if (onDrowsinessAlert) {
              onDrowsinessAlert({
                id: Date.now().toString(),
                type: "head_turn",
                message:
                  "Please keep your eyes on the road! Head turned too far.",
                severity: "high",
                time: new Date().toLocaleTimeString(),
              });
            }
            speak("Keep your eyes on the road");
            headTurnAlertSpoken.current = true;
            headTurnCooldown.current = true;
            setTimeout(() => {
              headTurnCooldown.current = false;
            }, 5000);
          }
        } else {
          // Head back within normal range: reset alert flags
          headTurnAlertSpoken.current = false;
        }
        // --- END HEAD TURN logic ---

        // ... rest of your existing onResults face detected logic ...

        const leftEAR = calculateEAR(landmarks, true);
        const rightEAR = calculateEAR(landmarks, false);
        const currentEAR = (leftEAR + rightEAR) / 2;

        if (earBuffer.current.length >= 5) earBuffer.current.shift();
        earBuffer.current.push(currentEAR);

        const smoothEAR = average(earBuffer.current);

        // Yawning detection
        const mar = calculateMAR(landmarks);

        if (mar > MAR_THRESHOLD) {
          yawnFrames.current += 1;
        } else {
          yawnFrames.current = 0;
          yawnAlertSpoken.current = false;
        }

        // Track closed eye frames for drowsiness detection
        if (smoothEAR < EAR_THRESHOLD_LOW) {
          closedEyeFrames.current += 1;
        } else if (smoothEAR > EAR_THRESHOLD_HIGH) {
          closedEyeFrames.current = 0;
          eyeAlertSpoken.current = false;

          if (sirenPlaying.current && sirenAudioRef.current) {
            sirenAudioRef.current.pause();
            sirenPlaying.current = false;
            setIsAlertActive(false);
          }
        }

        // Focus percent smoothing logic with blink ignored
        const focusPercentRaw = earToFocusPercent(smoothEAR);
        const alpha = 0.1; // smoothing factor

        if (lastFocusPercentRef.current === null) {
          lastFocusPercentRef.current = focusPercentRaw;
        } else {
          if (closedEyeFrames.current <= BLINK_MAX_FRAMES) {
            // Blink detected: do NOT decrease focus, gently recover focus towards 100%
            lastFocusPercentRef.current =
              lastFocusPercentRef.current * (1 - alpha) + 100 * alpha;
          } else {
            // Eyes closed longer than blink threshold: smooth focus towards EAR%
            lastFocusPercentRef.current =
              lastFocusPercentRef.current * (1 - alpha) +
              focusPercentRaw * alpha;
          }
        }

        const finalFocusPercent = Math.round(lastFocusPercentRef.current);

        if (onFocusChange) {
          onFocusChange(finalFocusPercent);
        }

        // Update status messages and alerts based on closed eye duration
        if (closedEyeFrames.current > BLINK_MAX_FRAMES) {
          if (
            closedEyeFrames.current >= CLOSED_EYE_FRAME_5S &&
            closedEyeFrames.current < CLOSED_EYE_FRAME_10S
          ) {
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
        } else if (smoothEAR > EAR_THRESHOLD_HIGH && yawnFrames.current === 0) {
          // not sleepy
        }

        // Yawning alert and status
        if (yawnFrames.current >= YAWN_FRAME_THRESHOLD) {
          if (!yawnAlertSpoken.current) {
            speak("You seem sleepy , take a break");
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
        }

        // Draw key landmarks
        canvasCtx.fillStyle = "rgba(0, 0, 0, 0)";
        [33, 160, 158, 133, 153, 144, 263, 387, 385, 362, 380, 373].forEach(
          (i) => {
            const x = landmarks[i].x * canvasRef.current.width;
            const y = landmarks[i].y * canvasRef.current.height;
            canvasCtx.beginPath();
            canvasCtx.arc(x, y, 2, 0, 2 * Math.PI);
            canvasCtx.fill();
          }
        );

        // Draw Yawning Text on canvas if yawning
        if (yawnFrames.current >= YAWN_FRAME_THRESHOLD) {
          canvasCtx.font = "30px Arial";
          canvasCtx.fillStyle = "orange";
          canvasCtx.fillText("", 10, 50);
        }
      } else {
        // No face detected
        // note: per your request, don't speak "Keep your eyes on the road" here

        if (!noFaceAlertSpoken.current && !noFaceCooldown.current) {
          if (onDrowsinessAlert) {
            onDrowsinessAlert({
              id: Date.now().toString(),
              type: "no_face",
              message: "No face detected! Please keep your eyes on the road.",
              severity: "high",
              time: new Date().toLocaleTimeString(),
            });
          }
          // speak removed intentionally
          noFaceAlertSpoken.current = true;
          noFaceCooldown.current = true;
          setTimeout(() => {
            noFaceCooldown.current = false;
          }, 5000);
        }

        closedEyeFrames.current = 0;
        eyeAlertSpoken.current = false;
        yawnFrames.current = 0;
        yawnAlertSpoken.current = false;

        if (sirenPlaying.current && sirenAudioRef.current) {
          sirenAudioRef.current.pause();
          sirenPlaying.current = false;
          setIsAlertActive(false);
        }

        if (onFocusChange) {
          onFocusChange(0); // no face, no focus
        }

        lastFocusPercentRef.current = 0;
        headTurnAlertSpoken.current = false;
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
          height="330"
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
