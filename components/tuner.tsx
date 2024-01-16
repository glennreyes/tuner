'use client';

import { PitchDetector } from 'pitchy';
import React, { useCallback, useState } from 'react';
import { Analyser, UserMedia, context, start } from 'tone';

const isSilent = (data: Float32Array) => {
  const sumOfSquares = data.reduce((accumulator, currentValue) => {
    return accumulator + currentValue * currentValue;
  }, 0);
  const rootMeanSquare = Math.sqrt(sumOfSquares / data.length);

  return rootMeanSquare < 0.01;
};

export const Tuner: React.FC = () => {
  const [pitch, setPitch] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const detectPitch = useCallback(async () => {
    if (isListening) {
      return;
    }

    setIsListening(true);

    await start();
    const analyser = new Analyser('waveform', 2048);
    const microphone = new UserMedia().connect(analyser);

    await microphone.open();

    const getPitch = () => {
      const dataArray = analyser.getValue() as Float32Array;

      if (!isSilent(dataArray)) {
        const frequency = PitchDetector.forFloat32Array(analyser.size);
        const [pitch] = frequency.findPitch(dataArray, context.sampleRate);

        setPitch(pitch);
      }

      requestAnimationFrame(getPitch);
    };

    getPitch();
  }, [isListening]);
  const handleStart = () => detectPitch();
  const handleStop = () => {
    setIsListening(false);
    setPitch(null);
  };

  return (
    <div>
      <h1>Pitch Detector</h1>
      <button disabled={isListening} onClick={handleStart}>
        Start
      </button>
      <button disabled={!isListening} onClick={handleStop}>
        Stop
      </button>
      {pitch !== null && <p>Detected Pitch: {pitch.toFixed(2)} Hz</p>}
    </div>
  );
};
