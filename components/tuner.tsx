'use client';

import type { FC } from 'react';

import { cn } from '@/lib/utils';
import { PitchDetector } from 'pitchy';
import { useMemo, useState } from 'react';
import { Analyser, UserMedia, context, start } from 'tone';

const standardGuitarTuning = {
  A2: 110,
  B3: 246.94,
  D3: 146.83,
  E2: 82.41,
  E4: 329.63,
  G3: 196,
} as const;
// Amount of range in Hz we render on the screen around the tuning pitch
const range = 50;
// Amount of Hz considered to be in tune
const deviation = 1;

type Tuning = typeof standardGuitarTuning;
type Note = keyof typeof standardGuitarTuning;
type TuningEntries = [Note, (typeof standardGuitarTuning)[Note]][];

const getClosestNote = (pitch: number, tuning: Tuning): Note | null => {
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
  const [note, setNote] = useState<Note | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
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
        const closestNote = getClosestNote(pitch, standardGuitarTuning);

        if (closestNote !== null) {
          const tuning = standardGuitarTuning[closestNote];
          const difference = Math.abs(tuning - pitch);
          const isInTune = difference <= deviation;

          setIsInTune(isInTune);
        }

        setNote(closestNote);
        setPitch(pitch);
      }

      setIsCapturing(isCaptureRange);
      requestAnimationFrame(getPitch);
    };

    getPitch();
  };
  const handleStart = () => detectPitch();
  const handleStop = () => {
    setIsListening(false);
    setPitch(null);
  };
  const frequencies = useMemo(
    () => Array.from({ length: range + 1 }, (_, i) => i - range / 2),
    [],
  );
  const tuningPitch = note ? standardGuitarTuning[note] : 0;
  const cursorPosition = useMemo(
    () =>
      pitch
        ? (((Number(pitch.toFixed(1)) - tuningPitch) / range) * 100) / 2 + 50
        : 0,
    [pitch, tuningPitch],
  );

  return (
    <div className="grid min-w-80 items-center justify-center gap-12">
      {isListening ? (
        <>
          <div className="grid gap-12">
            <p
              className={cn(
                'text-center text-9xl font-bold transition',
                isInTune ? 'text-success' : 'text-muted-foreground',
                !isCapturing && 'opacity-0',
              )}
            >
              {note?.charAt(0) ?? '-'}
            </p>
            <div>
              <div className="flex items-center gap-3">
                {frequencies.map((frequency) => (
                  <div
                    className={cn('h-4 w-0.5 rounded transition', {
                      'bg-gray-300': frequency !== 0,
                      'h-6 bg-gray-500': frequency % 5 === 0 && frequency !== 0,
                      'h-8 bg-primary': frequency === 0,
                      'scale-75 opacity-75': !isCapturing,
                    })}
                    key={frequency}
                  />
                ))}
              </div>
              <div
                className={cn(
                  'absolute top-1/2 h-16 w-2 -translate-x-1/2 -translate-y-1/2 rounded transition',
                  {
                    'scale-95 opacity-0': !isCapturing || !note,
                  },
                  isInTune ? 'bg-success' : 'bg-muted-foreground',
                )}
                style={{ left: `${cursorPosition}%` }}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <p className="text-center tabular-nums">
              Pitch: {pitch?.toFixed(2)} Hz
            </p>
            <p className="text-center tabular-nums">
              Tuning: {tuningPitch.toFixed(2)} Hz
            </p>
            <p className="text-center tabular-nums">
              Position: {cursorPosition.toFixed(2)} %
            </p>

            <button onClick={handleStop}>Stop</button>
          </div>
        </>
      ) : (
        <button onClick={handleStart}>Start</button>
      )}
    </div>
  );
};
