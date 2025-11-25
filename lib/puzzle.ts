// lib/puzzle.ts
import { v4 as uuidv4 } from 'uuid';

export function generatePuzzle() {
  const id = uuidv4();
  const shapes = ['circle', 'square', 'triangle'].sort(() => Math.random() - 0.5);  // Random order for puzzle
  return { id, shapes };
}