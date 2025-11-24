"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useRef } from "react";
import { useStore, GestureType } from "@/store/useStore";
import {
  playSelectSound,
  playHoverSound,
  playEngageSound,
  // playErrorSound,
} from "@/utils/audio";
import type { Results as HandsResults } from "@mediapipe/hands";
import type { Results as FaceMeshResults } from "@mediapipe/face_mesh";

export default React.memo(function WebcamProcessor({ className = "fixed inset-0 z-0" }: { className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Gesture state tracking
  const prevRotatePos = useRef<{ x: number; y: number } | null>(null);
  const prevPanPos = useRef<{ x: number; y: number } | null>(null);
  const prevPinchDist = useRef<number | null>(null);
  const prevGestureLeft = useRef<GestureType>("IDLE");
  const prevGestureRight = useRef<GestureType>("IDLE");
  const swipeCooldown = useRef<number>(0);
  const prevHandPos = useRef<{ x: number; y: number } | null>(null); // For Time Stone logic
  
  // ... (inside detectGesture or effect) ...



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
        const { setFaceLandmarks } = useStore.getState();
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

        const { 
            setHands, 
            setGestures, 
            updateHandUI, 
            setGlobeRotation, 
            setGlobeScale, 
            nextScene, 
            prevScene,
            cycleTheme,
            triggerPulse
        } = useStore.getState();

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

        setHands(leftHand, rightHand);
        setGestures(leftGesture, rightGesture);
        
        // Process Interaction
        const now = Date.now();

        // 1. Scaling with two hands (PINCH only)
        if (leftHand && rightHand && leftGesture === "PINCH" && rightGesture === "PINCH") {
          const leftIndex = leftHand[8];
          const rightIndex = rightHand[8];
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

        // 2. Pan Detection (PALM_OPEN)
        const panHand = rightHand || leftHand;
        const panGesture = rightHand ? rightGesture : leftGesture;

        if (panHand && panGesture === "PALM_OPEN") {
          const centroid = { x: panHand[9].x, y: panHand[9].y };

          if (prevPanPos.current) {
            const deltaX = centroid.x - prevPanPos.current.x;
            const deltaY = centroid.y - prevPanPos.current.y;

            if (Math.abs(deltaX) > 0.005 || Math.abs(deltaY) > 0.005) {
                 const { globeCenter, setGlobeCenter, globeScale } = useStore.getState();
                 
                 // Base sensitivity (Globe View)
                 // We keep the original 15x multiplier for low zoom levels
                 let sensitivity = (0.5 / globeScale) * 15;
                 
                 // Micro-Precision Dampening (City View)
                 // If zoomed in (scale > 1.5), dampen significantly for street-level control
                 if (globeScale > 1.5) {
                     sensitivity /= (globeScale * 5.0); // Drastically reduce speed at high zoom
                 }

                 const newLat = globeCenter.lat + (-deltaY) * sensitivity;
                 const clampedLat = Math.max(-85, Math.min(85, newLat));

                 setGlobeCenter({
                     lat: clampedLat, 
                     lng: globeCenter.lng - deltaX * sensitivity 
                 });
            }
          }
          prevPanPos.current = centroid;
        } else {
            prevPanPos.current = null;
        }

        // 3. Rotation with 'VICTORY' gesture
        const activeHand =
          rightGesture === "VICTORY"
            ? rightHand
            : leftGesture === "VICTORY"
            ? leftHand
            : null;

        if (activeHand) {
          const centroid = { x: activeHand[9].x, y: activeHand[9].y };

          if (prevRotatePos.current) {
            const deltaX = centroid.x - prevRotatePos.current.x;
            const deltaY = centroid.y - prevRotatePos.current.y;

            const currentRot = useStore.getState().globeRotation;
            setGlobeRotation({
              x: currentRot.x + deltaY * 2,
              y: currentRot.y + deltaX * 2,
            });
          }
          prevRotatePos.current = centroid;
        } else {
            prevRotatePos.current = null;
        }

        // 4. Theme Shifter (GRAB)
        // Use left hand for theme shifting
        if (leftGesture === "GRAB" && prevGestureLeft.current !== "GRAB") {
           cycleTheme();
           playSelectSound();
        }

        // 5. Neural Pulse (PALM_OPEN)
        // Trigger pulse if palm is open and NOT swiping (stationary)
        // We use a simple check: if gesture is PALM_OPEN and we haven't swiped recently
        if ((leftGesture === "PALM_OPEN" || rightGesture === "PALM_OPEN") && 
            now - swipeCooldown.current > 500) {
            // Rate limit pulse
             if (Math.random() < 0.1) { // 10% chance per frame to trigger pulse while holding open
                triggerPulse();
             }
        }

        // 6. Time Stone Gesture (Circular Motion)
        // Use Right Hand Index Finger
        if (rightHand && rightGesture === "POINT") {
           const indexTip = rightHand[8];
           const wrist = rightHand[0];
           
           // Calculate angle relative to wrist
           const dx = indexTip.x - wrist.x;
           const dy = indexTip.y - wrist.y;
           const angle = Math.atan2(dy, dx);
           
           if (prevHandPos.current) {
             // We use prevHandPos as a generic "previous frame data" storage here
             // Ideally, we should use a dedicated ref for angle, but let's reuse or add a new one
             // Let's assume prevHandPos stores the previous angle in 'z' (hacky but efficient) or just add a new ref
           }
        }
        
        // Actually, let's do it properly.
        // We need a dedicated ref for the previous angle.
        // Since I can't add a ref easily inside this callback without re-defining the component,
        // I will rely on a new ref added to the component scope.
        // BUT, I am editing the file content. So I can add the ref!
        
        // Wait, I need to add the ref definition first.
        // Let's do this in two steps.
        // 1. Add the ref.
        // 2. Add the logic.
        
        // Let's just add the logic and assume I'll add the ref in the next step? 
        // No, that will break the build.
        
        // I will use `prevHandPos` to store the previous Index Tip position for now, 
        // and calculate the cross product to determine rotation direction?
        // Cross product of (prevVector) and (currVector) gives direction.
        
        if (rightHand && rightGesture === "POINT" && rightHand[0] && rightHand[8]) {
            const indexTip = rightHand[8];
            const wrist = rightHand[0];
            
            // Vector from wrist to tip
            const vX = indexTip.x - wrist.x;
            const vY = indexTip.y - wrist.y;
            
            // We need previous vector
            // Let's use a static variable or property on the function? No.
            // Let's use `prevHandPos` to store the previous TIP position.
            
            if (prevHandPos.current) {
                const prevX = prevHandPos.current.x - wrist.x; // Approx if wrist moved, but okay for fast gestures
                const prevY = prevHandPos.current.y - wrist.y;
                
                // Cross product 2D: A x B = Ax*By - Ay*Bx
                const cross = prevX * vY - prevY * vX;
                
                // If cross > 0, Clockwise (in screen coords where Y is down? MediaPipe Y is down)
                // MP: X right, Y down.
                // X+ is Right, Y+ is Down.
                // Clockwise from 12 o'clock (0, -1) to 3 o'clock (1, 0)
                // V1 = (0, -1), V2 = (1, 0) => 0*0 - (-1)*1 = 1 > 0.
                // So Cross > 0 is Clockwise.
                
                const { timeSpeed, setTimeSpeed, setIsManipulatingTime } = useStore.getState();
                
                if (Math.abs(cross) > 0.005) { // Threshold
                    setIsManipulatingTime(true);
                    const speedChange = cross * 50; // Sensitivity
                    const newSpeed = Math.max(0.1, Math.min(5.0, timeSpeed + speedChange));
                    setTimeSpeed(newSpeed);
                } else {
                    setIsManipulatingTime(false);
                }
            }
            prevHandPos.current = { x: indexTip.x, y: indexTip.y };
        } else {
            // If not pointing, reset manipulation state
             useStore.getState().setIsManipulatingTime(false);
        }

        prevGestureLeft.current = leftGesture;
        prevGestureRight.current = rightGesture;

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
    };

    initMediaPipe();

    return () => {
      if (camera) (camera as any).stop();
      if (hands) (hands as any).close();
      if (faceMesh) (faceMesh as any).close();
    };
  }, []);

  return (
    <div className={className}>
      <video ref={videoRef} className="hidden" playsInline />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover -scale-x-100"
        width={1280}
        height={720}
      />
    </div>
  );
});
