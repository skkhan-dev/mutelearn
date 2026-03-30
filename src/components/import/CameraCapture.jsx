import React, { useRef, useState } from 'react';
import Button from '../shared/Button';
import Card from '../shared/Card';
import { useMediaCapture } from '../../hooks/useMediaCapture';

export default function CameraCapture({ onCapture }) {
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const { cameraActive, startCamera, stopCamera, takePhoto } = useMediaCapture();
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);

  const handleStartCamera = async () => {
    try {
      setError(null);
      await startCamera(videoRef);
    } catch {
      setError('Could not access camera. Please check permissions or use the upload option below.');
    }
  };

  const handleTakePhoto = () => {
    const imageData = takePhoto(videoRef);
    if (imageData) {
      setCapturedImage(imageData);
      stopCamera();
      onCapture?.(imageData);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target.result;
      setCapturedImage(imageData);
      onCapture?.(imageData);
    };
    reader.readAsDataURL(file);
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
      {/* Camera Preview / Captured Image */}
      <Card className="overflow-hidden">
        {capturedImage ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-[var(--text-secondary,#6b7280)]">
              Captured Photo
            </p>
            <img
              src={capturedImage}
              alt="Captured notes"
              className="w-full rounded-lg object-contain max-h-80"
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRetake}>
                Retake
              </Button>
            </div>
          </div>
        ) : cameraActive ? (
          <div className="space-y-3">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full rounded-lg bg-gray-900"
            />
            <div className="flex gap-2 justify-center">
              <Button onClick={handleTakePhoto} size="lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                Take Photo
              </Button>
              <Button variant="ghost" onClick={stopCamera}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-16 h-16 rounded-full bg-[var(--accent,#6366f1)]/10 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[var(--accent,#6366f1)]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-medium text-[var(--text-primary,#111827)]">
                Snap a photo of your notes
              </p>
              <p className="text-sm text-[var(--text-secondary,#6b7280)] mt-1">
                Take a picture of handwritten notes, textbook pages, or whiteboard content
              </p>
            </div>
            <Button onClick={handleStartCamera}>
              Open Camera
            </Button>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}
          </div>
        )}
      </Card>

      {/* File Upload Fallback */}
      {!capturedImage && (
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--text-primary,#111827)]">
                Or upload an image
              </p>
              <p className="text-xs text-[var(--text-secondary,#6b7280)]">
                JPG, PNG, or HEIC files supported
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              Upload
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </Card>
      )}
    </div>
  );
}
