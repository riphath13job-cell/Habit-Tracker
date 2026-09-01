export interface Technique {
  key: string;
  name: string;
  full?: string;
  /** foundation = recall & awareness, induction = go-lucid methods. */
  category: 'foundation' | 'induction';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  bestFor: string;
  summary: string;
  steps: string[];
  tips: string[];
}

export const TECHNIQUES: Technique[] = [
  {
    key: 'journal',
    name: 'Dream Journaling',
    category: 'foundation',
    difficulty: 'Beginner',
    bestFor: 'Everyone — it is the engine behind every other technique.',
    summary:
      'You forget about half of a dream within five minutes of waking. Writing dreams down every morning trains your brain to treat dreams as memories worth keeping, and recall grows fast — most people go from one fragment to several full dreams per night within two weeks. Every lucid dreaming technique assumes you can remember your dreams, so this is always step one.',
    steps: [
      'Keep your phone (this app) or a notebook within arm’s reach of the bed before you fall asleep.',
      'On waking, do not move or check the time. Keep your eyes closed and replay the dream backwards in your head.',
      'Capture keywords first — “beach, running, red water, old friend” — then expand them into full sentences.',
      'Give the dream a title so it is easy to find later.',
      'Tag whether it was lucid, and note any recurring people, places, or themes as you go.',
      'If you remember nothing, write that down anyway (“no recall last night”). The act of trying is what builds recall.',
    ],
    tips: [
      'Review your journal weekly — recurring “dream signs” are your personal lucidity triggers.',
      'Recall comes in waves; a blank morning after a great week is normal.',
      'Recording immediately beats recording perfectly — fragments now, details later.',
    ],
  },
  {
    key: 'reality-checks',
    name: 'Reality Checks',
    category: 'foundation',
    difficulty: 'Beginner',
    bestFor: 'Building the habit that makes spontaneous lucidity possible.',
    summary:
      'A reality check is a short test you run while awake to answer one question honestly: “Am I dreaming?” In a dream, physics misbehaves — text changes when re-read, fingers pass through palms, pinched noses still breathe. By genuinely questioning reality many times a day, the habit leaks into your dreams, where the test fails spectacularly and triggers lucidity.',
    steps: [
      'Pick one or two physical checks and commit to them — nose pinch (pinch your nose shut and try to breathe through it) and finger-through-palm are the most reliable.',
      'Add a mental check: ask “How did I get here? What was I doing ten minutes ago?” Dream memory is fuzzy.',
      'Really mean it each time. Half-hearted checking trains your dream self to be half-hearted too.',
      'Anchor checks to triggers: walking through doorways, seeing your phone, waking up, or this app’s reminders.',
      'When a check “fails” in a dream, stay calm — rub your hands together and look at details to stabilise before exploring.',
    ],
    tips: [
      'Always double-check: false awakenings look exactly like your bedroom.',
      'Re-reading text twice is great near books and screens — dream text morphs.',
      'Digital clocks and light switches also glitch reliably in dreams.',
    ],
  },
  {
    key: 'dream-signs',
    name: 'Dream Signs',
    category: 'foundation',
    difficulty: 'Beginner',
    bestFor: 'Turning journal history into targeted lucidity triggers.',
    summary:
      'Dream signs are the recurring characters, places, and impossible events that show up again and again in your dreams. Spotting them while awake gives your sleeping brain specific hooks: the next time flying dogs or your childhood school appears, recognition fires and lucidity follows. This is the bridge between journaling and actually going lucid.',
    steps: [
      'After a week of journaling, read back through your entries and underline anything that appeared more than once.',
      'Sort them into groups: inner states (odd fear), actions (flying, teeth falling out), forms (weird animals), and places (school, childhood home).',
      'Pick your top two or three signs — frequency matters more than weirdness.',
      'Each night, tell yourself: “Next time I see [sign], I will realise I am dreaming.”',
      'When you meet a sign while awake, treat it as a cue for a full reality check.',
    ],
    tips: [
      'Dream signs evolve — refresh your list every few weeks from new entries.',
      'People you knew long ago are among the most common signs of all.',
    ],
  },
  {
    key: 'mild',
    name: 'MILD',
    full: 'Mnemonic Induction of Lucid Dreams',
    category: 'induction',
    difficulty: 'Beginner',
    bestFor: 'The most research-validated technique — great first method, ideal combined with WBTB.',
    summary:
      'Developed by Dr. Stephen LaBerge at Stanford, MILD uses prospective memory — remembering to do something in the future — by rehearsing an intention as you fall asleep: “Next time I’m dreaming, I will remember I’m dreaming.” Paired with visualising yourself back in a recent dream, it dramatically raises the odds of lucidity, especially in the REM-rich early-morning hours.',
    steps: [
      'Go to bed normally, or return to bed during a WBTB wake-up for best results.',
      'Recall a recent dream from your journal in as much detail as you can.',
      'Find the moment it became strange — a point where you could have realised it was a dream.',
      'Visualise being back in that dream, but this time performing a reality check and becoming lucid at that exact moment.',
      'Repeat slowly in your head: “Next time I’m dreaming, I will remember I’m dreaming.”',
      'Alternate between the visualisation and the phrase, letting them blur together as you drift off.',
    ],
    tips: [
      'Falling asleep mid-phrase is fine — drowsy repetition is exactly the target state.',
      'Aim for MILD after 5–6 hours of sleep, when REM dominates.',
      'Pair it with your strongest dream sign for extra punch.',
    ],
  },
  {
    key: 'wbtb',
    name: 'WBTB',
    full: 'Wake Back To Bed',
    category: 'induction',
    difficulty: 'Beginner',
    bestFor: 'A multiplier that boosts every other technique — the single highest-leverage habit.',
    summary:
      'WBTB is not so much a technique as a force multiplier. After 5–6 hours of sleep your deepest sleep is done and every remaining cycle is REM-heavy. Waking briefly — lights on, mind engaged — then returning to bed leaves your prefrontal cortex (the awareness centre) partially switched on while you re-enter REM. That combination is the perfect storm for lucidity.',
    steps: [
      'Set an alarm for 5–6 hours after bedtime (experiment: some prefer 4.5, others 6).',
      'When it rings, actually get out of bed — dim lights if full brightness feels harsh.',
      'Stay awake 20–30 minutes: read about lucid dreaming, read your dream journal, jot tonight’s intention. Avoid doom-scrolling.',
      'Return to bed relaxed and sleepy, holding a clear intention to become lucid.',
      'Apply another technique as you fall asleep — MILD, SSILD, FILD, or WILD.',
    ],
    tips: [
      'Too awake afterwards? Shorten the wake period to 10–15 minutes next time.',
      'WBTB + MILD is the most popular combo in the world for good reason.',
      'Two or three WBTB nights per week is plenty — protect overall sleep quality.',
    ],
  },
  {
    key: 'ssild',
    name: 'SSILD',
    full: 'Senses Initiated Lucid Dream',
    category: 'induction',
    difficulty: 'Beginner',
    bestFor: 'People who find MILD fussy or WILD too intense — gentle, passive, surprisingly powerful.',
    summary:
      'SSILD cycles your attention through sight, sound, and body sensation in slow, lazy rounds. Unlike WILD there is nothing to force — you observe each sense briefly, then deliberately let go and sleep. The light stimulation nudges your brain toward hybrid sleep-wake states, and lucidity often arrives spontaneously later in the night, frequently through a false awakening.',
    steps: [
      'Wake after 4–5 hours of sleep (WBTB style) and stay up briefly — 5–10 minutes is enough.',
      'Lie back down in any comfortable position and relax completely.',
      'Sight cycle: with eyes closed, notice the darkness and faint patterns behind your eyelids for 5–10 slow seconds.',
      'Sound cycle: listen to the room — or silence — for 5–10 seconds.',
      'Body cycle: feel the weight and tingling of your body on the mattress for 5–10 seconds.',
      'Repeat the three-step cycle 4–6 times, then drop everything and just fall asleep normally.',
    ],
    tips: [
      'Effortlessness is the whole trick — straining wakes you up.',
      'When you “wake” later, reality check first: SSILD loves to produce false awakenings.',
      'If sleep refuses to come, you are cycling too intensely; slow it down.',
    ],
  },
  {
    key: 'wild',
    name: 'WILD',
    full: 'Wake Initiated Lucid Dream',
    category: 'induction',
    difficulty: 'Advanced',
    bestFor: 'Experienced practitioners — the direct doorway from awake to lucid dream.',
    summary:
      'WILD means carrying your waking consciousness across the sleep threshold. Your body falls asleep while your mind stays a quiet observer, watching hypnagogic imagery assemble into a full dream you enter already lucid. It often passes through sleep paralysis and buzzing vibrations along the way — strange but harmless. The reward is the deepest, most vivid lucid dreams of any method.',
    steps: [
      'Time it for after 4–6 hours of sleep during a WBTB wake-up, or a lazy afternoon nap.',
      'Lie perfectly still in your most comfortable back-or-side position and commit to not moving.',
      'Relax progressively from toes to face until the body feels heavy and distant.',
      'Hold a calm anchor of awareness: slow breathing, or counting “one — I’m dreaming, two — I’m dreaming…”',
      'Watch the hypnagogic show without chasing it: colours, patterns, voices, scenes. Observe, never grab.',
      'When imagery becomes a stable scene, enter it gently — imagine walking into it or reaching out and touching it.',
      'Once inside, stabilise immediately: rub your hands together, look at details, say “clarity now.”',
    ],
    tips: [
      'Swallowing or itching? Ignore what you can; adjust position once, slowly, then freeze again.',
      'Sleep paralysis and vibrations are milestones, not dangers — you cannot get stuck.',
      'Failing by simply falling asleep is normal. Every attempt trains the skill.',
    ],
  },
  {
    key: 'fild',
    name: 'FILD',
    full: 'Finger Induced Lucid Dream',
    category: 'induction',
    difficulty: 'Intermediate',
    bestFor: 'Night owls who wake naturally at 4–6am — the fastest technique when drowsy.',
    summary:
      'FILD is a micro-movement hack: you move two fingers as if playing an almost invisible piano while letting yourself fall back asleep. The movement is tiny enough that your body slips into REM within half a minute, while the intention keeps a thread of awareness alive. A reality check after ~30 seconds reveals you are usually already dreaming.',
    steps: [
      'Wake naturally or via alarm after 4–6 hours of sleep. Do not get out of bed, do not open your eyes.',
      'Rest index and middle finger of one hand on the mattress.',
      'Move them alternately, like pressing piano keys — so small the movement is barely real, more intention than motion.',
      'Keep this going for about 30 seconds while letting yourself drift toward sleep.',
      'Stop and immediately nose-pinch reality check.',
      'If you can still breathe — you are dreaming. Get up carefully? No: stabilise and enjoy. If the check fails, either retry briefly or just go to sleep and try MILD.',
    ],
    tips: [
      'Works only when genuinely drowsy — if you feel awake, skip to SSILD.',
      'One attempt per wake-up, then let sleep happen; repeated attempts wreck the night.',
      'Perfect for alarm-free natural awakenings, which is when FILD shines brightest.',
    ],
  },
  {
    key: 'deild',
    name: 'DEILD',
    full: 'Dream Exit Initiated Lucid Dream',
    category: 'induction',
    difficulty: 'Advanced',
    bestFor: 'Waking straight out of a dream — instant re-entry and dream chaining.',
    summary:
      'DEILD exploits the brief window right after a dream ends. Wake from a dream, do not move, do not think too hard, and your brain can drop straight back into REM with awareness intact — re-entering the same dream lucidly. Practised well, it lets you chain one awakening into several consecutive lucid dreams in a single morning.',
    steps: [
      'Set a soft intention before bed: “When I wake from a dream, I will stay still.”',
      'On waking from a dream: eyes stay closed, body does not move — no clock-checking, no rolling over.',
      'Hold stillness and think of almost nothing; curiosity without excitement.',
      'Within 10–30 seconds hypnagogic imagery or dream sensations should re-emerge around you.',
      'Passively let the scene rebuild, then step back in and stabilise with touch and sight.',
      'If the window is missed, no harm done — switch to MILD and fall asleep.',
    ],
    tips: [
      'Movement is the killer — even opening eyes can reset the window.',
      'Best odds after 5+ hours of sleep when REM cycles run long.',
      'Natural early-morning awakenings are free DEILD chances every single day.',
    ],
  },
  {
    key: 'cat',
    name: 'CAT',
    full: 'Cycle Adjustment Technique',
    category: 'induction',
    difficulty: 'Intermediate',
    bestFor: 'Early risers with steady schedules who want lucidity without broken sleep.',
    summary:
      'CAT trains your internal clock to end a REM period slightly early — and to wake you mid-dream alert. You shorten one morning by 90 minutes for a week using an alarm, then remove the alarm. Your body keeps waking at the earlier time anyway, right in the middle of vivid morning REM: a built-in daily WBTB window, no alarm required.',
    steps: [
      'Week 1: set an alarm 90 minutes earlier than usual. On waking, stay up 5–10 minutes, then go back to bed.',
      'Do this every day of the week — consistency is what sets the clock.',
      'Week 2: stop the alarm entirely and plan to sleep the full duration.',
      'Your body will still wake at the early time, likely straight out of a dream.',
      'At that waking, reality check, try DEILD, or apply MILD as you return to sleep.',
    ],
    tips: [
      'Requires a stable schedule — shift workers will fight their own biology.',
      'Expect grogginess the first few mornings of week one; it fades.',
      'Combine with weekend WBTB + MILD for maximum weekly coverage.',
    ],
  },
  {
    key: 'autosuggestion',
    name: 'Autosuggestion',
    full: 'Pre-sleep Affirmation',
    category: 'induction',
    difficulty: 'Beginner',
    bestFor: 'Minimal-effort starters and anyone who falls asleep too fast for MILD.',
    summary:
      'Autosuggestion is MILD’s relaxed cousin: instead of visualisation gymnastics, you simply repeat a short, sincere phrase while falling asleep — “Tonight I will realise I am dreaming.” It plants the intention without keeping the mind alert, which makes it perfect for people who drop off in seconds. Weaker than full MILD, but nearly free to practice every night.',
    steps: [
      'Lie down, close your eyes, and settle into slow breathing.',
      'Choose one short phrase and stick with it — e.g. “I will know I’m dreaming tonight.”',
      'Repeat it slowly, mentally, in rhythm with your breath. No visualising required.',
      'Let the words grow softer and further apart as drowsiness deepens.',
      'Fall asleep whenever it happens — losing track mid-phrase is success, not failure.',
    ],
    tips: [
      'Meaning it matters more than counting repetitions.',
      'Stack it on top of journaling and reality checks for a complete low-effort routine.',
      'If you have more energy some nights, upgrade those nights to full MILD.',
    ],
  },
];

export const TECHNIQUE_BY_KEY: Record<string, Technique> = TECHNIQUES.reduce(
  (acc, t) => {
    acc[t.key] = t;
    return acc;
  },
  {} as Record<string, Technique>,
);
