"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef } from "react";
import { useStore, GestureType } from "@/store/useStore";
import {
  playSelectSound,
  playHoverSound,
  playEngageSound,
  // playErrorSound,
} from "@/utils/audio";
import type { Results as HandsResults } from "@mediapipe/hands";
import type { Results as FaceMeshResults } from "@mediapipe/face_mesh";

export default function WebcamProcessor() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    setFaceLandmarks,
    setHands,
    setGestures,
    setGlobeRotation,
    setGlobeScale,
    updateHandUI,
    nextScene,
    prevScene,
  } = useStore();

  // Gesture state tracking
  const prevHandPos = useRef<{ x: number; y: number } | null>(null);
  const prevPinchDist = useRef<number | null>(null);
  const prevGestureLeft = useRef<GestureType>("IDLE");
  const prevGestureRight = useRef<GestureType>("IDLE");
  const swipeCooldown = useRef<number>(0);

  useEffect(() => {
    let camera: any = null;
    let hands: any = null;
    let faceMesh: any = null;

    const initMediaPipe = async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const videoElement = videoRef.current;
      const canvasElement = canvasRef.current;
      const canvasCtx = canvasElement.getContext("2d");

      if (!canvasCtx) return;

      // Dynamic imports
      const { Camera } = await import("@mediapipe/camera_utils");
      const { Hands, HAND_CONNECTIONS } = await import("@mediapipe/hands");
      const { FaceMesh } = await import("@mediapipe/face_mesh");
      const { drawConnectors, drawLandmarks } = await import(
        "@mediapipe/drawing_utils"
      );

      // Initialize Hands
      hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        },
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });

      hands.onResults(onHandsResults);

      // Initialize FaceMesh
      faceMesh = new FaceMesh({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        },
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults(onFaceResults);

      // Camera setup
      camera = new Camera(videoElement, {
        onFrame: async () => {
          if (faceMesh) await faceMesh.send({ image: videoElement });
          if (hands) await hands.send({ image: videoElement });
        },
        width: 1280,
        height: 720,
      });

      camera.start();

      function onFaceResults(results: FaceMeshResults) {
        if (
          results.multiFaceLandmarks &&
          results.multiFaceLandmarks.length > 0
        ) {
          setFaceLandmarks(results.multiFaceLandmarks[0]);
        } else {
          setFaceLandmarks(null);
        }
      }

      function onHandsResults(results: HandsResults) {
        if (!canvasCtx) return;
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

        // Draw only the video feed (clean look)
        canvasCtx.drawImage(
          results.image,
          0,
          0,
          canvasElement.width,
          canvasElement.height
        );

        // Draw Face HUD if available
        const faceLandmarks = useStore.getState().faceLandmarks;
        if (faceLandmarks) {
          drawFaceHUD(canvasCtx, faceLandmarks);
        }

        let leftHand = null;
        let rightHand = null;
        let leftGesture: GestureType = "IDLE";
        let rightGesture: GestureType = "IDLE";

        if (results.multiHandLandmarks) {
          for (const [
            index,
            landmarks,
          ] of results.multiHandLandmarks.entries()) {
            // Draw Sci-Fi Skeleton
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
              color: "rgba(0, 243, 255, 0.6)",
              lineWidth: 2,
            });
            drawLandmarks(canvasCtx, landmarks, {
              color: "rgba(255, 255, 255, 0.8)",
              fillColor: "rgba(0, 243, 255, 0.8)",
              radius: 2,
              lineWidth: 1,
            });

            const label = results.multiHandedness[index]?.label;
            const gesture = detectGesture(landmarks);

            // Update Hand UI Position (Palm Center)
            // Landmark 9 is the middle finger knuckle, usually stable center of palm
            const palmX = landmarks[9].x;
            const palmY = landmarks[9].y;

            if (label === "Left") {
              leftHand = landmarks;
              leftGesture = gesture;
              updateHandUI("left", {
                visible: true,
                x: palmX,
                y: palmY,
                gesture: gesture,
              });
            }
            if (label === "Right") {
              rightHand = landmarks;
              rightGesture = gesture;
              updateHandUI("right", {
                visible: true,
                x: palmX,
                y: palmY,
                gesture: gesture,
              });
            }
          }
        }

        // Hide UI if hand lost
        if (!leftHand) updateHandUI("left", { visible: false });
        if (!rightHand) updateHandUI("right", { visible: false });

        // Sound Effects on Gesture Change
        if (leftGesture !== prevGestureLeft.current && leftGesture !== "IDLE") {
          if (leftGesture === "GRAB") playEngageSound();
          else playSelectSound();
        }
        if (
          rightGesture !== prevGestureRight.current &&
          rightGesture !== "IDLE"
        ) {
          if (rightGesture === "GRAB") playEngageSound();
          else playSelectSound();
        }

        prevGestureLeft.current = leftGesture;
        prevGestureRight.current = rightGesture;

        setHands(leftHand, rightHand);
        setGestures(leftGesture, rightGesture);
        processInteraction(leftHand, rightHand, leftGesture, rightGesture);

        canvasCtx.restore();
      }

      function drawFaceHUD(ctx: CanvasRenderingContext2D, landmarks: any[]) {
        const connect = (i1: number, i2: number) => {
          const p1 = landmarks[i1];
          const p2 = landmarks[i2];
          ctx.beginPath();
          ctx.moveTo(p1.x * ctx.canvas.width, p1.y * ctx.canvas.height);
          ctx.lineTo(p2.x * ctx.canvas.width, p2.y * ctx.canvas.height);
          ctx.stroke();
        };

        ctx.strokeStyle = "rgba(0, 243, 255, 0.4)";
        ctx.lineWidth = 1;

        // Center Line
        connect(10, 152);

        // Eye Visors
        // Left Eye Loop (approximate)
        ctx.beginPath();
        [33, 160, 158, 133, 153, 144].forEach((idx, i) => {
          const p = landmarks[idx];
          const x = p.x * ctx.canvas.width;
          const y = p.y * ctx.canvas.height;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.stroke();

        // Right Eye Loop
        ctx.beginPath();
        [362, 385, 387, 263, 373, 380].forEach((idx, i) => {
          const p = landmarks[idx];
          const x = p.x * ctx.canvas.width;
          const y = p.y * ctx.canvas.height;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.stroke();

        // Bounding Box / Target Lock
        const x = landmarks[234].x * ctx.canvas.width; // Left cheek
        const y = landmarks[10].y * ctx.canvas.height; // Top head
        const w = (landmarks[454].x - landmarks[234].x) * ctx.canvas.width; // Width
        const h = (landmarks[152].y - landmarks[10].y) * ctx.canvas.height; // Height

        ctx.strokeStyle = "rgba(0, 243, 255, 0.8)";
        ctx.lineWidth = 2;
        const pad = 20;

        // Corners only
        const bx = x - pad;
        const by = y - pad;
        const bw = w + pad * 2;
        const bh = h + pad * 2;
        const len = 20;

        ctx.beginPath();
        // TL
        ctx.moveTo(bx, by + len);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx + len, by);
        // TR
        ctx.moveTo(bx + bw - len, by);
        ctx.lineTo(bx + bw, by);
        ctx.lineTo(bx + bw, by + len);
        // BL
        ctx.moveTo(bx, by + bh - len);
        ctx.lineTo(bx, by + bh);
        ctx.lineTo(bx + len, by + bh);
        // BR
        ctx.moveTo(bx + bw - len, by + bh);
        ctx.lineTo(bx + bw, by + bh);
        ctx.lineTo(bx + bw, by + bh - len);
        ctx.stroke();

        // Label
        ctx.font = "12px 'Share Tech Mono'";
        ctx.fillStyle = "rgba(0, 243, 255, 0.9)";
        ctx.fillText("TARGET LOCKED", bx, by - 5);
      }

      function detectGesture(landmarks: any[]): GestureType {
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const middleTip = landmarks[12];
        const ringTip = landmarks[16];
        const pinkyTip = landmarks[20];

        const wrist = landmarks[0];

        // Helper to check if finger is extended (tip further from wrist than PIP)
        const isExtended = (tip: any, pip: number) => {
          const pipMark = landmarks[pip];
          return (
            Math.hypot(tip.x - wrist.x, tip.y - wrist.y) >
            Math.hypot(pipMark.x - wrist.x, pipMark.y - wrist.y)
          );
        };

        const indexExt = isExtended(indexTip, 6);
        const middleExt = isExtended(middleTip, 10);
        const ringExt = isExtended(ringTip, 14);
        const pinkyExt = isExtended(pinkyTip, 18);

        // Distance between thumb and index
        const pinchDist = Math.hypot(
          thumbTip.x - indexTip.x,
          thumbTip.y - indexTip.y
        );

        if (pinchDist < 0.05) return "PINCH";

        if (indexExt && middleExt && ringExt && pinkyExt) return "PALM_OPEN";

        if (!indexExt && !middleExt && !ringExt && !pinkyExt) return "GRAB";

        if (indexExt && !middleExt && !ringExt && !pinkyExt) return "POINT";

        if (indexExt && middleExt && !ringExt && !pinkyExt) return "VICTORY";

        return "IDLE";
      }

      function processInteraction(
        left: any[] | null,
        right: any[] | null,
        leftGesture: GestureType,
        rightGesture: GestureType
      ) {
        const now = Date.now();

        // 1. Scaling with two hands (Pinch or Open Palm)
        if (left && right) {
          const leftIndex = left[8];
          const rightIndex = right[8];
          const dist = Math.hypot(
            leftIndex.x - rightIndex.x,
            leftIndex.y - rightIndex.y
          );

          if (prevPinchDist.current !== null) {
            const delta = dist - prevPinchDist.current;
            if (Math.abs(delta) > 0.01) {
              setGlobeScale(
                Math.max(
                  0.5,
                  Math.min(3, useStore.getState().globeScale + delta * 2)
                )
              );
            }
          }
          prevPinchDist.current = dist;
        } else {
          prevPinchDist.current = null;
        }

        // 2. Swipe Detection (PALM_OPEN)
        // Use right hand for swipe
        const swipeHand = right || left;
        const swipeGesture = right ? rightGesture : leftGesture;

        if (swipeHand && swipeGesture === "PALM_OPEN") {
          const centroid = { x: swipeHand[9].x, y: swipeHand[9].y };

          if (prevHandPos.current) {
            const deltaX = centroid.x - prevHandPos.current.x;

            // Threshold for swipe
            if (Math.abs(deltaX) > 0.15 && now - swipeCooldown.current > 1000) {
              if (deltaX > 0) {
                // Swipe Right (move hand left to right) -> Previous Scene
                prevScene();
                playHoverSound();
              } else {
                // Swipe Left (move hand right to left) -> Next Scene
                nextScene();
                playHoverSound();
              }
              swipeCooldown.current = now;
            }
          }
          // We just ensure we are not grabbing
          // Note: swipeGesture is 'PALM_OPEN' here, so it can't be 'GRAB',
          // but we update position for the next frame's velocity calculation.
          prevHandPos.current = centroid;
        }

        // 3. Rotation with 'GRAB' gesture (Right Hand primarily)
        const activeHand =
          rightGesture === "GRAB"
            ? right
            : leftGesture === "GRAB"
            ? left
            : null;

        if (activeHand) {
          const centroid = { x: activeHand[9].x, y: activeHand[9].y };

          if (prevHandPos.current) {
            const deltaX = centroid.x - prevHandPos.current.x;
            const deltaY = centroid.y - prevHandPos.current.y;

            const currentRot = useStore.getState().globeRotation;
            setGlobeRotation({
              x: currentRot.x + deltaY * 5,
              y: currentRot.y + deltaX * 5,
            });
          }
          prevHandPos.current = centroid;
        } else {
          // If not grabbing, and not swiping (handled above), reset
          if (!activeHand && (!swipeHand || swipeGesture !== "PALM_OPEN")) {
            prevHandPos.current = null;
          }
        }
      }
    };

    initMediaPipe();

    return () => {
      if (camera) (camera as any).stop();
      if (hands) (hands as any).close();
      if (faceMesh) (faceMesh as any).close();
    };
  }, [
    nextScene,
    prevScene,
    setFaceLandmarks,
    setGestures,
    setGlobeRotation,
    setGlobeScale,
    setHands,
    updateHandUI,
  ]);

  return (
    <div className="fixed inset-0 z-0">
      <video ref={videoRef} className="hidden" playsInline />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover -scale-x-100"
        width={1280}
        height={720}
      />
    </div>
  );
}
