'use client';

import { useState } from 'react';

const minDecibels = -60; // Minimum decibels representing 0% volume
const maxDecibels = 0; // Maximum decibels representing 100% volume
const decibelsToPercentage = (decibels: number) =>
  ((decibels - minDecibels) / (maxDecibels - minDecibels)) * 100;
const tuning = {
  '82.41': 'E2',
  '110': 'A2',
  '146.83': 'D3',
  '196': 'G3',
  '246.94': 'B3',
  '329.63': 'E4',
} as const;

export const Tuner = () => {
  const [isListening, setIsListening] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [frequency, setFrequency] = useState(0);
  const [tone, setTone] = useState<(typeof tuning)[keyof typeof tuning] | null>(
    null,
  );
  const [volume, setVolume] = useState(0);
  const handleOn = async () => {
    const context = new AudioContext();
    const analyser = context.createAnalyser();

    analyser.fftSize = 2048;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const microphone = context.createMediaStreamSource(stream);

    microphone.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    const getData = () => {
      analyser.getFloatFrequencyData(dataArray);

      const { maxIndex, maxVolume } = dataArray.reduce(
        (acc, decibels, index) => {
          const volume = decibelsToPercentage(decibels);

          if (volume > acc.maxVolume) {
            return { maxIndex: index, maxVolume: volume };
          }

          return acc;
        },
        { maxIndex: -1, maxVolume: 0 },
      );
      const frequency = (maxIndex * context.sampleRate) / analyser.fftSize;
      const closestTone = Object.keys(tuning).reduce((prev, current) =>
        Math.abs(Number(current) - frequency) <
        Math.abs(Number(prev) - frequency)
          ? current
          : prev,
      ) as keyof typeof tuning;

      setTone(maxVolume ? tuning[closestTone] : null);
      setFrequency(maxVolume ? frequency : 0);
      setVolume(maxVolume);
      requestAnimationFrame(getData);
    };

    getData();
    setAudioContext(context);
    setIsListening(true);
  };
  const handleOff = async () => {
    await audioContext?.close();
    setAudioContext(null);
    setIsListening(false);
  };

  return (
    <div className="grid justify-center gap-2">
      <button onClick={isListening ? handleOff : handleOn}>
        {isListening ? 'End' : 'Start'}
      </button>
      <p className="text-center text-9xl font-bold tabular-nums">
        {tone ?? '-'}
      </p>
      <p className="text-center font-bold tabular-nums">
        {frequency.toFixed(2)} Hz
      </p>
      <p className="text-center font-bold">{volume.toFixed(2)}</p>
    </div>
  );
};
