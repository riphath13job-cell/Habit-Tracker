import type { MuscleKey } from './muscle-data';

export type ExerciseDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface ExerciseBookReference {
  key: string;
  name: string;
  /**
   * Rough muscle engagement as a percentage of its primary target (100 = the
   * movement is built around that muscle). Used for the engagement bars.
   */
  muscles: Partial<Record<MuscleKey, number>>;
  equipment: string[];
  difficulty: ExerciseDifficulty;
  instructions: string[];
  /** Curated YouTube how-to video, when we have one. */
  videoId?: string;
}

export const EXERCISE_BOOK: Record<string, ExerciseBookReference> = {
  'bench-press': {
    key: 'bench-press',
    name: 'Bench Press',
    muscles: { chest: 100, triceps: 65, shoulders: 55, lats: 20, forearms: 15 },
    equipment: ['barbell', 'bench'],
    difficulty: 'Intermediate',
    instructions: [
      'Lie on the bench with eyes under the bar, feet planted, and shoulder blades pulled back and down.',
      'Grip the bar just wider than shoulder width and unrack it over your shoulders.',
      'Lower the bar under control to mid-chest, elbows tucked at about 45°.',
      'Press the bar back up until your arms are straight.',
    ],
    videoId: 'hWbUlkb5Ms4',
  },
  'incline-bench': {
    key: 'incline-bench',
    name: 'Incline Bench Press',
    muscles: { chest: 100, shoulders: 65, triceps: 55, lats: 15 },
    equipment: ['barbell', 'bench'],
    difficulty: 'Intermediate',
    instructions: [
      'Set the bench to about a 30° incline.',
      'Lie back, feet planted, and grip the bar just wider than shoulder width.',
      'Lower the bar to your upper chest with elbows at about 45°.',
      'Press up and back toward the starting position, keeping your chest tall.',
    ],
  },
  'push-up': {
    key: 'push-up',
    name: 'Push-Up',
    muscles: { chest: 100, triceps: 55, shoulders: 45, abs: 60, obliques: 40, lats: 15 },
    equipment: ['bodyweight'],
    difficulty: 'Beginner',
    instructions: [
      'Start in a high plank with hands under shoulders and body in a straight line.',
      'Brace your core and glutes so your hips don\'t sag.',
      'Lower your chest to just above the floor with elbows at about 45°.',
      'Press back up to full arm extension.',
    ],
    videoId: 'IODxDxX7oi4',
  },
  'chest-dip': {
    key: 'chest-dip',
    name: 'Chest Dip',
    muscles: { chest: 100, triceps: 70, shoulders: 45, abs: 50, forearms: 20 },
    equipment: ['bodyweight'],
    difficulty: 'Advanced',
    instructions: [
      'Grip the parallel bars and press yourself up to a straight-arm support.',
      'Lean your torso forward slightly to bias the chest.',
      'Lower until your shoulders are about level with your elbows, elbows tracking back.',
      'Drive back up to a straight-arm finish.',
    ],
  },
  'cable-fly': {
    key: 'cable-fly',
    name: 'Cable Fly',
    muscles: { chest: 100, shoulders: 30, biceps: 15, abs: 25 },
    equipment: ['cable'],
    difficulty: 'Beginner',
    instructions: [
      'Set both pulleys at shoulder height and grab the handles.',
      'Step forward into a staggered stance, elbows slightly bent.',
      'Bring your hands together in a wide arc with a soft elbow bend.',
      'Squeeze your chest at the middle, then return under control.',
    ],
  },

  'overhead-press': {
    key: 'overhead-press',
    name: 'Overhead Press',
    muscles: { shoulders: 100, triceps: 60, abs: 55, chest: 30, traps: 20 },
    equipment: ['barbell'],
    difficulty: 'Intermediate',
    instructions: [
      'Stand with the bar at shoulder height, feet shoulder-width, grip just outside shoulders.',
      'Brace your core and squeeze your glutes.',
      'Press the bar straight up until your arms lock out, head moving slightly through.',
      'Lower the bar back to your shoulders under control.',
    ],
    videoId: 'UgzJF1UNp4Y',
  },
  'lateral-raise': {
    key: 'lateral-raise',
    name: 'Lateral Raise',
    muscles: { shoulders: 100, traps: 25, forearms: 15 },
    equipment: ['dumbbells'],
    difficulty: 'Beginner',
    instructions: [
      'Stand tall with a dumbbell in each hand at your sides.',
      'Lead with your elbows, raising your arms out to shoulder height.',
      'Keep a soft, fixed elbow bend throughout.',
      'Lower slowly and repeat without momentum.',
    ],
  },
  'face-pull': {
    key: 'face-pull',
    name: 'Face Pull',
    muscles: { shoulders: 100, traps: 50, lats: 25, biceps: 20, forearms: 30 },
    equipment: ['cable'],
    difficulty: 'Beginner',
    instructions: [
      'Set a rope on a cable at upper-chest height.',
      'Pull the rope toward your forehead, elbows high and wide.',
      'Squeeze your rear delts and upper back at the end position.',
      'Return slowly, letting your shoulders stretch forward.',
    ],
  },
  'pike-push-up': {
    key: 'pike-push-up',
    name: 'Pike Push-Up',
    muscles: { shoulders: 100, triceps: 50, abs: 40, obliques: 30, chest: 25 },
    equipment: ['bodyweight'],
    difficulty: 'Intermediate',
    instructions: [
      'From a push-up position, walk your feet in and lift your hips into a pike.',
      'Bend your elbows and lower your head toward the floor.',
      'Drive back up, keeping your hips high.',
      'Keep your core braced so your torso stays in one line.',
    ],
  },

  'barbell-curl': {
    key: 'barbell-curl',
    name: 'Barbell Curl',
    muscles: { biceps: 100, forearms: 60, shoulders: 20, abs: 25 },
    equipment: ['barbell', 'ez-bar'],
    difficulty: 'Beginner',
    instructions: [
      'Stand holding the bar with an underhand, shoulder-width grip.',
      'Pin your elbows to your sides.',
      'Curl the bar up to shoulder level, squeezing the biceps at the top.',
      'Lower slowly until your arms are fully straight.',
    ],
    videoId: 'j1JUE1Oj_bs',
  },
  'hammer-curl': {
    key: 'hammer-curl',
    name: 'Hammer Curl',
    muscles: { biceps: 100, forearms: 90, shoulders: 15 },
    equipment: ['dumbbells'],
    difficulty: 'Beginner',
    instructions: [
      'Hold a dumbbell in each hand with a neutral, palms-in grip.',
      'Keep your elbows tucked and curl both weights up.',
      'Squeeze at the top, then lower under control.',
      'Let the weights hang naturally at the bottom for a full stretch.',
    ],
    videoId: '8XLxfXROrTo',
  },
  'chin-up': {
    key: 'chin-up',
    name: 'Chin-Up',
    muscles: { biceps: 100, lats: 70, forearms: 60, abs: 45, chest: 10 },
    equipment: ['pull-up bar'],
    difficulty: 'Intermediate',
    instructions: [
      'Grip a bar with palms facing you, about shoulder width.',
      'Hang with straight arms and shoulders stretched.',
      'Pull your chin over the bar, elbows driving down.',
      'Lower all the way to a dead hang before the next rep.',
    ],
  },
  'preacher-curl': {
    key: 'preacher-curl',
    name: 'Preacher Curl',
    muscles: { biceps: 100, forearms: 55 },
    equipment: ['ez-bar', 'bench'],
    difficulty: 'Beginner',
    instructions: [
      'Set your upper arms flat against the preacher pad.',
      'Use an underhand, shoulder-width grip on the EZ bar.',
      'Curl the bar up, keeping your elbows pressed into the pad.',
      'Lower slowly until your arms are straight and the biceps stretch.',
    ],
  },

  'triceps-pushdown': {
    key: 'triceps-pushdown',
    name: 'Triceps Pushdown',
    muscles: { triceps: 100, forearms: 40, lats: 15 },
    equipment: ['cable'],
    difficulty: 'Beginner',
    instructions: [
      'Attach a rope or bar to a high cable.',
      'Grip it with elbows tucked into your sides.',
      'Press down until your arms lock out, elbows staying pinned.',
      'Let the forearms ride back up under control.',
    ],
  },
  'skullcrusher': {
    key: 'skullcrusher',
    name: 'Skullcrusher',
    muscles: { triceps: 100, shoulders: 20, forearms: 30 },
    equipment: ['ez-bar', 'bench'],
    difficulty: 'Intermediate',
    instructions: [
      'Lie on a bench holding an EZ bar over your chest.',
      'Lower it toward your forehead with elbows pointing up.',
      'Keep your upper arms still and feel the triceps stretch.',
      'Extend back to the start, locking out the elbows.',
    ],
  },
  'overhead-extension': {
    key: 'overhead-extension',
    name: 'Overhead Extension',
    muscles: { triceps: 100, shoulders: 30, forearms: 25 },
    equipment: ['dumbbells', 'cable'],
    difficulty: 'Beginner',
    instructions: [
      'Hold a dumbbell or cable handle overhead with both hands.',
      'Keep your elbows close and pointing forward.',
      'Lower the weight behind your head to a deep triceps stretch.',
      'Press back up to a full lockout.',
    ],
  },
  'close-grip-bench': {
    key: 'close-grip-bench',
    name: 'Close-Grip Bench',
    muscles: { triceps: 100, chest: 55, shoulders: 40, forearms: 20 },
    equipment: ['barbell', 'bench'],
    difficulty: 'Intermediate',
    instructions: [
      'Lie on a bench and grip the bar at shoulder width.',
      'Lower the bar to your lower chest with elbows tucked in.',
      'Press up, driving through your triceps to a straight-arm finish.',
      'Keep your elbows against your body throughout.',
    ],
  },

  'wrist-curl': {
    key: 'wrist-curl',
    name: 'Wrist Curl',
    muscles: { forearms: 100 },
    equipment: ['barbell', 'bench'],
    difficulty: 'Beginner',
    instructions: [
      'Sit with your forearms resting on your thighs or a bench, palms up.',
      'Hold the bar and let it roll down to your fingertips.',
      'Curl your wrists up, flexing the forearms hard.',
      'Lower slowly through a full stretch.',
    ],
  },
  'farmer-carry': {
    key: 'farmer-carry',
    name: 'Farmer Carry',
    muscles: { forearms: 100, traps: 40, quads: 35, calves: 40, glutes: 30, lower_back: 25, abs: 30 },
    equipment: ['dumbbells', 'kettlebell'],
    difficulty: 'Beginner',
    instructions: [
      'Load a heavy dumbbell or kettlebell in each hand.',
      'Stand tall with your chest up and shoulders squeezed back.',
      'Walk with short, quick steps, keeping your body upright.',
      'Stay braced until you set the weights down safely.',
    ],
  },
  'dead-hang': {
    key: 'dead-hang',
    name: 'Dead Hang',
    muscles: { forearms: 100, lats: 60, traps: 30, abs: 40 },
    equipment: ['pull-up bar'],
    difficulty: 'Beginner',
    instructions: [
      'Grip a pull-up bar at shoulder width.',
      'Keep your shoulders active, not fully shrugged.',
      'Hang with straight arms and feet off the ground.',
      'Hold until you feel the grip and lats working, then release slowly.',
    ],
  },

  'plank': {
    key: 'plank',
    name: 'Plank',
    muscles: { abs: 100, obliques: 80, lower_back: 35, shoulders: 25, glutes: 30, quads: 20 },
    equipment: ['bodyweight'],
    difficulty: 'Beginner',
    instructions: [
      'Forearm plank: elbows under shoulders, body in a straight line.',
      'Squeeze your glutes and brace your core hard.',
      'Keep your hips level, neither sagging nor piking up.',
      'Breathe steadily and hold the position.',
    ],
  },
  'crunch': {
    key: 'crunch',
    name: 'Crunch',
    muscles: { abs: 100, obliques: 30 },
    equipment: ['bodyweight'],
    difficulty: 'Beginner',
    instructions: [
      'Lie on your back with knees bent, feet flat on the floor.',
      'Place your hands lightly behind your head.',
      'Exhale and curl your ribs toward your pelvis.',
      'Lower back down slowly, keeping the tension in your abs.',
    ],
  },
  'hanging-leg-raise': {
    key: 'hanging-leg-raise',
    name: 'Hanging Leg Raise',
    muscles: { abs: 100, lats: 40, forearms: 40, obliques: 45, traps: 20 },
    equipment: ['pull-up bar'],
    difficulty: 'Intermediate',
    instructions: [
      'Hang from a bar with straight arms.',
      'Keeping your legs straight, raise them until they pass parallel.',
      'Curl your pelvis up at the top to hit the rectus abdominis.',
      'Lower slowly with no swinging.',
    ],
  },
  'ab-wheel': {
    key: 'ab-wheel',
    name: 'Ab Wheel Rollout',
    muscles: { abs: 100, lats: 60, shoulders: 45, triceps: 35, lower_back: 30, forearms: 35 },
    equipment: ['ab wheel'],
    difficulty: 'Advanced',
    instructions: [
      'Kneel with the ab wheel under your shoulders.',
      'Brace your core and tuck your hips so the back stays flat.',
      'Roll forward only as far as you can keep the back neutral.',
      'Pull back with your abs, not your arms.',
    ],
  },

  'russian-twist': {
    key: 'russian-twist',
    name: 'Russian Twist',
    muscles: { obliques: 100, abs: 70, shoulders: 20, quads: 15 },
    equipment: ['bodyweight', 'dumbbells'],
    difficulty: 'Beginner',
    instructions: [
      'Sit with knees bent, feet lifted slightly, holding a weight or hands together.',
      'Lean back to a comfortable angle, keeping the back long.',
      'Rotate your shoulders side to side, tapping the floor beside your hip.',
      'Move from your torso, not just your arms.',
    ],
  },
  'side-plank': {
    key: 'side-plank',
    name: 'Side Plank',
    muscles: { obliques: 100, abs: 60, shoulders: 45, quads: 25, glutes: 20 },
    equipment: ['bodyweight'],
    difficulty: 'Beginner',
    instructions: [
      'Lie on your side, elbow under shoulder, legs stacked.',
      'Push your hips up so your body forms a straight line.',
      'Keep your core and glutes tight.',
      'Hold, then switch sides.',
    ],
  },
  'cable-side-bend': {
    key: 'cable-side-bend',
    name: 'Cable Side Bend',
    muscles: { obliques: 100, abs: 25, lower_back: 20 },
    equipment: ['cable'],
    difficulty: 'Beginner',
    instructions: [
      'Stand side-on to a low cable, hand on the handle.',
      'Bend straight sideways, crunching the obliques.',
      'Avoid leaning forward or back.',
      'Return upright under control.',
    ],
  },

  'pull-up': {
    key: 'pull-up',
    name: 'Pull-Up',
    muscles: { lats: 100, biceps: 65, forearms: 60, traps: 40, abs: 50 },
    equipment: ['pull-up bar'],
    difficulty: 'Advanced',
    instructions: [
      'Grip the bar palms away, slightly wider than shoulder width.',
      'Hang with straight arms and shoulders stretched.',
      'Drive your elbows down to your ribs and pull your chest to the bar.',
      'Lower all the way to a dead hang without swinging.',
    ],
    videoId: 'lVkvceCgBRY',
  },
  'lat-pulldown': {
    key: 'lat-pulldown',
    name: 'Lat Pulldown',
    muscles: { lats: 100, biceps: 55, shoulders: 30, traps: 35, forearms: 45 },
    equipment: ['cable', 'machine'],
    difficulty: 'Beginner',
    instructions: [
      'Set the thigh pad so your legs are locked in.',
      'Grip the bar just outside shoulder width.',
      'Pull the bar to your upper chest, driving elbows down.',
      'Control the bar back up to a full stretch.',
    ],
    videoId: 'CAwf7n6Luuc',
  },
  'bent-over-row': {
    key: 'bent-over-row',
    name: 'Bent-Over Row',
    muscles: { lats: 100, traps: 45, lower_back: 55, biceps: 50, shoulders: 35, abs: 40, forearms: 45 },
    equipment: ['barbell'],
    difficulty: 'Intermediate',
    instructions: [
      'Hinge at the hips until your torso is near parallel, back flat.',
      'Grip the bar just outside shoulder width, arms hanging.',
      'Row the bar toward your belly button, elbows tight to the body.',
      'Lower under control without losing your posture.',
    ],
  },
  'seated-row': {
    key: 'seated-row',
    name: 'Seated Cable Row',
    muscles: { lats: 100, shoulders: 40, traps: 40, biceps: 45, forearms: 35, lower_back: 30 },
    equipment: ['cable', 'machine'],
    difficulty: 'Beginner',
    instructions: [
      'Sit tall with your feet braced and knees slightly bent.',
      'Grab the handle with a neutral grip.',
      'Pull toward your belly button, squeezing the shoulder blades.',
      'Let your arms stretch forward under control.',
    ],
  },

  'shrug': {
    key: 'shrug',
    name: 'Shrug',
    muscles: { traps: 100, shoulders: 25, forearms: 40 },
    equipment: ['dumbbells', 'barbell'],
    difficulty: 'Beginner',
    instructions: [
      'Stand holding weights at your sides.',
      'Shrug your shoulders straight up toward your ears.',
      'Pause a beat at the top with the traps fully contracted.',
      'Lower slowly through the full range.',
    ],
  },
  'rack-pull': {
    key: 'rack-pull',
    name: 'Rack Pull',
    muscles: { traps: 100, lower_back: 70, glutes: 60, hamstrings: 55, quads: 30, forearms: 55, abs: 50 },
    equipment: ['barbell', 'rack'],
    difficulty: 'Advanced',
    instructions: [
      'Set the bar on pins just below your knees.',
      'Grip it with a deadlift grip and brace your core hard.',
      'Push the floor away, extending hips and knees together.',
      'Keep the bar close and finish tall, then lower under control.',
    ],
  },

  'deadlift': {
    key: 'deadlift',
    name: 'Deadlift',
    muscles: { lower_back: 100, glutes: 80, hamstrings: 70, quads: 55, traps: 45, forearms: 55, abs: 60 },
    equipment: ['barbell'],
    difficulty: 'Advanced',
    instructions: [
      'Stand with the bar over mid-foot, feet hip-width apart.',
      'Hinge down and grip, keeping your back flat and chest up.',
      'Brace and push the floor away, bar dragging up your legs.',
      'Stand tall at the top, then hinge back down under control.',
    ],
    videoId: '-4qRntuXBSc',
  },
  'good-morning': {
    key: 'good-morning',
    name: 'Good Morning',
    muscles: { lower_back: 100, hamstrings: 75, glutes: 60, abs: 45 },
    equipment: ['barbell'],
    difficulty: 'Intermediate',
    instructions: [
      'Place the bar high on your upper back (not your neck).',
      'Stand with a soft knee bend and feet hip-width.',
      'Hinge at the hips, pushing them back as your torso folds forward.',
      'Return by driving your hips forward, keeping the back flat.',
    ],
  },
  'back-extension': {
    key: 'back-extension',
    name: 'Back Extension',
    muscles: { lower_back: 100, glutes: 65, hamstrings: 70 },
    equipment: ['bodyweight', 'bench'],
    difficulty: 'Beginner',
    instructions: [
      'Set your hips against the pad with ankles anchored.',
      'Bend forward at the hips with a flat back.',
      'Raise up until your body forms a straight line.',
      'Stop before any hyperextension, then lower slowly.',
    ],
  },

  'hip-thrust': {
    key: 'hip-thrust',
    name: 'Hip Thrust',
    muscles: { glutes: 100, hamstrings: 45, quads: 25, lower_back: 20, abs: 35 },
    equipment: ['barbell', 'bench'],
    difficulty: 'Beginner',
    instructions: [
      'Sit with your upper back against a bench and a padded bar over your hips.',
      'Plant your feet so knees make 90° at the top.',
      'Drive through your heels and thrust your hips up to full lockout.',
      'Keep your ribs down, squeeze the glutes hard, then lower.',
    ],
    videoId: 'SEdqd1n0cvg',
  },
  'glute-bridge': {
    key: 'glute-bridge',
    name: 'Glute Bridge',
    muscles: { glutes: 100, hamstrings: 50, abs: 30, quads: 15 },
    equipment: ['bodyweight'],
    difficulty: 'Beginner',
    instructions: [
      'Lie on your back with knees bent and feet flat.',
      'Drive through your heels and lift your hips up.',
      'Squeeze your glutes at the top in a straight line.',
      'Lower slowly without letting your hips crash.',
    ],
  },
  'cable-kickback': {
    key: 'cable-kickback',
    name: 'Cable Kickback',
    muscles: { glutes: 100, hamstrings: 25, abs: 20 },
    equipment: ['cable'],
    difficulty: 'Beginner',
    instructions: [
      'Attach an ankle strap to a low cable and face the machine.',
      'Keep your torso still and your knee soft.',
      'Kick your leg straight back, squeezing the glute.',
      'Return slowly without arching your back.',
    ],
  },

  'squat': {
    key: 'squat',
    name: 'Back Squat',
    muscles: { quads: 100, glutes: 75, hamstrings: 45, lower_back: 50, abs: 60, calves: 35 },
    equipment: ['barbell', 'rack'],
    difficulty: 'Advanced',
    instructions: [
      'Set the bar on your upper back and unrack it.',
      'Plant your feet and brace your core hard.',
      'Sit down and back between your hips, knees tracking over toes.',
      'Drive up through the mid-foot back to a standing position.',
    ],
    videoId: 'nEQQle9-0NA',
  },
  'goblet-squat': {
    key: 'goblet-squat',
    name: 'Goblet Squat',
    muscles: { quads: 100, glutes: 70, hamstrings: 35, abs: 55, lower_back: 30, calves: 25 },
    equipment: ['kettlebell', 'dumbbells'],
    difficulty: 'Beginner',
    instructions: [
      'Hold a kettlebell or dumbbell at your chest, elbows tucked.',
      'Feet just outside hip width, toes slightly out.',
      'Squat down keeping your chest tall and elbows inside your knees.',
      'Drive up through your heels back to standing.',
    ],
    videoId: 'xTM-e_Gj5sA',
  },
  'leg-press': {
    key: 'leg-press',
    name: 'Leg Press',
    muscles: { quads: 100, glutes: 60, hamstrings: 40, calves: 25 },
    equipment: ['machine'],
    difficulty: 'Beginner',
    instructions: [
      'Sit with your back and hips flat against the seat.',
      'Place feet shoulder width on the plate.',
      'Lower the sled until your thighs break parallel.',
      'Press through the whole foot, keeping your hips down.',
    ],
    videoId: 'GcSV-kplgpI',
  },
  'lunge': {
    key: 'lunge',
    name: 'Walking Lunge',
    muscles: { quads: 100, glutes: 70, hamstrings: 35, calves: 30, abs: 45, obliques: 30 },
    equipment: ['dumbbells', 'bodyweight'],
    difficulty: 'Intermediate',
    instructions: [
      'Stand tall with a dumbbell in each hand.',
      'Step forward and lower until both knees reach about 90°.',
      'Push off the front foot and step through into the next stride.',
      'Keep your torso upright and steps controlled.',
    ],
  },
  'leg-extension': {
    key: 'leg-extension',
    name: 'Leg Extension',
    muscles: { quads: 100, calves: 10, abs: 15 },
    equipment: ['machine'],
    difficulty: 'Beginner',
    instructions: [
      'Sit with your knees against the pad and shins behind the roller.',
      'Extend your legs until they are straight.',
      'Pause one second with the quads fully contracted.',
      'Lower slowly without letting the weight crash.',
    ],
  },

  'romanian-deadlift': {
    key: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    muscles: { hamstrings: 100, glutes: 80, lower_back: 65, abs: 40, forearms: 45 },
    equipment: ['barbell', 'dumbbells'],
    difficulty: 'Intermediate',
    instructions: [
      'Stand holding the bar, knees soft and back flat.',
      'Push your hips back, sliding the bar down your thighs.',
      'Lower until you feel a stretch in your hamstrings, around mid-shin.',
      'Drive your hips forward to stand tall, keeping the bar close.',
    ],
    videoId: '6dv54cP4nEw',
  },
  'leg-curl': {
    key: 'leg-curl',
    name: 'Leg Curl',
    muscles: { hamstrings: 100, calves: 20 },
    equipment: ['machine'],
    difficulty: 'Beginner',
    instructions: [
      'Position your ankles under the pads, knees just off the bench edge.',
      'Curl your heels toward your glutes.',
      'Squeeze the hamstrings at the top.',
      'Lower slowly through the full stretch.',
    ],
  },
  'nordic-curl': {
    key: 'nordic-curl',
    name: 'Nordic Curl',
    muscles: { hamstrings: 100, glutes: 40, abs: 30, lower_back: 25 },
    equipment: ['bodyweight', 'bench'],
    difficulty: 'Advanced',
    instructions: [
      'Kneel with your ankles anchored (partner or pad).',
      'Keep a straight line from knees to head.',
      'Slowly lower forward, resisting with your hamstrings.',
      'Pull back up or catch yourself with your hands at the bottom.',
    ],
  },

  'standing-calf-raise': {
    key: 'standing-calf-raise',
    name: 'Standing Calf Raise',
    muscles: { calves: 100 },
    equipment: ['machine', 'bodyweight'],
    difficulty: 'Beginner',
    instructions: [
      'Stand with your toes on the edge of a step or machine platform.',
      'Drop your heels for a deep stretch.',
      'Rise up onto your toes, pausing at the top.',
      'Lower slowly without bouncing.',
    ],
  },
  'seated-calf-raise': {
    key: 'seated-calf-raise',
    name: 'Seated Calf Raise',
    muscles: { calves: 100 },
    equipment: ['machine', 'dumbbells'],
    difficulty: 'Beginner',
    instructions: [
      'Sit with the pads over your knees, toes on the platform.',
      'Lower your heels for a full stretch of the soleus.',
      'Press up onto your toes with a controlled pause.',
      'Lower slowly and repeat.',
    ],
  },
};

export const EXERCISE_DIFFICULTIES: ExerciseDifficulty[] = ['Beginner', 'Intermediate', 'Advanced'];

/** All equipment tags found in the book, sorted alphabetically. */
export const EXERCISE_EQUIPMENT: string[] = [
  ...new Set(Object.values(EXERCISE_BOOK).flatMap((ref) => ref.equipment)),
].sort();

export function getExerciseReference(key: string | null): ExerciseBookReference | undefined {
  if (!key) return undefined;
  return EXERCISE_BOOK[key];
}

export function youtubeVideoUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/** Fallback link when no curated video exists: opens a YouTube search. */
export function youtubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' proper form')}`;
}