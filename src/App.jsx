import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BottomNav from './components/BottomNav.jsx';
import Home from './pages/Home.jsx';
import ActiveWorkout from './pages/ActiveWorkout.jsx';
import WorkoutSummary from './pages/WorkoutSummary.jsx';
import History from './pages/History.jsx';
import Progress from './pages/Progress.jsx';
import Stats from './pages/Stats.jsx';
import Templates from './pages/Templates.jsx';
import ActiveCardio from './pages/ActiveCardio.jsx';

export default function App() {
  return (
    <BrowserRouter basename="/Iromlog">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/workout/active" element={<ActiveWorkout />} />
        <Route path="/workout/summary" element={<WorkoutSummary />} />
        <Route path="/cardio/active" element={<ActiveCardio />} />
        <Route path="/history" element={<History />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/templates" element={<Templates />} />
      </Routes>
      <BottomNav />
    </BrowserRouter>
  );
}
