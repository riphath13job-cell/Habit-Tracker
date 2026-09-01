// Looksmaxxing study library: the methods, organized by category.
// All content is general wellness information, not medical advice.

export type StudyCategory =
  | "Skincare"
  | "Hair"
  | "Diet & Nutrition"
  | "Sleep & Energy"
  | "Fitness & Posture"
  | "Grooming"
  | "Oral Care"
  | "Style"
  | "Mindset";

export type Difficulty = "Easy" | "Medium" | "Hard";

export interface LooksmaxxingMethod {
  key: string;
  emoji: string;
  title: string;
  category: StudyCategory;
  description: string;
  steps: string[];
  frequency: string;
  difficulty: Difficulty;
  resultsIn: string;
  tip?: string;
  tags: string[];
}

export const DISCLAIMER =
  "General wellness information, not medical advice. For persistent skin, hair or health concerns, see a doctor or dermatologist.";

export const CATEGORY_ORDER: StudyCategory[] = [
  "Skincare",
  "Hair",
  "Diet & Nutrition",
  "Sleep & Energy",
  "Fitness & Posture",
  "Grooming",
  "Oral Care",
  "Style",
  "Mindset",
];

export const CATEGORY_EMOJI: Record<StudyCategory, string> = {
  Skincare: "🧴",
  Hair: "💇",
  "Diet & Nutrition": "🥗",
  "Sleep & Energy": "😴",
  "Fitness & Posture": "🏋️",
  Grooming: "✂️",
  "Oral Care": "🪥",
  Style: "👔",
  Mindset: "🧠",
};

export const CATEGORY_COLORS: Record<StudyCategory, string> = {
  Skincare: "#F472B6",
  Hair: "#FBBF24",
  "Diet & Nutrition": "#34D399",
  "Sleep & Energy": "#818CF8",
  "Fitness & Posture": "#FB923C",
  Grooming: "#A78BFA",
  "Oral Care": "#38BDF8",
  Style: "#F87171",
  Mindset: "#2DD4BF",
};

export const METHODS: LooksmaxxingMethod[] = [
  // ------------------------------------------------------------------ Skincare
  {
    key: "sunscreen",
    emoji: "🧴",
    title: "Daily Sunscreen SPF 30+",
    category: "Skincare",
    description:
      "UV light is the #1 cause of visible ageing, dark spots and uneven tone. Daily SPF is the single highest-return skincare step — nothing else comes close to protecting what you already have.",
    steps: [
      "Use SPF 30+ broad-spectrum sunscreen every morning, even when cloudy",
      "Apply as the last step of your AM routine, about two finger-lengths for face, neck and ears",
      "Reapply every 2 hours if you are outdoors or sweating",
      "Pick a moisturising formula so daily wear is comfortable, not chalky",
    ],
    frequency: "Daily · every single day",
    difficulty: "Easy",
    resultsIn: "Prevents damage now; visible payoff in months",
    tip: "Keep it next to your toothpaste — a missed morning is a missed day.",
    tags: ["spf", "sunscreen", "uv", "anti-aging", "dark spots", "hyperpigmentation", "protection"],
  },
  {
    key: "gentle-cleanse",
    emoji: "🧼",
    title: "Cleanse Morning & Night",
    category: "Skincare",
    description:
      "Cleansing removes the sweat, oil and grime that clog pores and dull skin — without stripping it. Washing is the foundation every other ingredient builds on.",
    steps: [
      "Wash with a mild, pH-balanced cleanser morning and night",
      "Massage gently for 30–60 seconds with warm, never hot, water",
      "Pat dry with a towel — never rub",
      "Skip harsh bar soap and aggressive face scrubs",
    ],
    frequency: "Daily · AM & PM",
    difficulty: "Easy",
    resultsIn: "Cleaner-looking pores within a week",
    tags: ["cleanser", "wash", "acne", "oily", "pores", "face"],
  },
  {
    key: "double-cleanse",
    emoji: "✨",
    title: "Double Cleanse at Night",
    category: "Skincare",
    description:
      "An oil-based first cleanse dissolves sunscreen and excess sebum, then a gentle water cleanser lifts everything else — cleaner skin with far less irritation than scrubbing.",
    steps: [
      "Massage an oil or balm cleanser over dry skin",
      "Emulsify with water, then rinse",
      "Follow with your regular gentle cleanser",
      "A single cleanse is fine in the morning or when your skin is dry",
    ],
    frequency: "Daily · PM",
    difficulty: "Medium",
    resultsIn: "Blackheads and texture improve over weeks",
    tags: ["cleansing", "oil cleanse", "blackheads", "sunscreen removal", "texture"],
  },
  {
    key: "moisturize",
    emoji: "💧",
    title: "Moisturize AM & PM",
    category: "Skincare",
    description:
      "Moisturised skin looks smoother and plumper; dryness and a weak barrier make fine lines and irritation look worse than they are.",
    steps: [
      "Apply to damp skin within 60 seconds of cleansing to lock in water",
      "Light lotion or gel in the day, richer cream at night",
      "Choose one with a humectant like hyaluronic acid or glycerin",
      "Layer actives (serums) first, moisturizer on top",
    ],
    frequency: "Daily · AM & PM",
    difficulty: "Easy",
    resultsIn: "Immediate softness; smoother look in weeks",
    tags: ["moisturizer", "hydration", "barrier", "fine lines", "night cream"],
  },
  {
    key: "vitamin-c",
    emoji: "🍊",
    title: "Vitamin C in the Morning",
    category: "Skincare",
    description:
      "A stable vitamin C serum brightens dull skin, fades spots and strengthens your sunscreen against free radicals — the AM mirror of retinoids at night.",
    steps: [
      "Use a 10–20% L-ascorbic acid or a stable derivative",
      "Apply on a clean face before sunscreen",
      "Use daily; if it stings chronically, drop to every other day",
      "Store away from light and heat — oxidized serum turns orange",
      "Moisturizer goes on top",
    ],
    frequency: "Daily · AM",
    difficulty: "Medium",
    resultsIn: "Brightening in 4–8 weeks",
    tip: "Over-strength vitamin C irritates — a gentle 10% beats a harsh 20%.",
    tags: ["vitamin c", "brightening", "antioxidants", "glow", "dark spots", "serum"],
  },
  {
    key: "niacinamide",
    emoji: "🌾",
    title: "Niacinamide Serum",
    category: "Skincare",
    description:
      "Vitamin B3 shrinks the look of pores, calms redness, regulates oil and fades discoloration — a low-irritation workhorse for nearly every skin type.",
    steps: [
      "Use a 5–10% niacinamide serum daily",
      "Apply after cleansing, before moisturizer",
      "AM or PM both work — separate it from strong acids if your skin reacts",
      "Skip stacking it with another high-strength active if irritation appears",
    ],
    frequency: "Daily",
    difficulty: "Easy",
    resultsIn: "Better oil control and pore look in 2–4 weeks",
    tags: ["niacinamide", "b3", "pores", "sebum", "redness"],
  },
  {
    key: "retinoid",
    emoji: "🌙",
    title: "Retinoid at Night",
    category: "Skincare",
    description:
      "Retinoids are the most evidence-backed anti-ageing and acne ingredient. They speed cell turnover, smooth texture and unclog pores — at the cost of patience and, briefly, some peeling.",
    steps: [
      "Start 2–3 nights a week, a pea-size amount — that is the whole face",
      "Skip on shave days or any day skin feels irritated",
      "Build up to 3–4 nights a week as tolerance allows",
      "Never mix with other strong actives the same night; SPF every morning without fail",
      "Expect 8–12 weeks for the full effect",
    ],
    frequency: "2–4 nights a week · PM",
    difficulty: "Hard",
    resultsIn: "Peeling for 2–4 weeks, then clearer, smoother skin by ~3 months",
    tip: "Retinoids make skin sun-sensitive — the daily SPF is non-negotiable.",
    tags: ["retinoid", "retinol", "tretinoin", "acne", "wrinkles", "texture"],
  },
  {
    key: "exfoliate",
    emoji: "🧽",
    title: "Exfoliate 2–3 Times a Week",
    category: "Skincare",
    description:
      "Gentle, frequent exfoliation removes the dead-cell layer that makes skin look dry and tired, unclogs pores and smooths tone.",
    steps: [
      "BHA (salicylic acid) for oily or acne-prone skin",
      "AHA (glycolic, lactic or mandelic) for dull, dry skin",
      "Start at once a week, build to 2–3 times",
      "Use at night and moisturize after",
      "Never exfoliate right after shaving or on broken skin",
    ],
    frequency: "2–3 times a week · PM",
    difficulty: "Medium",
    resultsIn: "Smoother, clearer tone in a few weeks",
    tags: ["exfoliation", "aha", "bha", "dead skin", "texture", "glow"],
  },
  {
    key: "skin-cycling",
    emoji: "🔄",
    title: "Skin Cycling",
    category: "Skincare",
    description:
      "Rotate your nights — exfoliate one night, retinoid the next, recovery nights after — so strong actives never collide and your skin stays calm enough to keep using them.",
    steps: [
      "Night 1: exfoliate (BHA or AHA)",
      "Night 2: retinoid",
      "Nights 3–4: cleanse and moisturize only",
      "Use vitamin C on recovery mornings",
      "Shorten or lengthen the recovery window based on how skin feels",
    ],
    frequency: "4-night cycle, repeated",
    difficulty: "Medium",
    resultsIn: "All the active benefits with less irritation",
    tags: ["skin cycling", "routine", "actives", "sensitive", "retinoid", "exfoliation"],
  },
  {
    key: "neck-hands",
    emoji: "🧖",
    title: "Don't Forget Neck & Hands",
    category: "Skincare",
    description:
      "The neck and hands age exactly like the face — they are just pampered far less. Extending your routine there keeps the whole picture consistent.",
    steps: [
      "Run sunscreen and moisturizer down the neck and chest",
      "Apply SPF cream to the backs of your hands daily",
      "The neck usually tolerates the same actives as the face",
    ],
    frequency: "Daily",
    difficulty: "Easy",
    resultsIn: "An even, consistent skin tone",
    tags: ["neck", "hands", "chest", "anti-aging", "spf"],
  },

  // ------------------------------------------------------------------------ Hair
  {
    key: "wash-smart",
    emoji: "🚿",
    title: "Wash Smart, Not Often",
    category: "Hair",
    description:
      "Daily shampoo strips natural oils, leaving hair dry and the scalp overproducing sebum in retaliation. A 2–3 times a week cadence lets your scalp rebalance.",
    steps: [
      "Shampoo 2–3 times a week, or as needed for a genuinely oily scalp",
      "Use a sulfate-free shampoo; condition the mid-lengths to ends",
      "Massage the scalp with fingertips, not nails",
      "Rinse with warm water and finish with a cold splash for shine",
    ],
    frequency: "2–3 times a week",
    difficulty: "Easy",
    resultsIn: "Balanced oil and healthier ends within weeks",
    tags: ["shampoo", "conditioner", "scalp", "oily", "dry", "wash"],
  },
  {
    key: "scalp-massage",
    emoji: "💆",
    title: "Daily Scalp Massage",
    category: "Hair",
    description:
      "Massaging the scalp increases blood flow to the follicles, and regular massage has been linked with thicker-looking hair over months of consistent use.",
    steps: [
      "Use fingertips or a scalp massager in small circles",
      "Keep it up for about 5 minutes, covering temples and crown",
      "Do it while shampooing to save time",
      "Optionally add rosemary oil diluted in a carrier oil",
      "Stay consistent — visible change takes several months",
    ],
    frequency: "Daily · 5 minutes",
    difficulty: "Easy",
    resultsIn: "Thicker-looking hair over 4+ months",
    tags: ["scalp", "massage", "growth", "circulation", "rosemary", "hair volume"],
  },
  {
    key: "minoxidil",
    emoji: "🧪",
    title: "Minoxidil 5% for Thinning",
    category: "Hair",
    description:
      "Minoxidil is proven to regrow and slow hereditary thinning — it works, but only while you keep using it, and it takes months before gains appear.",
    steps: [
      "Apply 1 mL to the thinning area twice a day",
      "Part the hair and apply to the scalp, not the hair",
      "Keep using daily — stopping undoes the gains",
      "A temporary shed at 2–6 weeks is normal, then growth",
      "Check with a doctor or dermatologist first, especially with blood-pressure meds",
    ],
    frequency: "2× daily · long-term",
    difficulty: "Hard",
    resultsIn: "Shed at 2–6 weeks, growth at 3–6 months, peak near 1 year",
    tip: "Consistency is everything — a 50% routine buys you nothing.",
    tags: ["minoxidil", "regrowth", "thinning", "hair loss", "hairline"],
  },
  {
    key: "hair-nutrition",
    emoji: "🥚",
    title: "Feed Your Hair",
    category: "Hair",
    description:
      "Hair is mostly protein and needs minerals to grow. Iron, zinc and vitamin D deficiencies are common, silent causes of shedding.",
    steps: [
      "Eat protein at every meal — your hair is made of it",
      "Get vitamin D and ferritin checked with a doctor (aim vitamin D 20–70 ng/mL)",
      "Include zinc from seeds, meat and shellfish",
      "Avoid crash diets — rapid weight loss can shed hair months later",
      "Only supplement for a confirmed deficiency, and under review",
    ],
    frequency: "Ongoing",
    difficulty: "Medium",
    resultsIn: "Healthier regrowth over months",
    tags: ["hair", "nutrition", "iron", "zinc", "vitamin d", "shedding", "protein"],
  },
  {
    key: "heat-tight",
    emoji: "🌡️",
    title: "Ease Up on Heat & Tight Styles",
    category: "Hair",
    description:
      "Heat styling and tightly-pulled styles damage the hair shaft and stress the follicle, showing up as breakage and a thinner hairline.",
    steps: [
      "Let hair air-dry whenever you can",
      "Always use a heat protectant before any hot tool",
      "Keep tool temperatures low",
      "Skip tight hats, ponytails or styles pulled hard",
      "Trim damaged ends every 6–8 weeks",
    ],
    frequency: "Ongoing",
    difficulty: "Easy",
    resultsIn: "Less breakage in weeks",
    tags: ["heat", "damage", "breakage", "traction", "split ends", "hats"],
  },
  {
    key: "stress-hair",
    emoji: "😌",
    title: "Manage Stress for Hair",
    category: "Hair",
    description:
      "Chronic stress and poor sleep raise cortisol and can push resting hairs into shedding — typically 2–3 months after the stressful period.",
    steps: [
      "Protect your 7–9 hours of sleep (see Sleep & Energy)",
      "Lift and move daily to burn off cortisol",
      "Expect hair shedding 8–12 weeks after a big stress event — it usually self-corrects",
      "Persistent or patchy shedding → see a dermatologist for a blood panel",
    ],
    frequency: "Ongoing",
    difficulty: "Easy",
    resultsIn: "Shedding settles over a few months",
    tags: ["stress", "cortisol", "telogen effluvium", "shedding", "hair loss"],
  },
  {
    key: "cut-for-face",
    emoji: "💇",
    title: "Cut for Your Face",
    category: "Hair",
    description:
      "A haircut chosen for your face shape balances proportions and changes your whole look instantly — the cheapest looksmaxxing move in the book.",
    steps: [
      "Identify your face shape: oval, round, square, heart or long",
      "Round faces get height on top; square faces get soft texture; long faces get width",
      "Bring a reference photo so the barber copies it exactly",
      "Re-book before it grows out of shape — every 4–6 weeks",
    ],
    frequency: "Every 4–6 weeks",
    difficulty: "Easy",
    resultsIn: "Instant",
    tags: ["haircut", "face shape", "barber", "hairstyle", "fringe"],
  },

  // ----------------------------------------------------------- Diet & Nutrition
  {
    key: "high-protein",
    emoji: "🍗",
    title: "High Protein at Every Meal",
    category: "Diet & Nutrition",
    description:
      "Protein builds the muscle that shapes your frame, keeps you full and lean, and feeds skin and hair — which are themselves protein structures.",
    steps: [
      "Aim for roughly 1.6–2.2 g protein per kg of bodyweight daily",
      "Include a protein source at every meal: eggs, meat, fish, beans, tofu, whey",
      "Protein-first snacks: Greek yogurt, jerky, shakes",
      "Spread intake across the day for muscle building",
      "Pair it with lifting for the results you can see (see Fitness & Posture)",
    ],
    frequency: "Daily",
    difficulty: "Medium",
    resultsIn: "Leaner build and better output in months",
    tags: ["protein", "muscle", "leanness", "diet", "jawline", "body fat"],
  },
  {
    key: "cut-sugar",
    emoji: "🚫",
    title: "Cut Added Sugar & Refined Carbs",
    category: "Diet & Nutrition",
    description:
      "Refined sugar spikes insulin, drives inflammation and breakouts, and adds the body fat that hides your face. Cutting it clears skin and trims the face over time.",
    steps: [
      "Cut sodas, juices and sweets first — they are the main offenders",
      "Watch hidden sugar in sauces, cereal and drinks",
      "Choose whole carbs — oats, rice, potatoes — in sensible portions",
      "Expect cravings to fade within about two weeks",
      "Notice smoother energy and clearer skin in weeks",
    ],
    frequency: "Daily",
    difficulty: "Medium",
    resultsIn: "Clearer skin and less face puff within weeks",
    tags: ["sugar", "insulin", "acne", "inflammation", "refined carbs", "sweets"],
  },
  {
    key: "hydrate",
    emoji: "🥤",
    title: "Hydrate: 2–3 Liters a Day",
    category: "Diet & Nutrition",
    description:
      "Mild dehydration makes skin look dull and dark circles worse. Steady hydration keeps skin plump and the whole system running smoothly.",
    steps: [
      "Aim for 2–3 liters daily, more in heat and when training",
      "Drink a glass of water right after waking",
      "Add extra on exercise days",
      "Keep caffeine out of the late afternoon — it dehydrates and hurts sleep",
      "Watch salty food, which puffs your face overnight",
    ],
    frequency: "Daily",
    difficulty: "Easy",
    resultsIn: "Brighter skin within days",
    tags: ["water", "hydration", "skin", "dark circles", "glow", "puffiness"],
  },
  {
    key: "healthy-fats",
    emoji: "🥑",
    title: "Healthy Fats for Skin & Hair",
    category: "Diet & Nutrition",
    description:
      "Omega-3s and unsaturated fats build the healthy cell membranes your skin barrier and hair need. Dry, flaky skin is often simply a low-fat signal.",
    steps: [
      "Eat fatty fish twice a week — salmon, mackerel, sardines",
      "Snack on avocado, nuts and olive-oil-based meals daily",
      "Skip fried and deep-fried foods, which drive inflammation",
      "Seeds — chia, flax, walnuts — give you plant omega-3s",
    ],
    frequency: "Daily",
    difficulty: "Easy",
    resultsIn: "Calmer, less flaky skin in weeks",
    tags: ["omega 3", "fats", "avocado", "skin barrier", "hair", "inflammation"],
  },
  {
    key: "fiber-gut",
    emoji: "🥦",
    title: "Vegetables, Fiber & the Gut–Skin Axis",
    category: "Diet & Nutrition",
    description:
      "Fiber feeds the gut microbiome, and an inflamed gut shows up on the skin. More plant variety is one of the most reliable paths to a clearer complexion.",
    steps: [
      "Aim for 5+ servings of vegetables and fruit a day, in variety",
      "Add fermented foods — kefir, yogurt, kimchi — for the microbiome",
      "Get fiber from whole grains and legumes",
      "Notice breakouts ease as you swap processed food for whole food",
    ],
    frequency: "Daily",
    difficulty: "Easy",
    resultsIn: "Clearer skin over months",
    tags: ["fiber", "gut", "microbiome", "vegetables", "acne", "fermented"],
  },
  {
    key: "less-alcohol",
    emoji: "🍺",
    title: "Drink Less Alcohol",
    category: "Diet & Nutrition",
    description:
      "Alcohol dehydrates, dilates blood vessels into redness, breaks sleep and triggers breakouts. Even a couple of nights a week visibly dulls you.",
    steps: [
      "Cut to 0–2 drinks a week and watch your skin respond",
      "Alternate each alcoholic drink with a glass of water",
      "Skip the nightcap — it halves your deep sleep",
      "Expect less puffiness and clearer eyes within a couple of weeks",
    ],
    frequency: "Weekly goal",
    difficulty: "Medium",
    resultsIn: "Less redness and puffiness in 2 weeks",
    tags: ["alcohol", "dehydration", "redness", "sleep", "puffiness"],
  },
  {
    key: "vitamin-d-fix",
    emoji: "☀️",
    title: "Fix Vitamin D",
    category: "Diet & Nutrition",
    description:
      "A huge share of indoor-living people are low on vitamin D. It supports hair, skin immunity and mood — and low levels are linked to hair shedding.",
    steps: [
      "Get it tested and know your number (typical aim: 20–70 ng/mL)",
      "Get 10–30 minutes of direct sun on skin daily when possible",
      "Consider a vitamin D3 + K supplement in low-sun months",
      "Sunscreen and vitamin D are not enemies — manage both",
      "Re-test after a few months of fixing it",
    ],
    frequency: "Daily / tested seasonally",
    difficulty: "Easy",
    resultsIn: "Better mood, skin and hair over months",
    tags: ["vitamin d", "sunlight", "hair", "immunity", "mood", "supplement"],
  },
  {
    key: "anti-inflammatory",
    emoji: "🟢",
    title: "Anti-Inflammatory Foods",
    category: "Diet & Nutrition",
    description:
      "Chronic inflammation is the common thread in breakouts and premature ageing. Green tea, berries and turmeric are cheap, daily anti-inflammatory tools.",
    steps: [
      "Drink 1–2 cups of green tea a day for its EGCG antioxidants",
      "Eat berries when they are in season or frozen",
      "Add turmeric and ginger to meals",
      "Cut fried oils that fan inflammation",
    ],
    frequency: "Daily",
    difficulty: "Easy",
    resultsIn: "Calmer skin over weeks to months",
    tags: ["inflammation", "green tea", "berries", "turmeric", "antioxidants"],
  },

  // -------------------------------------------------------------- Sleep & Energy
  {
    key: "sleep-7-9",
    emoji: "😴",
    title: "Sleep 7–9 Hours",
    category: "Sleep & Energy",
    description:
      "The highest-ROI looksmaxxing move there is: growth hormone, cortisol drop and skin repair all happen in deep sleep. Nothing in skincare out-performs a good night.",
    steps: [
      "Set a fixed wake time seven days a week",
      "Work backwards to a lights-out target that gives you 7–9 hours",
      "Wind down 30–60 minutes before — dim lights, no screens",
      "Keep caffeine away after mid-afternoon",
      "Treat sleep as non-negotiable — it is the looks routine",
    ],
    frequency: "Every night",
    difficulty: "Easy",
    resultsIn: "Brighter eyes and better skin within a week",
    tags: ["sleep", "8 hours", "growth hormone", "cortisol", "recovery"],
  },
  {
    key: "back-sleep",
    emoji: "🛌",
    title: "Sleep on Your Back",
    category: "Sleep & Energy",
    description:
      "Side and stomach sleeping crush the face all night — a known cause of sleep wrinkles, morning puffiness and uneven facial lines.",
    steps: [
      "Sleep on your back on a thin, supportive pillow",
      "Side-sleepers: a silk or satin pillowcase cuts friction on the face",
      "Slightly elevate the head to limit overnight fluid pooling",
      "If you roll over, tuck pillows on either side to hold position",
    ],
    frequency: "Every night",
    difficulty: "Medium",
    resultsIn: "Fewer sleep lines and less morning puffiness in weeks",
    tags: ["sleep wrinkles", "pillow", "face", "puffiness", "side sleeping"],
  },
  {
    key: "cool-dark-room",
    emoji: "🌙",
    title: "Cool, Dark, Quiet Room",
    category: "Sleep & Energy",
    description:
      "A cool (16–19°C), fully dark room maximizes melatonin and deepens the sleep your skin and hair repair in.",
    steps: [
      "Drop the bedroom temperature a couple of degrees",
      "Blackout curtains or a comfortable sleep mask",
      "Silence the phone and keep it across the room",
      "Keep the same wind-down order every night to anchor the habit",
    ],
    frequency: "Every night",
    difficulty: "Easy",
    resultsIn: "Deeper sleep within nights",
    tags: ["temperature", "blackout", "melatonin", "deep sleep", "bedroom"],
  },
  {
    key: "de-puff-eyes",
    emoji: "🧊",
    title: "De-Puff the Eyes",
    category: "Sleep & Energy",
    description:
      "Morning eye puffiness is fluid that pooled overnight. It is temporary, fixable in minutes — and preventable with diet and sleep habits.",
    steps: [
      "Hold a cold compress or chilled spoon over each eye for 2–3 minutes",
      "Use a caffeine-based under-eye cream to constrict vessels",
      "Splash cold water and tap outward under the eyes to move fluid",
      "Cut salt at dinner and hydrate through the day",
      "Keep the head slightly elevated overnight",
    ],
    frequency: "When needed · most mornings",
    difficulty: "Easy",
    resultsIn: "Minutes — it's a temporary fix; fix salt and sleep too",
    tags: ["puffy eyes", "dark circles", "cold", "caffeine eye cream", "salt"],
  },
  {
    key: "simple-eye-care",
    emoji: "👁️",
    title: "Simple Daily Eye Care",
    category: "Sleep & Energy",
    description:
      "The skin around the eyes is the thinnest on your face and shows tiredness first. A little dedicated care prevents the tired look.",
    steps: [
      "Use a gentle eye moisturizer or around-eye cream",
      "Apply with the ring finger — it applies the least pressure",
      "Wear daily SPF around the orbital bone",
      "Remember: sleep and hydration beat any cream",
    ],
    frequency: "Daily",
    difficulty: "Easy",
    resultsIn: "A less-tired look over weeks",
    tags: ["eye cream", "under eyes", "socket", "fine lines", "spf"],
  },
  {
    key: "caffeine-cutoff",
    emoji: "☕",
    title: "Caffeine Cutoff by Mid-Afternoon",
    category: "Sleep & Energy",
    description:
      "Caffeine can stay in your system for 6–8 hours. Afternoon cups quietly destroy the deep sleep your skin repairs in — without you noticing.",
    steps: [
      "No caffeine after mid-afternoon, especially to start",
      "If you crash in the evening, move your last cup earlier, not later",
      "Watch energy drinks and evening sodas — they count",
    ],
    frequency: "Daily",
    difficulty: "Easy",
    resultsIn: "Deeper, more restful sleep in days",
    tags: ["caffeine", "coffee", "sleep", "energy", "deep sleep"],
  },
  {
    key: "digital-wind-down",
    emoji: "📵",
    title: "Digital Wind-Down",
    category: "Sleep & Energy",
    description:
      "Screens after dark delay melatonin and make falling asleep slower. Your bedtime routine is genuinely a looks routine.",
    steps: [
      "Dim the screens 60 minutes before bed",
      "Toggle blue-light filter if you must scroll late",
      "Do a 5-minute brain-dump onto paper to quiet racing thoughts",
      "Replace night-scrolling with reading or stretching",
    ],
    frequency: "Every night",
    difficulty: "Easy",
    resultsIn: "Faster to sleep within days",
    tags: ["screens", "blue light", "melatonin", "bedtime", "reading"],
  },
  {
    key: "morning-light",
    emoji: "🌅",
    title: "Morning Light for Your Clock",
    category: "Sleep & Energy",
    description:
      "Bright light within 30 minutes of waking locks your circadian rhythm, so daytime energy is steadier and nightly sleep is deeper.",
    steps: [
      "Get outside or sit by a bright window within 30 minutes of waking",
      "Aim for 5–15 minutes of daylight, even when cloudy",
      "Keep your wake time and morning routine consistent",
      "Avoid long daytime naps after 3pm",
    ],
    frequency: "Daily",
    difficulty: "Easy",
    resultsIn: "Better energy and deeper sleep within days",
    tags: ["circadian", "morning sunlight", "energy", "sleep", "melatonin"],
  },

  // --------------------------------------------------------------- Fitness & Posture
  {
    key: "lift-weights",
    emoji: "🏋️",
    title: "Lift Weights 3–5× a Week",
    category: "Fitness & Posture",
    description:
      "Resistance training cuts body fat and builds muscle — and the definition of your jaw, neck and shoulders is mostly body-fat level and frame development.",
    steps: [
      "Train 3–5 full-body or split sessions weekly",
      "Prioritize compounds: squat, deadlift, row, press",
      "Follow a real program you can sustain — see the Fitness app",
      "Add a little weight or a rep each week (progressive overload)",
      "Feed the growth with protein and sleep (see Diet and Sleep)",
    ],
    frequency: "3–5× a week",
    difficulty: "Hard",
    resultsIn: "Visible recomposition by around 3 months",
    tags: ["lifting", "weights", "body recomp", "jawline", "frame", "muscle"],
  },
  {
    key: "chin-tucks",
    emoji: "🧍",
    title: "Chin Tucks for Posture",
    category: "Fitness & Posture",
    description:
      "Forward-head posture gives you a weak neck profile from the side. Chin tucks rebalance the deep neck flexors and straighten the line of your head over your shoulders.",
    steps: [
      "Sit tall with eyes level",
      "Glide the chin straight back — you will feel a stretch at the back of the neck",
      "Hold 3–5 seconds; that mild double-chin pinch is the point",
      "Do 10 reps, 2–3 times a day",
      "Pair with upper-back strength and chest opening",
    ],
    frequency: "2–3× daily · 10 reps",
    difficulty: "Easy",
    resultsIn: "Better side profile in weeks of daily reps",
    tags: ["posture", "neck", "forward head", "chin", "jawline", "side profile"],
  },
  {
    key: "chest-openers",
    emoji: "🧘",
    title: "Chest Openers & Wall Angels",
    category: "Fitness & Posture",
    description:
      "Rounded shoulders pull your head forward and shrink the apparent width of your torso. Opening the chest restores height and a wider look.",
    steps: [
      "Stand against a wall with arms bent at 90 degrees",
      "Slide the forearms up and down the wall like an angel — 10 reps, lower back flat",
      "Add a doorway stretch: 30 seconds, chest forward",
      "Do it 2–3 times a day — posture is a daily habit, not a one-off",
    ],
    frequency: "2–3× daily",
    difficulty: "Medium",
    resultsIn: "Better posture in a few weeks",
    tags: ["posture", "shoulders", "rounding", "chest", "height", "width"],
  },
  {
    key: "cardio",
    emoji: "🏃",
    title: "Regular Cardio",
    category: "Fitness & Posture",
    description:
      "Cardio improves circulation — a natural, healthy flush — lowers stress, and helps cut the body fat that hides your definition.",
    steps: [
      "Aim for 2–5 sessions a week in any modality you enjoy",
      "Steady zone-2 work for 30–60 minutes, or 10–20 minutes of intervals",
      "Use steps as a lever: 8–10k steps daily",
      "Recovery matters — protect your sleep",
    ],
    frequency: "2–5× a week",
    difficulty: "Medium",
    resultsIn: "Healthier-looking skin and trend-down body fat in months",
    tags: ["cardio", "running", "steps", "circulation", "body fat", "glow"],
  },
  {
    key: "get-lean",
    emoji: "⚖️",
    title: "Get Lean for Your Face",
    category: "Fitness & Posture",
    description:
      "Your face shape is dominated by body fat. Getting leaner reveals the jawline, cheekbones and brow like nothing else — it is slow, but it is everything.",
    steps: [
      "Run a modest deficit — 300–500 kcal under maintenance",
      "Keep protein high (see Diet) so you lose fat, not muscle",
      "Weigh in weekly and aim for 0.25–0.5 kg lost per week",
      "Be patient — face fat is often the last fat to go",
      "Judge at 8–12 weeks, not at two",
    ],
    frequency: "Ongoing",
    difficulty: "Hard",
    resultsIn: "The jawline reveal starts by 4–6 weeks of cutting",
    tags: ["body fat", "leanness", "jawline", "calorie deficit", "cheekbones"],
  },
  {
    key: "train-neck",
    emoji: "🎖️",
    title: "Train the Neck & Traps",
    category: "Fitness & Posture",
    description:
      "A thicker neck and shoulders of trap muscle widen your frame and support better posture — an underrated lever for a stronger overall look.",
    steps: [
      "Neck work in a pain-free range: isometric holds or neck curls with your hands",
      "2 sets near fatigue a couple times a week",
      "Build the traps: shrugs, upright rows, farmers carries",
      "Keep sessions short — 5–10 minutes, 2–3× a week",
    ],
    frequency: "2–3× a week",
    difficulty: "Hard",
    resultsIn: "A wider, stronger line over months",
    tags: ["neck", "traps", "jawline", "frame", "posture", "upper body"],
  },
  {
    key: "daily-stretch",
    emoji: "🤸",
    title: "Daily 10-Minute Stretch Flow",
    category: "Fitness & Posture",
    description:
      "Regular mobility keeps joints pain-free for training and stops you from standing crooked — tight hips and hamstrings tilt everything forward.",
    steps: [
      "Stretch 10 minutes daily — hips, hamstrings, chest, neck",
      "Hold each stretch 20–30 seconds, no bouncing",
      "Breathe slowly through each stretch to relax the nervous system",
      "Do it after training or as part of your wind-down",
    ],
    frequency: "Daily · 10 minutes",
    difficulty: "Easy",
    resultsIn: "Freer, taller movement in weeks",
    tags: ["stretching", "mobility", "flexibility", "hip flexors", "hamstrings"],
  },
  {
    key: "daily-steps",
    emoji: "🚶",
    title: "8–10k Steps a Day",
    category: "Fitness & Posture",
    description:
      "Walking is the cheapest fat-loss and stress tool there is — the quiet calories it burns add up to real leanness over months.",
    steps: [
      "Track 8–10k steps a day on your phone",
      "Add three walks: morning, after lunch, evening",
      "Turn phone calls into walking time",
      "Trust the compounding — a few hundred extra steps daily becomes real fat loss",
    ],
    frequency: "Daily",
    difficulty: "Easy",
    resultsIn: "Noticeable leanness in months",
    tags: ["walking", "steps", "fat loss", "neat", "activity"],
  },
  {
    key: "protect-t",
    emoji: "⚡",
    title: "Protect Your Testosterone",
    category: "Fitness & Posture",
    description:
      "Hormones drive your skin, hair and muscle. Testosterone responds to real signals — and the biggest levers are exactly the habits in this app.",
    steps: [
      "Sleep 8 hours — the single biggest lever",
      "Do compound lifts 2–3× a week",
      "Eat healthy fats and adequate protein",
      "Cut alcohol and excess body fat",
      "Manage chronic stress — these are the proven axes",
    ],
    frequency: "Ongoing",
    difficulty: "Medium",
    resultsIn: "Better sleep, body comp and mood over months",
    tags: ["testosterone", "hormones", "sleep", "lifting", "stress"],
  },

  // ------------------------------------------------------------------- Grooming
  {
    key: "eyebrows",
    emoji: "⬆️",
    title: "Eyebrow Maintenance",
    category: "Grooming",
    description:
      "Neat, defined brows frame the eyes — the highest-traffic feature on your face. Trim and tweeze, but never shave.",
    steps: [
      "Every 2–3 weeks: brush up and trim hairs that stray above the top line",
      "Tweeze only hairs outside the natural arch — including the unibrow",
      "Never shave or shave down bald spots; stubble looks far worse",
      "Keep the arch consistent — it is natural, not perfect",
    ],
    frequency: "Every 2–3 weeks",
    difficulty: "Easy",
    resultsIn: "Same day",
    tags: ["eyebrows", "brow", "grooming", "definition", "unibrow"],
  },
  {
    key: "facial-hair",
    emoji: "🪒",
    title: "Choose & Maintain Facial Hair",
    category: "Grooming",
    description:
      "Facial hair changes how your jaw reads from across the room. The rule: either clean-shaven or a structured beard — never an unkempt whisper forest.",
    steps: [
      "Decide deliberately: clean-shaven or structured beard",
      "Clean-shaven: shave with the grain and moisturize after",
      "Beard: keep a clean outline on cheeks and neck, trim to a uniform length",
      "Use beard oil or balm and brush daily",
      "Neckline: about two finger-widths above the Adam's apple for jaw definition",
    ],
    frequency: "Every few days",
    difficulty: "Medium",
    resultsIn: "Immediate — the outline does the work",
    tags: ["beard", "shave", "mustache", "jawline", "stubble"],
  },
  {
    key: "nose-ears",
    emoji: "👃",
    title: "Nose & Ear Hair",
    category: "Grooming",
    description:
      "Stray nose and ear hair is a silent ageing signal. A 30-second weekly groom reads as maintained and younger.",
    steps: [
      "Use a trimmer — never scissors — for nose and ears weekly",
      "Ask your barber to detail the ears during a haircut",
      "Keep the sideburn and temple line tidy",
    ],
    frequency: "Weekly",
    difficulty: "Easy",
    resultsIn: "Instant",
    tags: ["nose hair", "ear hair", "trimmer", "age", "maintained"],
  },
  {
    key: "hands-nails",
    emoji: "💅",
    title: "Hands & Nails",
    category: "Grooming",
    description:
      "Filthy nails flash in every handshake and photo. Two minutes a week keeps the read clean and youthful.",
    steps: [
      "Trim and file weekly — dirt hides under overgrown nails",
      "Push back cuticles with a tool, never cut, and don't bite them",
      "Moisturize your hands after washing to keep them looking young",
    ],
    frequency: "Weekly",
    difficulty: "Easy",
    resultsIn: "Instant",
    tags: ["nails", "hands", "hygiene", "cuticles"],
  },
  {
    key: "fragrance",
    emoji: "🌸",
    title: "Wear Fragrance Right",
    category: "Grooming",
    description:
      "Scent is the invisible layer people remember. Less is more — one well-placed spray reads as put-together.",
    steps: [
      "Apply on pulse points: wrists, neck, chest",
      "Spraying under clothing is the subtle play",
      "One spray, never a douse — you shouldn't smell it on yourself all day",
      "Store it cool and dark so it keeps its top notes",
    ],
    frequency: "When you dress",
    difficulty: "Easy",
    resultsIn: "Instant",
    tags: ["fragrance", "perfume", "cologne", "scent", "pulse points"],
  },
  {
    key: "lip-care",
    emoji: "💋",
    title: "Lip Care",
    category: "Grooming",
    description:
      "Cracked lips age the lower face, and SPF stops the lip darkening that sun quietly burns in.",
    steps: [
      "Carry a lip balm with SPF",
      "Reapply after meals",
      "Stop licking your lips — it dries them out more",
      "If flaky, exfoliate gently once a week",
    ],
    frequency: "Daily",
    difficulty: "Easy",
    resultsIn: "Instant, better over time with SPF",
    tags: ["lips", "lip balm", "spf", "chapped", "hydration"],
  },
  {
    key: "weekly-grooming",
    emoji: "🧰",
    title: "Weekly Grooming Session",
    category: "Grooming",
    description:
      "One 30-minute weekly session stops things from slipping — brows, beard, nose, ears, nails, hair. Consistency beats perfection.",
    steps: [
      "Pick one morning a week and run the full groom",
      "Order: brows → beard → nose/ears → nails → hair check",
      "Book the appointments you need then (barber, etc.)",
      "Maintenance is the point — show up every week",
    ],
    frequency: "Weekly · 30 minutes",
    difficulty: "Easy",
    resultsIn: "Always maintained, never a rescue mission",
    tags: ["weekly", "grooming", "routine", "maintenance", "barber"],
  },

  // ---------------------------------------------------------------- Oral Care
  {
    key: "brush-floss",
    emoji: "🪥",
    title: "Brush & Floss Properly",
    category: "Oral Care",
    description:
      "Teeth and gums dominate first impressions, and a clean smile is the most durable lookmaxxing asset you own.",
    steps: [
      "Brush twice daily for a full 2 minutes with a soft brush",
      "Floss or use interdental brushes daily",
      "Replace the brush every 3 months",
      "See the dentist once or twice a year",
    ],
    frequency: "2× daily",
    difficulty: "Easy",
    resultsIn: "Instant and lifelong",
    tags: ["brush", "floss", "teeth", "gums", "smile", "oral hygiene"],
  },
  {
    key: "tongue-scrape",
    emoji: "👅",
    title: "Scrape the Tongue",
    category: "Oral Care",
    description:
      "A white coated tongue is a major cause of bad breath, and scraping it takes ten seconds a morning.",
    steps: [
      "Scrape daily in the morning before brushing",
      "Five or six light passes from back to front",
      "Rinse the scraper clean between passes",
      "Stay hydrated — dry mouth makes breath worse",
    ],
    frequency: "Daily · morning",
    difficulty: "Easy",
    resultsIn: "Immediate fresher breath",
    tags: ["tongue", "scraper", "bad breath", "halitosis", "breath"],
  },
  {
    key: "nasal-breathing",
    emoji: "🌬️",
    title: "Breathe Through the Nose",
    category: "Oral Care",
    description:
      "Chronic mouth breathing dries gums, feeds plaque and alters face shape during development. Nasal breathing is the default you want.",
    steps: [
      "Breathe through the nose through the day — it filters, moisturizes and warms air",
      "If congestion blocks it, treat the cause: allergy care, saline rinse",
      "Mouth-taping at night only with a doctor's ok, and only if safe",
      "See an ENT for chronic obstruction",
    ],
    frequency: "All day",
    difficulty: "Medium",
    resultsIn: "Better gums and breath over weeks",
    tags: ["mouth breathing", "nasal", "breath", "gums", "posture"],
  },
  {
    key: "safe-whitening",
    emoji: "💡",
    title: "Safe Teeth Whitening",
    category: "Oral Care",
    description:
      "A brighter smile reads as healthier — but whitening done wrong damages enamel and hurts. Go gradual and professional.",
    steps: [
      "Start with a dentist cleaning, then assess your shade",
      "Whiten with trays, strips or dentist treatment — never DIY hacks",
      "Slow the stains: dilute coffee, rinse after, no smoking",
      "Be wary of harsh overuse — translucent, sensitive teeth are the mistake",
    ],
    frequency: "Occasional",
    difficulty: "Medium",
    resultsIn: "A visibly brighter smile in weeks",
    tags: ["whitening", "teeth", "stains", "enamel", "smile"],
  },
  {
    key: "straighten",
    emoji: "😄",
    title: "Straighten if Misaligned",
    category: "Oral Care",
    description:
      "Crooked teeth change your lip line and every photo you take. Alignment work — braces or clear aligners — is the durable fix.",
    steps: [
      "Ask a dentist whether alignment would help your bite and smile",
      "Clear aligners or braces typically take 6–18 months",
      "Jaw and skull issues are for an orthodontist to plan",
      "Treat it as the investment it is — it changes every smile",
    ],
    frequency: "One-time project",
    difficulty: "Hard",
    resultsIn: "Permanent change over a year or so",
    tags: ["braces", "aligners", "orthodontics", "smile", "teeth"],
  },

  // ---------------------------------------------------------------------- Style
  {
    key: "fit-first",
    emoji: "👔",
    title: "Fit Over Everything",
    category: "Style",
    description:
      "A $50 well-fitted shirt beats a $500 baggy one every time. Fit is the single biggest style upgrade available to you.",
    steps: [
      "Learn your numbers: shoulders, chest, waist, sleeve length",
      "Look for fitted shoulders and a slim-through-torso cut",
      "Sleeves right above the wrist; minimal trouser break",
      "Tailoring transforms basics — a quick take-in changes a shirt",
      "Clothes that fit make you look wider and taller",
    ],
    frequency: "Ongoing",
    difficulty: "Easy",
    resultsIn: "Instant",
    tags: ["fit", "tailoring", "shirt", "suit", "measurements"],
  },
  {
    key: "color-palette",
    emoji: "🎨",
    title: "Find Your Palette",
    category: "Style",
    description:
      "Colors that suit your skin tone make you look pulled-together and healthier within seconds of being seen.",
    steps: [
      "Run a quick warm vs. cool seasonal test against your skin",
      "Build on neutrals that flatter you: navy, charcoal, olive, camel",
      "Add one accent color for interest only",
      "Avoid head-to-toe loud tones that fight your coloring",
    ],
    frequency: "One-time setup",
    difficulty: "Easy",
    resultsIn: "Instant",
    tags: ["colors", "palette", "seasonal", "neutrals", "contrast"],
  },
  {
    key: "v-taper",
    emoji: "🔻",
    title: "Build the V-Taper Look",
    category: "Style",
    description:
      "The classic male silhouette is width at the shoulders threading into a narrow waist. You build it twice — in the gym and in the mirror.",
    steps: [
      "Train shoulders and lats: presses, rows, pull-ups",
      "Get lean so the waist reads narrow — body fat is the waist",
      "Dress it: jackets cut across the chest and tapered at the waist",
      "Light shoulder padding in tailoring instantly extends the line",
    ],
    frequency: "Ongoing",
    difficulty: "Hard",
    resultsIn: "A visibly stronger frame over months",
    tags: ["v-taper", "shoulders", "waist", "silhouette", "jacket", "frame"],
  },
  {
    key: "capsule",
    emoji: "🧳",
    title: "Minimal Capsule Wardrobe",
    category: "Style",
    description:
      "Ten to fifteen quality pieces cover every day of the week. Decision fatigue dies, you always match, and you look consistent without trying.",
    steps: [
      "Build around basics: two trousers, three tops, one jacket, clean shoes",
      "Every piece fits you and sits in your palette",
      "Replace worn items thoughtfully rather than buying impulsively",
      "Dress deliberately even on off days — it changes how you carry yourself",
    ],
    frequency: "One-time setup",
    difficulty: "Easy",
    resultsIn: "A consistent, put-together look immediately",
    tags: ["capsule", "minimal", "wardrobe", "basics", "essentials"],
  },
  {
    key: "clean-details",
    emoji: "👟",
    title: "Shoes & Clean Details",
    category: "Style",
    description:
      "Shoes and the small details are what people register first — clean, matched and age-appropriate reads as care.",
    steps: [
      "Rotate 2–3 pairs and keep them clean",
      "Match your belt and shoes",
      "Keep it age-appropriate — no giant logos past your early 20s",
      "Plain socks at the right length",
    ],
    frequency: "Ongoing",
    difficulty: "Easy",
    resultsIn: "Instant",
    tags: ["shoes", "belt", "socks", "details", "clean"],
  },

  // --------------------------------------------------------------------- Mindset
  {
    key: "consistency",
    emoji: "📆",
    title: "Consistency Over Intensity",
    category: "Mindset",
    description:
      "Looks are built by boring daily routine, not heroic bursts. Streaks beat burnouts, every single time.",
    steps: [
      "Do the tiny habits daily — roughly 80% of results come from the basics",
      "Only do what you can sustain; sustainability is the strategy",
      "Track in Routines or Habits so streaks keep you honest",
      "Forgive a slip, then never miss twice",
    ],
    frequency: "Daily",
    difficulty: "Easy",
    resultsIn: "Compounding results over months",
    tags: ["consistency", "streaks", "habits", "discipline", "routine"],
  },
  {
    key: "compete-yesterday",
    emoji: "🪞",
    title: "Compete With Yesterday Only",
    category: "Mindset",
    description:
      "The comparison spiral drives exactly the stress that ages you. Run your own plan and let the mirror be your metric.",
    steps: [
      "Unfollow feeds that make you feel worse about yourself",
      "Compare yourself to a month ago, not to strangers",
      "Remember most \u201Cperfect\u201D faces online are lit, filtered or edited",
      "Your plan plus follow-through is what actually changes your face",
    ],
    frequency: "Ongoing",
    difficulty: "Medium",
    resultsIn: "A healthier mind — which shows on your face",
    tags: ["comparison", "self esteem", "mindset", "social media", "confidence"],
  },
  {
    key: "progress-photos",
    emoji: "📸",
    title: "Monthly Progress Photos",
    category: "Mindset",
    description:
      "You cannot see slow change in the mirror. Photos in the same light tell you the truth — and keep you going.",
    steps: [
      "Photo monthly: same light, same angle, neutral face",
      "Shoot a side profile and a front view each time",
      "Review them to stay motivated — fat loss and skin shifts show at month gaps",
      "Keep them private if you prefer",
    ],
    frequency: "Monthly",
    difficulty: "Easy",
    resultsIn: "Clear evidence of your trend",
    tags: ["progress", "photos", "tracking", "motivation", "streak"],
  },
  {
    key: "lower-stress",
    emoji: "🕊️",
    title: "Lower Daily Stress",
    category: "Mindset",
    description:
      "Cortisol drives belly-fat retention, breakouts and hair shedding. Stress management is not soft — it's a looks habit.",
    steps: [
      "Breathe: 5 minutes of slow box breathing daily",
      "Move for at least 30 minutes a day",
      "Protect deep sleep (see Sleep & Energy)",
      "Stop multi-tasking; schedule real breaks",
      "If stress feels chronic, talk to a professional — this is health",
    ],
    frequency: "Daily",
    difficulty: "Medium",
    resultsIn: "Calmer-looking skin and better sleep in weeks",
    tags: ["stress", "cortisol", "breathing", "mental health", "acne"],
  },
  {
    key: "presence",
    emoji: "😌",
    title: "Body Language & Presence",
    category: "Mindset",
    description:
      "How you hold yourself changes how people read you. Posture, eye contact and calm make you more attractive than any single feature.",
    steps: [
      "Walk tall with shoulders back (see Fitness & Posture)",
      "Hold comfortable eye contact — don't glance away first",
      "Lower your voice and slow down; composure is magnetic",
      "Arrive early rather than rushing in",
    ],
    frequency: "Ongoing",
    difficulty: "Medium",
    resultsIn: "Immediate social reads",
    tags: ["body language", "presence", "eye contact", "confidence", "posture"],
  },
  {
    key: "build-your-stack",
    emoji: "🧰",
    title: "Build Your Stack",
    category: "Mindset",
    description:
      "Tie everything together: your routine, your template, your progress photos. You only need a handful of methods executed daily.",
    steps: [
      "Pick 3–5 methods to start — one per category",
      "Turn them into Routines checklists (see the Templates tab)",
      "Run them daily for 30 days before adding more",
      "Reassess monthly with your progress photos",
    ],
    frequency: "Monthly review",
    difficulty: "Easy",
    resultsIn: "A system you can actually follow",
    tags: ["stack", "plan", "system", "review", "routine", "methods"],
  },
];

export function getMethod(key: string): LooksmaxxingMethod | undefined {
  return METHODS.find((m) => m.key === key);
}

export function methodsForCategory(category: StudyCategory): LooksmaxxingMethod[] {
  return METHODS.filter((m) => m.category === category);
}