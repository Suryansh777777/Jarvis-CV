"use client";

import { useEffect, useRef } from "react";
import { useStore, GestureType } from "@/store/useStore";
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
    globeScale 
  } = useStore();
  
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
      const { Hands } = await import("@mediapipe/hands");
      const { FaceMesh } = await import("@mediapipe/face_mesh");

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
        
        // Draw only the video feed (clean look)
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

        let leftHand = null;
        let rightHand = null;
        let leftGesture: GestureType = 'IDLE';
        let rightGesture: GestureType = 'IDLE';

        if (results.multiHandLandmarks) {
          for (const [index, landmarks] of results.multiHandLandmarks.entries()) {
            const label = results.multiHandedness[index]?.label;
            const gesture = detectGesture(landmarks);
            
            // Update Hand UI Position (Palm Center)
            // Landmark 9 is the middle finger knuckle, usually stable center of palm
            const palmX = landmarks[9].x;
            const palmY = landmarks[9].y;

            if (label === 'Left') {
              leftHand = landmarks;
              leftGesture = gesture;
              updateHandUI('left', { 
                visible: true, 
                x: palmX, 
                y: palmY,
                gesture: gesture
              });
            }
            if (label === 'Right') {
              rightHand = landmarks;
              rightGesture = gesture;
              updateHandUI('right', { 
                visible: true, 
                x: palmX, 
                y: palmY,
                gesture: gesture
              });
            }
          }
        }

        // Hide UI if hand lost
        if (!leftHand) updateHandUI('left', { visible: false });
        if (!rightHand) updateHandUI('right', { visible: false });

        setHands(leftHand, rightHand);
        setGestures(leftGesture, rightGesture);
        processInteraction(leftHand, rightHand, leftGesture, rightGesture);
        
        canvasCtx.restore();
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
            return Math.hypot(tip.x - wrist.x, tip.y - wrist.y) > Math.hypot(pipMark.x - wrist.x, pipMark.y - wrist.y);
        };

        const indexExt = isExtended(indexTip, 6);
        const middleExt = isExtended(middleTip, 10);
        const ringExt = isExtended(ringTip, 14);
        const pinkyExt = isExtended(pinkyTip, 18);

        // Distance between thumb and index
        const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);

        if (pinchDist < 0.05) return 'PINCH';
        
        if (indexExt && middleExt && ringExt && pinkyExt) return 'PALM_OPEN';
        
        if (!indexExt && !middleExt && !ringExt && !pinkyExt) return 'GRAB';
        
        if (indexExt && !middleExt && !ringExt && !pinkyExt) return 'POINT';
        
        if (indexExt && middleExt && !ringExt && !pinkyExt) return 'VICTORY';

        return 'IDLE';
      }

      function processInteraction(
        left: any[] | null, 
        right: any[] | null, 
        leftGesture: GestureType, 
        rightGesture: GestureType
      ) {
        // 1. Scaling with two hands (Pinch or Open Palm)
        if (left && right) {
          const leftIndex = left[8];
          const rightIndex = right[8];
          const dist = Math.hypot(leftIndex.x - rightIndex.x, leftIndex.y - rightIndex.y);

          if (prevPinchDist.current !== null) {
            const delta = dist - prevPinchDist.current;
            if (Math.abs(delta) > 0.01) {
               setGlobeScale(Math.max(0.5, Math.min(3, useStore.getState().globeScale + delta * 2)));
            }
          }
          prevPinchDist.current = dist;
        } else {
          prevPinchDist.current = null;
        }

        // 2. Rotation with 'GRAB' gesture (Right Hand primarily)
        const activeHand = rightGesture === 'GRAB' ? right : (leftGesture === 'GRAB' ? left : null);
        
        if (activeHand) {
          const centroid = { x: activeHand[9].x, y: activeHand[9].y };

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
    };

    initMediaPipe();

    return () => {
      if (camera) camera.stop();
      if (hands) hands.close();
      if (faceMesh) faceMesh.close();
    };
  }, []);

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
