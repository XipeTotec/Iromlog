export const EXERCISES = [
  // Chest
  { id: 'bench-press', name: 'Bench Press', apiName: 'barbell bench press', muscleGroup: 'chest', equipment: 'barbell', custom: false },
  { id: 'incline-bench-press', name: 'Incline Bench Press', apiName: 'incline barbell bench press', muscleGroup: 'chest', equipment: 'barbell', custom: false },
  { id: 'incline-db-press', name: 'Incline DB Press', apiName: 'incline dumbbell press', muscleGroup: 'chest', equipment: 'dumbbell', custom: false },
  { id: 'cable-fly', name: 'Cable Fly', apiName: 'cable fly', muscleGroup: 'chest', equipment: 'cable', custom: false },
  { id: 'pec-deck', name: 'Pec Deck', apiName: 'pec deck fly', muscleGroup: 'chest', equipment: 'machine', custom: false },
  { id: 'push-up', name: 'Push Up', apiName: 'push-up', muscleGroup: 'chest', equipment: 'bodyweight', custom: false },

  // Back
  { id: 'deadlift', name: 'Deadlift', apiName: 'deadlift', muscleGroup: 'back', equipment: 'barbell', custom: false },
  { id: 'pull-up', name: 'Pull Up', apiName: 'pull-up', muscleGroup: 'back', equipment: 'bodyweight', custom: false },
  { id: 'lat-pulldown', name: 'Lat Pulldown', apiName: 'cable lat pulldown', muscleGroup: 'back', equipment: 'cable', custom: false },
  { id: 'seated-cable-row', name: 'Seated Cable Row', apiName: 'cable seated row', muscleGroup: 'back', equipment: 'cable', custom: false },
  { id: 'db-row', name: 'DB Row', apiName: 'dumbbell bent over row', muscleGroup: 'back', equipment: 'dumbbell', custom: false },
  { id: 'face-pull', name: 'Face Pull', apiName: 'cable face pull', muscleGroup: 'back', equipment: 'cable', custom: false },

  // Shoulders
  { id: 'ohp', name: 'OHP', apiName: 'barbell overhead press', muscleGroup: 'shoulders', equipment: 'barbell', custom: false },
  { id: 'db-shoulder-press', name: 'DB Shoulder Press', apiName: 'dumbbell shoulder press', muscleGroup: 'shoulders', equipment: 'dumbbell', custom: false },
  { id: 'lateral-raise', name: 'Lateral Raise', apiName: 'dumbbell lateral raise', muscleGroup: 'shoulders', equipment: 'dumbbell', custom: false },
  { id: 'cable-lateral-raise', name: 'Cable Lateral Raise', apiName: 'cable lateral raise', muscleGroup: 'shoulders', equipment: 'cable', custom: false },
  { id: 'rear-delt-fly', name: 'Rear Delt Fly', apiName: 'dumbbell rear lateral raise', muscleGroup: 'shoulders', equipment: 'dumbbell', custom: false },

  // Biceps
  { id: 'barbell-curl', name: 'Barbell Curl', apiName: 'barbell curl', muscleGroup: 'biceps', equipment: 'barbell', custom: false },
  { id: 'db-curl', name: 'DB Curl', apiName: 'dumbbell curl', muscleGroup: 'biceps', equipment: 'dumbbell', custom: false },
  { id: 'hammer-curl', name: 'Hammer Curl', apiName: 'dumbbell hammer curl', muscleGroup: 'biceps', equipment: 'dumbbell', custom: false },
  { id: 'cable-curl', name: 'Cable Curl', apiName: 'cable biceps bar', muscleGroup: 'biceps', equipment: 'cable', custom: false },
  { id: 'preacher-curl', name: 'Preacher Curl', apiName: 'barbell preacher curl', muscleGroup: 'biceps', equipment: 'barbell', custom: false },

  // Triceps
  { id: 'tricep-pushdown', name: 'Tricep Pushdown', apiName: 'cable triceps pushdown', muscleGroup: 'triceps', equipment: 'cable', custom: false },
  { id: 'skull-crusher', name: 'Skull Crusher', apiName: 'ez barbell skull crusher', muscleGroup: 'triceps', equipment: 'barbell', custom: false },
  { id: 'overhead-extension', name: 'Overhead Extension', apiName: 'dumbbell tricep overhead extension', muscleGroup: 'triceps', equipment: 'dumbbell', custom: false },
  { id: 'close-grip-bench', name: 'Close Grip Bench', apiName: 'barbell close-grip bench press', muscleGroup: 'triceps', equipment: 'barbell', custom: false },
  { id: 'dips', name: 'Dips', apiName: 'triceps dips', muscleGroup: 'triceps', equipment: 'bodyweight', custom: false },

  // Legs
  { id: 'squat', name: 'Squat', apiName: 'barbell squat', muscleGroup: 'legs', equipment: 'barbell', custom: false },
  { id: 'leg-press', name: 'Leg Press', apiName: 'leg press', muscleGroup: 'legs', equipment: 'machine', custom: false },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', apiName: 'romanian deadlift', muscleGroup: 'legs', equipment: 'barbell', custom: false },
  { id: 'leg-curl', name: 'Leg Curl', apiName: 'leg curl', muscleGroup: 'legs', equipment: 'machine', custom: false },
  { id: 'leg-extension', name: 'Leg Extension', apiName: 'leg extension', muscleGroup: 'legs', equipment: 'machine', custom: false },
  { id: 'calf-raise', name: 'Calf Raise', apiName: 'standing calf raise', muscleGroup: 'legs', equipment: 'machine', custom: false },

  // Core
  { id: 'plank', name: 'Plank', apiName: 'plank', muscleGroup: 'core', equipment: 'bodyweight', custom: false },
  { id: 'cable-crunch', name: 'Cable Crunch', apiName: 'cable crunch', muscleGroup: 'core', equipment: 'cable', custom: false },
  { id: 'leg-raise', name: 'Leg Raise', apiName: 'hanging leg raise', muscleGroup: 'core', equipment: 'bodyweight', custom: false },
  { id: 'ab-wheel', name: 'Ab Wheel', apiName: 'ab wheel roller', muscleGroup: 'core', equipment: 'bodyweight', custom: false },
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
