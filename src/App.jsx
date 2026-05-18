import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BottomNav from './components/BottomNav.jsx';
import Home from './pages/Home.jsx';
import ActiveWorkout from './pages/ActiveWorkout.jsx';
import WorkoutSummary from './pages/WorkoutSummary.jsx';
import History from './pages/History.jsx';
import Progress from './pages/Progress.jsx';
import Stats from './pages/Stats.jsx';

export default function App() {
  return (
    <BrowserRouter basename="/Iron-log">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/workout/active" element={<ActiveWorkout />} />
        <Route path="/workout/summary" element={<WorkoutSummary />} />
        <Route path="/history" element={<History />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/stats" element={<Stats />} />
      </Routes>
      <BottomNav />
    </BrowserRouter>
  );
}
