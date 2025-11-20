"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/store/useStore";
import type { Results as HandsResults } from "@mediapipe/hands";
import type { Results as FaceMeshResults } from "@mediapipe/face_mesh";

export default function WebcamProcessor() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { setFaceLandmarks, setHands, setGlobeRotation, setGlobeScale, globeRotation, globeScale } = useStore();
  
  // Gesture state tracking
  const prevHandPos = useRef<{ x: number; y: number } | null>(null);
  const prevPinchDist = useRef<number | null>(null);

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
      const { drawConnectors, drawLandmarks } = await import("@mediapipe/drawing_utils");

      // Initialize Hands
      hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        },
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
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
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
          setFaceLandmarks(results.multiFaceLandmarks[0]);
        } else {
          setFaceLandmarks(null);
        }
      }

      function onHandsResults(results: HandsResults) {
        if (!canvasCtx) return;
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

        let leftHand = null;
        let rightHand = null;

        if (results.multiHandLandmarks) {
          for (const [index, landmarks] of results.multiHandLandmarks.entries()) {
            // Draw landmarks
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
            drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 1, radius: 3 });

            // Determine handedness
            const label = results.multiHandedness[index]?.label;
            
            if (label === 'Left') leftHand = landmarks;
            if (label === 'Right') rightHand = landmarks;
          }
        }

        setHands(leftHand, rightHand);
        processGestures(leftHand, rightHand);
        
        canvasCtx.restore();
      }

      function processGestures(left: any[] | null, right: any[] | null) {
        // 1. Scaling: Both hands available
        if (left && right) {
          const leftIndex = left[8];
          const rightIndex = right[8];
          const dist = Math.hypot(leftIndex.x - rightIndex.x, leftIndex.y - rightIndex.y);

          if (prevPinchDist.current !== null) {
            const delta = dist - prevPinchDist.current;
            if (Math.abs(delta) > 0.01) {
              // Scale factor
               setGlobeScale(Math.max(0.5, Math.min(3, useStore.getState().globeScale + delta * 2)));
            }
          }
          prevPinchDist.current = dist;
        } else {
          prevPinchDist.current = null;
        }

        // 2. Rotation: Using Right Hand
        const activeHand = right || left; 
        if (activeHand) {
          const thumbTip = activeHand[4];
          const middleTip = activeHand[12];
          
          // Check for "grab"
          const grabDist = Math.hypot(thumbTip.x - middleTip.x, thumbTip.y - middleTip.y);
          const isGrabbing = grabDist < 0.1;

          if (isGrabbing) {
            const centroid = { x: activeHand[9].x, y: activeHand[9].y }; // Wrist/Palm area

            if (prevHandPos.current) {
              const deltaX = centroid.x - prevHandPos.current.x;
              const deltaY = centroid.y - prevHandPos.current.y;
              
              const currentRot = useStore.getState().globeRotation;
              setGlobeRotation({
                x: currentRot.x + deltaY * 5,
                y: currentRot.y + deltaX * 5
              });
            }
            prevHandPos.current = centroid;
          } else {
            prevHandPos.current = null;
          }
        }
      }
    };

    initMediaPipe();

    return () => {
      // Cleanup not easily possible with MediaPipe instances as they don't have stop/dispose readily available 
      // in all versions, but camera.stop() exists.
      if (camera) camera.stop();
      if (hands) hands.close();
      if (faceMesh) faceMesh.close();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0">
      {/* Hidden Video for MediaPipe */}
      <video ref={videoRef} className="hidden" playsInline />
      
      {/* Canvas for visualization (mirrored) */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full object-cover -scale-x-100"
        width={1280}
        height={720}
      />
    </div>
  );
}
