import type { Mode, Note, Pitch } from './modes';

import { modes } from './modes';

// Amount of range in cents rendered on the screen around the tuning pitch
export const range = 100;

type TuningEntries = [Note, Pitch][];

export const hzToCents = (frequency: number, referenceFrequency: number) =>
  1200 * Math.log2(frequency / referenceFrequency);

export const centsToHz = (cents: number, referenceFrequency: number) =>
  referenceFrequency * Math.pow(2, cents / 1200);

export const getClosestNote = (pitch: number, mode: Mode): Note | null => {
  const closest: { difference: number; note: Note | null } = {
    difference: Number.POSITIVE_INFINITY,
    note: null,
  };
  const tuning = modes[mode];
  const entries = Object.entries(tuning) as TuningEntries;

  for (const [note, frequency] of entries) {
    const difference = Math.abs(frequency - pitch);

    if (difference < closest.difference) {
      closest.note = note;
      closest.difference = difference;
    }
  }

  if (!closest.note) {
    return null;
  }

  const tuningPitch = tuning[closest.note];
  const rangeInHz = Math.abs(
    centsToHz(range / 2, tuning[closest.note]) - tuningPitch,
  );

  return rangeInHz && closest.difference <= rangeInHz ? closest.note : null;
};
