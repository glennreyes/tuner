'use client';

import type { FC } from 'react';

import { cn } from '@/lib/utils';
import { PitchDetector } from 'pitchy';
import { useState } from 'react';
import { Analyser, UserMedia, context, start } from 'tone';

const standardGuitarTuning = {
  A2: 110,
  B3: 246.94,
  D3: 146.83,
  E2: 82.41,
  E4: 329.63,
  G3: 196,
} as const;
const range = 50;

type Tuning = typeof standardGuitarTuning;
type Note = keyof typeof standardGuitarTuning;
type TuningEntries = [Note, (typeof standardGuitarTuning)[Note]][];

const getNearestNote = (pitch: number, tuning: Tuning): Note | null => {
  const closest: { difference: number; note: Note | null } = {
    difference: Number.POSITIVE_INFINITY,
    note: null,
  };
  const entries: TuningEntries = Object.entries(
    tuning,
  ) as unknown as TuningEntries;

  for (const [note, frequency] of entries) {
    const difference = Math.abs(frequency - pitch);

    if (difference < closest.difference) {
      closest.note = note;
      closest.difference = difference;
    }
  }

  return closest.difference <= range ? closest.note : null;
};

export const Tuner: FC = () => {
  const [pitch, setPitch] = useState<null | number>(null);
  const [note, setNote] = useState<null | string>(null);
  const [isListening, setIsListening] = useState(false);
  const [isInTune, setIsInTune] = useState(false);
  const detectPitch = async () => {
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
      const frequency = PitchDetector.forFloat32Array(analyser.size);
      const [pitch, clarity] = frequency.findPitch(
        dataArray,
        context.sampleRate,
      );
      const isCaptureRange = pitch !== 0 && clarity > 0.95;

      if (isCaptureRange) {
        const nearestNote = getNearestNote(pitch, standardGuitarTuning);

        if (nearestNote !== null) {
          const deviation = 5;
          const tuning = standardGuitarTuning[nearestNote];
          const difference = Math.abs(tuning - pitch);
          const isInTune = difference <= deviation;

          setIsInTune(isInTune);
        }

        setNote(nearestNote);
        setPitch(pitch);
      }

      requestAnimationFrame(getPitch);
    };

    getPitch();
  };
  const handleStart = () => detectPitch();
  const handleStop = () => {
    setIsListening(false);
    setPitch(null);
  };
  const frequencies = Array.from(
    { length: range + 1 },
    (_, i) => i - range / 2,
  );

  return (
    <div className="grid min-w-80 items-center justify-center gap-8">
      {!isListening && (
        <button disabled={isListening} onClick={handleStart}>
          Start
        </button>
      )}
      {isListening && (
        <>
          <div className="grid gap-4">
            <p
              className={cn(
                'text-center text-9xl font-bold',
                isInTune ? 'text-success' : 'text-primary',
                !note && 'opacity-0',
              )}
            >
              {note?.charAt(0) ?? '-'}
            </p>
            <div>
              <div className="flex items-center gap-3">
                {frequencies.map((frequency) => (
                  <div
                    className={cn('h-4 w-0.5', {
                      'bg-gray-300': frequency !== 0,
                      'h-6 bg-gray-500': frequency % 5 === 0 && frequency !== 0,
                      'h-8 bg-primary': frequency === 0,
                    })}
                    key={frequency}
                  />
                ))}
              </div>
              <div className="-ml-1/2 absolute left-1/2 top-0 h-full w-1 bg-primary" />
            </div>
          </div>
          <div className="grid gap-2">
            <p className="text-center tabular-nums">{pitch?.toFixed(2)} Hz</p>
            <button onClick={handleStop}>Stop</button>
          </div>
        </>
      )}
    </div>
  );
};
