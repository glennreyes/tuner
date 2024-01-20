'use client';

import type { FC } from 'react';

import { cn } from '@/lib/utils';
import { PitchDetector } from 'pitchy';
import { useState } from 'react';
import { Analyser, Meter, UserMedia, context, start } from 'tone';

import { Button } from './ui/button';
import { Progress } from './ui/progress';

const standardGuitarTuning = {
  A2: 110,
  B3: 246.94,
  D3: 146.83,
  E2: 82.41,
  E4: 329.63,
  G3: 196,
} as const;
// Minimum and maximum volume values in dB
const minVolume = -48;
const maxVolume = -24;
// Amount of range in cents we render on the screen around the tuning pitch
const range = 100;
// Amount of Hz considered to be in tune
const deviation = 1;
const bars = Array.from({ length: range / 2 + 1 }, (_, i) => i - range / 4);

type Tuning = typeof standardGuitarTuning;
type Note = keyof typeof standardGuitarTuning;
type TuningEntries = [Note, (typeof standardGuitarTuning)[Note]][];

const hzToCents = (frequency: number, referenceFrequency: number) =>
  1200 * Math.log2(frequency / referenceFrequency);
const centsToHz = (cents: number, referenceFrequency: number) =>
  referenceFrequency * Math.pow(2, cents / 1200);
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

  const tuningPitch = closest.note ? tuning[closest.note] : 0;
  const rangeInHz = closest.note
    ? Math.abs(centsToHz(range / 2, tuning[closest.note]) - tuningPitch)
    : null;

  return rangeInHz && closest.difference <= rangeInHz ? closest.note : null;
};

export const Tuner: FC = () => {
  const [pitch, setPitch] = useState<null | number>(null);
  const [note, setNote] = useState<Note | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [volume, setVolume] = useState(0);
  const [isInTune, setIsInTune] = useState(false);
  const detectPitch = async () => {
    if (isListening) {
      return;
    }

    setIsListening(true);

    await start();
    const analyser = new Analyser('waveform', 2048);
    const meter = new Meter();
    const microphone = new UserMedia().connect(analyser).connect(meter);

    await microphone.open();

    const getPitch = () => {
      const dataArray = analyser.getValue() as Float32Array;
      const frequency = PitchDetector.forFloat32Array(analyser.size);
      const [pitch, clarity] = frequency.findPitch(
        dataArray,
        context.sampleRate,
      );
      const volumeDb = meter.getValue() as number;
      const inputVolume = Math.min(
        100,
        Math.max(0, ((volumeDb - minVolume) / (maxVolume - minVolume)) * 100),
      );

      setVolume(inputVolume);

      const isCaptureRange = pitch !== 0 && clarity > 0.96 && inputVolume !== 0;

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
  const tuningPitch = note ? standardGuitarTuning[note] : 0;
  const cents = pitch ? hzToCents(pitch, tuningPitch) : 0;

  return (
    <div
      className={cn(
        'grid min-w-80 items-center justify-center gap-12 rounded-3xl p-8 ring-1 transition',
        isListening
          ? 'bg-black/15 shadow-xl shadow-secondary/25 ring-primary/10'
          : 'ring-primary/5 hover:shadow-xl hover:shadow-secondary/10',
      )}
    >
      <div
        className={cn('grid min-w-80 items-center justify-center gap-12', {
          'opacity-25': !isListening,
        })}
      >
        <div className="grid gap-12">
          <p
            className={cn(
              'text-center text-9xl font-bold transition',
              isInTune ? 'text-success' : 'text-muted-foreground',
              {
                'duration-400 opacity-0 blur-lg delay-500':
                  !isCapturing || !note,
              },
            )}
          >
            {note?.charAt(0) ?? '-'}
          </p>
          <div className="grid gap-4">
            <div className="flex justify-between text-muted">
              <div className="flex-1 text-left">-50</div>
              <div className="text-center">0</div>
              <div className="flex-1 text-right">+50</div>
            </div>
            <div>
              <div
                className={cn('flex items-end gap-3 transition', {
                  'opacity-50 delay-500': !isCapturing || !note,
                })}
              >
                {bars.map((bar) => (
                  <div
                    className={cn('h-8 w-0.5 rounded', {
                      'bg-gray-300': bar !== 0,
                      'h-10 bg-gray-500': bar % 5 === 0 && bar !== 0,
                      'h-12 bg-primary': bar === 0,
                    })}
                    key={bar}
                  />
                ))}
              </div>
              <div
                className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-center transition duration-75"
                style={{ transform: `translate(${cents}%, -50%)` }}
              >
                <div
                  className={cn(
                    'h-20 w-2 rounded shadow-xl shadow-secondary/25 transition-all',
                    isInTune ? 'bg-success' : 'bg-muted-foreground',
                    !isCapturing || !note
                      ? 'scale-95 opacity-0 delay-500'
                      : 'opacity-95',
                  )}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-2">
          <p
            className={cn('text-center tabular-nums text-primary transition', {
              'duration-400 opacity-0 blur-lg delay-500': !isCapturing || !note,
            })}
          >
            {pitch ? `${pitch.toFixed(1)} Hz` : '-'}
          </p>
        </div>
        <Progress value={volume} />
      </div>
      <Button
        className={cn(
          'duration-400 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition',
          { 'pointer-events-none opacity-0 blur-2xl': isListening },
        )}
        onClick={handleStart}
        size="lg"
      >
        Start Tuning
      </Button>
    </div>
  );
};
