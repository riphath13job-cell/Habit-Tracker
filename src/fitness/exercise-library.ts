import type { MuscleKey } from './muscle-data';

export interface BuiltInExercise {
  key: string;
  name: string;
  muscle: MuscleKey;
  tip: string;
}

export const EXERCISE_LIBRARY: BuiltInExercise[] = [
  { key: 'bench-press', name: 'Bench Press', muscle: 'chest', tip: 'Lower to mid-chest, elbows about 45°.' },
  { key: 'incline-bench', name: 'Incline Bench Press', muscle: 'chest', tip: 'Bench at ~30° for the upper chest.' },
  { key: 'push-up', name: 'Push-Up', muscle: 'chest', tip: 'Straight line from head to heels.' },
  { key: 'chest-dip', name: 'Chest Dip', muscle: 'chest', tip: 'Lean forward slightly to bias the chest.' },
  { key: 'cable-fly', name: 'Cable Fly', muscle: 'chest', tip: 'Squeeze at the center, elbows soft.' },

  { key: 'overhead-press', name: 'Overhead Press', muscle: 'shoulders', tip: 'Brace your core, press straight up.' },
  { key: 'lateral-raise', name: 'Lateral Raise', muscle: 'shoulders', tip: 'Lead with elbows, stop at shoulder height.' },
  { key: 'face-pull', name: 'Face Pull', muscle: 'shoulders', tip: 'Pull toward the forehead, squeeze rear delts.' },
  { key: 'pike-push-up', name: 'Pike Push-Up', muscle: 'shoulders', tip: 'Hips high, head toward the floor.' },

  { key: 'barbell-curl', name: 'Barbell Curl', muscle: 'biceps', tip: 'Elbows pinned to your sides.' },
  { key: 'hammer-curl', name: 'Hammer Curl', muscle: 'biceps', tip: 'Neutral grip hits the brachialis.' },
  { key: 'chin-up', name: 'Chin-Up', muscle: 'biceps', tip: 'Palms facing you, chin over bar.' },
  { key: 'preacher-curl', name: 'Preacher Curl', muscle: 'biceps', tip: 'Full stretch at the bottom.' },

  { key: 'triceps-pushdown', name: 'Triceps Pushdown', muscle: 'triceps', tip: 'Lock out fully, elbows tight.' },
  { key: 'skullcrusher', name: 'Skullcrusher', muscle: 'triceps', tip: 'Lower behind the head to stretch.' },
  { key: 'overhead-extension', name: 'Overhead Extension', muscle: 'triceps', tip: 'Elbows point forward, not out.' },
  { key: 'close-grip-bench', name: 'Close-Grip Bench', muscle: 'triceps', tip: 'Shoulder-width grip, tuck elbows.' },

  { key: 'wrist-curl', name: 'Wrist Curl', muscle: 'forearms', tip: 'Slow tempo through full range.' },
  { key: 'farmer-carry', name: 'Farmer Carry', muscle: 'forearms', tip: 'Crush the handles and stand tall.' },
  { key: 'dead-hang', name: 'Dead Hang', muscle: 'forearms', tip: 'Great finisher and grip builder.' },

  { key: 'plank', name: 'Plank', muscle: 'abs', tip: 'Squeeze glutes, never sag hips.' },
  { key: 'crunch', name: 'Crunch', muscle: 'abs', tip: 'Curl ribs to pelvis, exhale hard.' },
  { key: 'hanging-leg-raise', name: 'Hanging Leg Raise', muscle: 'abs', tip: 'Legs past parallel, no swinging.' },
  { key: 'ab-wheel', name: 'Ab Wheel Rollout', muscle: 'abs', tip: 'Roll only as far as the back stays flat.' },

  { key: 'russian-twist', name: 'Russian Twist', muscle: 'obliques', tip: 'Rotate shoulders, not just arms.' },
  { key: 'side-plank', name: 'Side Plank', muscle: 'obliques', tip: 'Stack feet, push hips high.' },
  { key: 'cable-side-bend', name: 'Cable Side Bend', muscle: 'obliques', tip: 'Bend sideways only, no leaning.' },

  { key: 'pull-up', name: 'Pull-Up', muscle: 'lats', tip: 'Drive elbows down to your ribs.' },
  { key: 'lat-pulldown', name: 'Lat Pulldown', muscle: 'lats', tip: 'Chest up, pull to upper chest.' },
  { key: 'bent-over-row', name: 'Bent-Over Row', muscle: 'lats', tip: 'Row toward your belly button.' },
  { key: 'seated-row', name: 'Seated Cable Row', muscle: 'lats', tip: 'Squeeze the shoulder blades.' },

  { key: 'shrug', name: 'Shrug', muscle: 'traps', tip: 'Straight up, pause a beat at the top.' },
  { key: 'rack-pull', name: 'Rack Pull', muscle: 'traps', tip: 'Heavy top-half deadlift; brace hard.' },

  { key: 'deadlift', name: 'Deadlift', muscle: 'lower_back', tip: 'Push the floor away, bar over mid-foot.' },
  { key: 'good-morning', name: 'Good Morning', muscle: 'lower_back', tip: 'Hinge back, light weight, flat back.' },
  { key: 'back-extension', name: 'Back Extension', muscle: 'lower_back', tip: 'Raise to a straight line, no hyperextend.' },

  { key: 'hip-thrust', name: 'Hip Thrust', muscle: 'glutes', tip: 'Full lockout, ribs down, squeeze hard.' },
  { key: 'glute-bridge', name: 'Glute Bridge', muscle: 'glutes', tip: 'Drive through the heels.' },
  { key: 'cable-kickback', name: 'Cable Kickback', muscle: 'glutes', tip: 'Slow and controlled, no arching.' },

  { key: 'squat', name: 'Back Squat', muscle: 'quads', tip: 'Brace, sit between the hips, knees out.' },
  { key: 'goblet-squat', name: 'Goblet Squat', muscle: 'quads', tip: 'Elbows inside knees at the bottom.' },
  { key: 'leg-press', name: 'Leg Press', muscle: 'quads', tip: 'Lower until thighs reach parallel.' },
  { key: 'lunge', name: 'Walking Lunge', muscle: 'quads', tip: 'Long steps bias quads and glutes.' },
  { key: 'leg-extension', name: 'Leg Extension', muscle: 'quads', tip: 'Pause one second at full extension.' },

  { key: 'romanian-deadlift', name: 'Romanian Deadlift', muscle: 'hamstrings', tip: 'Push hips back, soft knees, flat back.' },
  { key: 'leg-curl', name: 'Leg Curl', muscle: 'hamstrings', tip: 'Control the lowering half slowly.' },
  { key: 'nordic-curl', name: 'Nordic Curl', muscle: 'hamstrings', tip: 'Resist the fall as long as possible.' },

  { key: 'standing-calf-raise', name: 'Standing Calf Raise', muscle: 'calves', tip: 'Deep stretch at bottom, no bounce.' },
  { key: 'seated-calf-raise', name: 'Seated Calf Raise', muscle: 'calves', tip: 'Bent knee isolates the soleus.' },
];
