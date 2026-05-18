export const EXERCISES = [
  // Chest
  { id: 'bench-press', name: 'Bench Press', muscleGroup: 'chest', equipment: 'barbell', custom: false },
  { id: 'incline-bench-press', name: 'Incline Bench Press', muscleGroup: 'chest', equipment: 'barbell', custom: false },
  { id: 'incline-db-press', name: 'Incline DB Press', muscleGroup: 'chest', equipment: 'dumbbell', custom: false },
  { id: 'cable-fly', name: 'Cable Fly', muscleGroup: 'chest', equipment: 'cable', custom: false },
  { id: 'pec-deck', name: 'Pec Deck', muscleGroup: 'chest', equipment: 'machine', custom: false },
  { id: 'push-up', name: 'Push Up', muscleGroup: 'chest', equipment: 'bodyweight', custom: false },

  // Back
  { id: 'deadlift', name: 'Deadlift', muscleGroup: 'back', equipment: 'barbell', custom: false },
  { id: 'pull-up', name: 'Pull Up', muscleGroup: 'back', equipment: 'bodyweight', custom: false },
  { id: 'lat-pulldown', name: 'Lat Pulldown', muscleGroup: 'back', equipment: 'cable', custom: false },
  { id: 'seated-cable-row', name: 'Seated Cable Row', muscleGroup: 'back', equipment: 'cable', custom: false },
  { id: 'db-row', name: 'DB Row', muscleGroup: 'back', equipment: 'dumbbell', custom: false },
  { id: 'face-pull', name: 'Face Pull', muscleGroup: 'back', equipment: 'cable', custom: false },

  // Shoulders
  { id: 'ohp', name: 'OHP', muscleGroup: 'shoulders', equipment: 'barbell', custom: false },
  { id: 'db-shoulder-press', name: 'DB Shoulder Press', muscleGroup: 'shoulders', equipment: 'dumbbell', custom: false },
  { id: 'lateral-raise', name: 'Lateral Raise', muscleGroup: 'shoulders', equipment: 'dumbbell', custom: false },
  { id: 'cable-lateral-raise', name: 'Cable Lateral Raise', muscleGroup: 'shoulders', equipment: 'cable', custom: false },
  { id: 'rear-delt-fly', name: 'Rear Delt Fly', muscleGroup: 'shoulders', equipment: 'dumbbell', custom: false },

  // Biceps
  { id: 'barbell-curl', name: 'Barbell Curl', muscleGroup: 'biceps', equipment: 'barbell', custom: false },
  { id: 'db-curl', name: 'DB Curl', muscleGroup: 'biceps', equipment: 'dumbbell', custom: false },
  { id: 'hammer-curl', name: 'Hammer Curl', muscleGroup: 'biceps', equipment: 'dumbbell', custom: false },
  { id: 'cable-curl', name: 'Cable Curl', muscleGroup: 'biceps', equipment: 'cable', custom: false },
  { id: 'preacher-curl', name: 'Preacher Curl', muscleGroup: 'biceps', equipment: 'barbell', custom: false },

  // Triceps
  { id: 'tricep-pushdown', name: 'Tricep Pushdown', muscleGroup: 'triceps', equipment: 'cable', custom: false },
  { id: 'skull-crusher', name: 'Skull Crusher', muscleGroup: 'triceps', equipment: 'barbell', custom: false },
  { id: 'overhead-extension', name: 'Overhead Extension', muscleGroup: 'triceps', equipment: 'dumbbell', custom: false },
  { id: 'close-grip-bench', name: 'Close Grip Bench', muscleGroup: 'triceps', equipment: 'barbell', custom: false },
  { id: 'dips', name: 'Dips', muscleGroup: 'triceps', equipment: 'bodyweight', custom: false },

  // Legs
  { id: 'squat', name: 'Squat', muscleGroup: 'legs', equipment: 'barbell', custom: false },
  { id: 'leg-press', name: 'Leg Press', muscleGroup: 'legs', equipment: 'machine', custom: false },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', muscleGroup: 'legs', equipment: 'barbell', custom: false },
  { id: 'leg-curl', name: 'Leg Curl', muscleGroup: 'legs', equipment: 'machine', custom: false },
  { id: 'leg-extension', name: 'Leg Extension', muscleGroup: 'legs', equipment: 'machine', custom: false },
  { id: 'calf-raise', name: 'Calf Raise', muscleGroup: 'legs', equipment: 'machine', custom: false },

  // Core
  { id: 'plank', name: 'Plank', muscleGroup: 'core', equipment: 'bodyweight', custom: false },
  { id: 'cable-crunch', name: 'Cable Crunch', muscleGroup: 'core', equipment: 'cable', custom: false },
  { id: 'leg-raise', name: 'Leg Raise', muscleGroup: 'core', equipment: 'bodyweight', custom: false },
  { id: 'ab-wheel', name: 'Ab Wheel', muscleGroup: 'core', equipment: 'bodyweight', custom: false },
];

export const MUSCLE_COLORS = {
  chest: '#ff6b35',
  back: '#4ecdc4',
  shoulders: '#3b82f6',
  biceps: '#f59e0b',
  triceps: '#e8ff47',
  legs: '#a855f7',
  core: '#ff4747',
};

export const EQUIPMENT_LABELS = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  cable: 'Cable',
  machine: 'Machine',
  bodyweight: 'Bodyweight',
};
