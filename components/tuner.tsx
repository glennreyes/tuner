'use client';

import type { Mode, Note } from '@/lib/modes';
import type { FC } from 'react';

import { modes } from '@/lib/modes';
import { getClosestNote, hzToCents, range } from '@/lib/pitch';
import { cn } from '@/lib/utils';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { PitchDetector } from 'pitchy';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Analyser, Meter, UserMedia, context, start } from 'tone';

import { Button } from './ui/button';
import { Progress } from './ui/progress';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './ui/select';

// Volume ranges in dB
const minVolume = -48;
const maxVolume = -12;
// Amount of Hz considered to be in tune
const deviation = 1;
const bars = Array.from({ length: range / 2 + 1 }, (_, i) => i - range / 4);

export const Tuner: FC = () => {
  const requestId = useRef<number>();
  const [mode, setMode] = useState<Mode>('chromatic');
  const [pitch, setPitch] = useState<null | number>(null);
  const [note, setNote] = useState<Note | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [volume, setVolume] = useState(0);
  const [isInTune, setIsInTune] = useState(false);
  const [device, setDevice] = useState<string | undefined>();
  const tuning = modes[mode];
  const detectPitch = useCallback(async () => {
    await start();
    const analyser = new Analyser('waveform', 2048);
    const meter = new Meter();
    const microphone = await new UserMedia()
      .connect(analyser)
      .connect(meter)
      .open();
    const devices = await navigator.mediaDevices.enumerateDevices();
    const deviceName = devices.find(
      (device) => device.deviceId === microphone.deviceId,
    )?.label;

    setDevice(deviceName);

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
        const closestNote = getClosestNote(pitch, mode);

        if (closestNote !== null) {
          const referencePitch = tuning[closestNote];
          const difference = referencePitch
            ? Math.abs(referencePitch - pitch)
            : 0;
          const isInTune = difference <= deviation;

          setIsInTune(isInTune);
        }

        setNote(closestNote);
        setPitch(pitch);
      } else if (pitch) {
        setPitch(0);
      }

      setIsCapturing(isCaptureRange);
      requestId.current = requestAnimationFrame(getPitch);
    };

    getPitch();
  }, [mode, tuning]);

  useEffect(() => {
    if (isListening) {
      (() => detectPitch())();
    }

    return () => {
      if (requestId.current) {
        cancelAnimationFrame(requestId.current);
      }
    };
  }, [detectPitch, isListening]);

  const handleStart = () => {
    setIsListening(true);
  };
  const handleValueChange = (value: string) => {
    setMode(value);

    if (requestId.current) {
      cancelAnimationFrame(requestId.current);
    }
  };
  const tuningPitch = note ? tuning[note] : 0;
  const cents = pitch && tuningPitch ? hzToCents(pitch, tuningPitch) : 0;

  return (
    <div>
      <div
        className={cn('grid items-center gap-12', {
          'opacity-25': !isListening,
        })}
      >
        <div className="grid gap-12">
          <p
            className={cn(
              'text-center text-8xl font-semibold',
              isInTune ? 'text-success' : 'text-muted-foreground',
              {
                'opacity-0': !isCapturing || !note,
              },
            )}
          >
            {note ?? '-'}
          </p>
          <div className="grid gap-4">
            <div className="flex justify-between text-muted">
              <div className="flex-1 text-left">-50</div>
              <div className="text-center">0</div>
              <div className="flex-1 text-right">+50</div>
            </div>
            <div>
              <div
                className={cn('flex items-end justify-between transition', {
                  'opacity-50 delay-500': !isCapturing || !note,
                })}
              >
                {bars.map((bar) => (
                  <div key={bar}>
                    <div
                      className={cn(
                        'h-8 w-px rounded sm:w-0.5',
                        bar === 0
                          ? 'h-12 bg-primary'
                          : bar % 5 === 0
                            ? 'h-10 bg-gray-500'
                            : 'bg-gray-300',
                      )}
                    />
                  </div>
                ))}
              </div>
              <div
                className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-center transition duration-75"
                style={{ transform: `translate(${cents}%, -50%)` }}
              >
                <div
                  className={cn(
                    'h-20 w-1 shadow-xl shadow-secondary/25 transition-all',
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
            className={cn(
              'text-center text-5xl tabular-nums text-primary transition',
              {
                'duration-400 opacity-50 delay-500': !isCapturing || !note,
              },
            )}
          >
            {Math.round(cents)} ct
          </p>

          <p
            className={cn('text-center tabular-nums text-primary transition', {
              'duration-400 opacity-50 delay-500': !isCapturing || !note,
            })}
          >
            {(pitch ?? 0).toFixed(1)} Hz
          </p>
        </div>
        <div className="grid gap-4">
          <div className="flex justify-between gap-2">
            <Select
              disabled={!isListening}
              onValueChange={handleValueChange}
              value={mode}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="chromatic">Chromatic</SelectItem>
                </SelectGroup>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel>Guitar</SelectLabel>
                  <SelectItem value="guitarStandard">Standard</SelectItem>
                  <SelectItem value="guitarDropD">Drop D</SelectItem>
                </SelectGroup>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel>Ukulele</SelectLabel>
                  <SelectItem value="ukuleleStandard">Standard</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              {device ? (
                <Mic className="h-5 w-5 text-muted-foreground" />
              ) : (
                <MicOff className="h-5 w-5 text-muted-foreground" />
              )}
              <p className="truncate text-sm text-muted-foreground">{device}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-muted-foreground" />
            <Progress value={volume} />
          </div>
        </div>
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
