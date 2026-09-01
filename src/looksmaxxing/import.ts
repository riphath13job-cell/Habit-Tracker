// One-tap import helpers: turn looksmaxxing templates/methods into
// daily routines in the Routines app, then jump the user straight there.

import {
  addDailyRoutineItem,
  createDailyRoutine,
  createNote,
  listDailyRoutines,
} from '../db';
import { navigationRef } from '../hub/navigation';
import type { Note } from '../types';
import type { LooksmaxxingMethod } from './study';
import type { LooksmaxxingTemplate } from './templates';

export interface ImportResult {
  id: number;
  created: boolean;
}

/** Creates the routine (or reuses one with the same name) and returns its id. */
export async function importTemplateAsRoutine(
  template: LooksmaxxingTemplate,
): Promise<ImportResult> {
  const existing = (await listDailyRoutines()).find((r) => r.name === template.name);
  if (existing) return { id: existing.id, created: false };
  const routine = await createDailyRoutine(template.name, template.emoji);
  for (const item of template.items) {
    await addDailyRoutineItem(routine.id, item);
  }
  return { id: routine.id, created: true };
}

/** Turns a Study method's steps into a daily routine called "emoji Title". */
export async function importMethodAsRoutine(
  method: LooksmaxxingMethod,
): Promise<ImportResult> {
  const name = `${method.emoji} ${method.title}`;
  const existing = (await listDailyRoutines()).find((r) => r.name === name);
  if (existing) return { id: existing.id, created: false };
  const routine = await createDailyRoutine(name, method.emoji);
  for (const step of method.steps.slice(0, 6)) {
    await addDailyRoutineItem(routine.id, step.charAt(0).toUpperCase() + step.slice(1));
  }
  return { id: routine.id, created: true };
}

/** Save a template as a Note in the Notes app. */
export async function saveTemplateAsNote(template: LooksmaxxingTemplate): Promise<Note> {
  const body = `${template.description}\n\n${template.items
    .map((i) => `• ${i}`)
    .join('\n')}\n\n${template.notes}`;
  return createNote({ title: `${template.emoji} ${template.name}`, body });
}

/**
 * Reset navigation so the user lands inside the Routines app on the
 * routine they just imported, with back-swipe returning to the launcher.
 */
export function openRoutine(routineId: number) {
  if (!navigationRef.isReady()) return;
  navigationRef.reset({
    index: 2,
    routes: [
      { name: 'Launcher' },
      {
        name: 'RoutinesApp',
        state: {
          index: 1,
          routes: [
            { name: 'RoutineTabs' },
            { name: 'RoutineDetail', params: { id: routineId } },
          ],
        },
      },
    ],
  });
}

/** Jump straight into the Notes app's note list. */
export function openNotes() {
  if (!navigationRef.isReady()) return;
  navigationRef.reset({
    index: 2,
    routes: [
      { name: 'Launcher' },
      {
        name: 'NotesApp',
        state: {
          index: 1,
          routes: [{ name: 'NotesTabs' }],
        },
      },
    ],
  });
}