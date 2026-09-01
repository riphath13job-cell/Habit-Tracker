// Looksmaxxing template library: ready-made routines you can import
// into the Routines app with one tap.

export interface LooksmaxxingTemplate {
  key: string;
  emoji: string;
  name: string;
  category: string;
  description: string;
  items: string[];
  notes: string;
}

export const TEMPLATES: LooksmaxxingTemplate[] = [
  {
    key: "morning-glow",
    emoji: "🌅",
    name: "Morning Glow",
    category: "Morning",
    description:
      "A sunrise stack that primes your skin, your mouth and your energy for the day — the backbone of every other method.",
    items: [
      "Cold water splash on the face",
      "Moisturizer + SPF 30",
      "Brush & floss",
      "Scrape the tongue",
      "Glass of water",
      "High-protein breakfast",
      "20 push-ups",
    ],
    notes:
      "Start your day with SPF so you never skip it, hydrate first, and move a little to wake up circulation. See the Study tab for every step behind it.",
  },
  {
    key: "night-reset",
    emoji: "🌙",
    name: "Night Skin Reset",
    category: "Night",
    description:
      "The PM cleanup that repairs what the day did: remove, treat, moisturize, and sleep on your back.",
    items: [
      "Double cleanse (oil, then gentler cleanser)",
      "Retinoid (2–3 nights a week, pea size)",
      "Night moisturizer",
      "Lip balm with SPF",
      "Back-sleep on a supportive pillow",
      "No screens 30 min before bed",
    ],
    notes:
      "Evening is when skin repairs itself. Double cleansing removes the SPF you wore all day, and retinoid 2–3 nights a week does the structural work.",
  },
  {
    key: "posture-jaw",
    emoji: "🧍",
    name: "Posture & Jaw",
    category: "Posture",
    description:
      "Three minutes, three times a day that straighten your neck, open your chest and improve your side profile.",
    items: [
      "Chin tucks: 10 reps, hold 5s",
      "Wall angels: 10 reps",
      "Doorway chest stretch: 30s",
      "Shoulder rolls: 10 each way",
      "Stand-tall check ×3",
    ],
    notes:
      "Forward head posture makes your neck look weak from the side. Daily chin tucks and chest openers rebalance it — the jawline reads better at any body weight.",
  },
  {
    key: "beginner-skincare",
    emoji: "🧴",
    name: "Beginner Skincare",
    category: "Skincare",
    description:
      "The evidence-backed core: cleanse, treat, moisturize, protect. Start here before any advanced ingredient.",
    items: [
      "Gentle cleanser (AM & PM)",
      "Vitamin C serum (AM)",
      "Moisturizer (AM)",
      "SPF 30+ (AM, last step)",
      "Gentle cleanser second wash (PM)",
      "Niacinamide serum (PM)",
      "Night moisturizer (PM)",
    ],
    notes:
      "Sun protection is step one, everything else is optional. Add retinoid and exfoliation later — see Skin Cycling in the Study tab.",
  },
  {
    key: "hair-boost",
    emoji: "💇",
    name: "Hair Boost",
    category: "Hair",
    description:
      "Daily scalp care and a few nutrition habits that give your follicles the best chance they have.",
    items: [
      "5-min scalp massage",
      "Warm rinse, cold finish",
      "Apply minoxidil per directions",
      "High-protein snack",
      "Trim check (weekly)",
      "Avoid tight hats today",
    ],
    notes:
      "Scalp massage and protein feed growth; minoxidil is the heavyweight if you're thinning — but only if you never skip it. See the Study tab.",
  },
  {
    key: "eye-de-puff",
    emoji: "👁️",
    name: "Eye De-Puff",
    category: "Eyes",
    description:
      "Fight the tired look from three directions: sleep position, cold, and what you ate the night before.",
    items: [
      "8 hours sleep",
      "Cold compress: 2 min each eye",
      "Caffeine eye cream",
      "Lighter salt at dinner",
      "Extra water today",
      "Head slightly elevated at night",
    ],
    notes:
      "Morning puffiness is mostly overnight fluid. Handle it with cold and caffeine in the morning, and prevent it with less salt, more water and sleep.",
  },
  {
    key: "fitness-face",
    emoji: "💪",
    name: "Fitness for Your Face",
    category: "Fitness",
    description:
      "The face follows the body: lift, walk, eat protein, sleep. This is the template that changes your jawline.",
    items: [
      "New PR attempt on, full-body or split train",
      "8,000+ steps",
      "High-protein meal ×3",
      "10-min stretch flow",
      "8 hours sleep tonight",
      "No alcohol today",
    ],
    notes:
      "Body fat hides the jawline; muscle builds the frame under it. Consistency here beats any topical product. Use the Fitness app alongside this.",
  },
  {
    key: "smile-breath",
    emoji: "😁",
    name: "Smile & Breath",
    category: "Smile",
    description:
      "Thirty seconds of extra mouth care that shows up in every smile and every conversation.",
    items: [
      "Brush 2 min (AM & PM)",
      "Floss once",
      "Scrape the tongue",
      "Rinse after coffee",
      "Lip balm with SPF",
      "Hydrate — no dry mouth",
    ],
    notes:
      "A clean, bright smile and fresh breath are the cheapest social upgrades there are. Add safe whitening once your daily habits are locked.",
  },
  {
    key: "grooming-day",
    emoji: "✂️",
    name: "Grooming Day",
    category: "Grooming",
    description:
      "The weekly 30-minute session that keeps everything maintained so nothing ever slips.",
    items: [
      "Trim eyebrows",
      "Beard outline / shave",
      "Nose & ear trim",
      "Nails: trim + file",
      "Check haircut status",
      "Book barber if due",
    ],
    notes:
      "Grooming is the cheapest, fastest signal that you're maintained. One block, once a week, and you read as put-together everywhere.",
  },
  {
    key: "style-basics",
    emoji: "👔",
    name: "Style Basics",
    category: "Style",
    description:
      "Dress the part: plan it the night before so every day starts put-together, in clothes that fit.",
    items: [
      "Pick tomorrow's outfit tonight",
      "Everything fits — shoulders, waist, sleeve",
      "Shoes clean & matched",
      "Palette-friendly colors",
      "One accent interest piece",
      "Stand tall & present",
    ],
    notes:
      "Fit beats brand, palette beats pattern, and clean details beat everything. See Style in the Study tab for the full playbook.",
  },
  {
    key: "water-glow",
    emoji: "💧",
    name: "Water & Glow",
    category: "Hydration",
    description:
      "A low-effort stack for brighter skin: hydrate, swap one drink for green tea, cut the sugar.",
    items: [
      "2–3L water today",
      "Green tea: 1 cup",
      "Berries or nuts snack",
      "No sugary drinks today",
      "SPF in the morning",
      "Extra protein at lunch",
    ],
    notes:
      "Hydration and antioxidant habits show up faster on skin than almost anything else. Keep SPF as the daily forever-habit.",
  },
  {
    key: "wind-down",
    emoji: "🛌",
    name: "Deep Wind-Down",
    category: "Sleep",
    description:
      "The hour before bed that decides how your face looks tomorrow morning.",
    items: [
      "Screens off 30 min before bed",
      "Dim the lights",
      "Cool the room (16–19°C)",
      "Warm shower",
      "Brain-dump tomorrow's plan",
      "Lights out at fixed time",
    ],
    notes:
      "Deep sleep is when growth hormone and skin repair do their work. Protect this window and every other method pays off.",
  },
];

export function getTemplate(key: string): LooksmaxxingTemplate | undefined {
  return TEMPLATES.find((t) => t.key === key);
}

export const TEMPLATE_CATEGORIES: string[] = Array.from(
  new Set(TEMPLATES.map((t) => t.category)),
);