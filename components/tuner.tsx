'use client';

import type { PitchDetector } from 'pitchfinder/lib/detectors/types';
import type { FC } from 'react';

import { Note } from '@tonaljs/tonal';
import { YIN } from 'pitchfinder';
import { useRef, useState } from 'react';
import { Meter, UserMedia, Waveform } from 'tone';

const standardTuning = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'] as const;
const frequencyToNote = (frequency: ReturnType<PitchDetector>) => {
  if (!frequency) {
    return '-';
  }

  // Convert frequency to a note name
  const note = Note.fromFreq(frequency);

  // If the conversion isn't successful, return 'No Note'
  if (!note) {
    return 'No Note';
  }

  // eslint-disable-next-line unicorn/no-array-reduce
  return standardTuning.reduce((closestNote, tuningNote) => {
    const currentNoteFreq = Note.freq(tuningNote);
    const closestNoteFreq = Note.freq(closestNote);
    const currentDiff = Math.abs(currentNoteFreq ?? 0 - frequency);
    const closestDiff = Math.abs(closestNoteFreq ?? 0 - frequency);

    return currentDiff < closestDiff ? tuningNote : closestNote;
  }, '-');
};

export const Tuner: FC = () => {
  const [isMicOpen, setIsMicOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState('');
  const mic = useRef<UserMedia>();
  const turnOn = async () => {
    const meter = new Meter();
    const analyzer = new Waveform();

    mic.current = new UserMedia().connect(meter).connect(analyzer);
    await mic.current.open();
    setIsMicOpen(true);

    const detectPitch = () => {
      const detect = YIN();
      const updatePitch = () => {
        const waveform = analyzer.getValue();
        const frequency = detect(waveform);
        const note = frequencyToNote(frequency);

        setCurrentNote(note);
        requestAnimationFrame(updatePitch);
      };

      requestAnimationFrame(updatePitch);
    };

    detectPitch();
  };
  const turnOff = () => {
    mic.current?.close();
    setIsMicOpen(false);
  };
  const handleClick = isMicOpen ? turnOff : turnOn;

  return (
    <div className="grid gap-2">
      <button onClick={handleClick}>
        {isMicOpen ? 'Turn off' : 'Turn on'}
      </button>
      <p className="text-center text-sm">{isMicOpen ? 'Mic on' : 'Mic off'}</p>
      <p className="text-9xl font-bold">{isMicOpen ? currentNote : '-'}</p>
    </div>
  );
};
