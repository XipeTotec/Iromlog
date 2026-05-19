const BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

// Maps our exercise IDs → image URL from the free public exercise DB (no auth needed)
export const EXERCISE_IMAGES = {
  'bench-press':         `${BASE}/Barbell_Bench_Press_-_Medium_Grip/0.jpg`,
  'incline-bench-press': `${BASE}/Barbell_Incline_Bench_Press_-_Medium_Grip/0.jpg`,
  'incline-db-press':    `${BASE}/Dumbbell_Incline_Bench_Press/0.jpg`,
  'cable-fly':           `${BASE}/Cable_Fly/0.jpg`,
  'pec-deck':            `${BASE}/Lever_Pec_Deck_Fly/0.jpg`,
  'push-up':             `${BASE}/Push-Up/0.jpg`,

  'deadlift':            `${BASE}/Barbell_Deadlift/0.jpg`,
  'pull-up':             `${BASE}/Pull-up/0.jpg`,
  'lat-pulldown':        `${BASE}/Cable_Lat_Pulldown/0.jpg`,
  'seated-cable-row':    `${BASE}/Cable_Seated_Row/0.jpg`,
  'db-row':              `${BASE}/Dumbbell_One-Arm_Row/0.jpg`,
  'face-pull':           `${BASE}/Cable_Face_Pull/0.jpg`,

  'ohp':                 `${BASE}/Barbell_Shoulder_Press/0.jpg`,
  'db-shoulder-press':   `${BASE}/Dumbbell_Shoulder_Press/0.jpg`,
  'lateral-raise':       `${BASE}/Dumbbell_Lateral_Raise/0.jpg`,
  'cable-lateral-raise': `${BASE}/Cable_Side_Lateral_Raise/0.jpg`,
  'rear-delt-fly':       `${BASE}/Dumbbell_Bent-Over_Lateral_Raise/0.jpg`,

  'barbell-curl':        `${BASE}/Barbell_Curl/0.jpg`,
  'db-curl':             `${BASE}/Dumbbell_Alternate_Bicep_Curl/0.jpg`,
  'hammer-curl':         `${BASE}/Dumbbell_Hammer_Curl/0.jpg`,
  'cable-curl':          `${BASE}/Cable_Hammer_Curls_-_Rope_Attachment/0.jpg`,
  'preacher-curl':       `${BASE}/Barbell_Preacher_Curl/0.jpg`,

  'tricep-pushdown':     `${BASE}/Pushdown/0.jpg`,
  'skull-crusher':       `${BASE}/EZ-Bar_Skullcrusher/0.jpg`,
  'overhead-extension':  `${BASE}/Dumbbell_Seated_Triceps_Extension/0.jpg`,
  'close-grip-bench':    `${BASE}/Close-Grip_Barbell_Bench_Press/0.jpg`,
  'dips':                `${BASE}/Dips_-_Triceps_Version/0.jpg`,

  'squat':               `${BASE}/Barbell_Full_Squat/0.jpg`,
  'leg-press':           `${BASE}/Leg_Press/0.jpg`,
  'romanian-deadlift':   `${BASE}/Romanian_Deadlift/0.jpg`,
  'leg-curl':            `${BASE}/Leg_Curl/0.jpg`,
  'leg-extension':       `${BASE}/Leg_Extensions/0.jpg`,
  'calf-raise':          `${BASE}/Standing_Calf_Raises/0.jpg`,

  'plank':               `${BASE}/Plank/0.jpg`,
  'cable-crunch':        `${BASE}/Cable_Crunch/0.jpg`,
  'leg-raise':           `${BASE}/Lying_Leg_Raise/0.jpg`,
  'ab-wheel':            `${BASE}/Ab_Roller/0.jpg`,
};
