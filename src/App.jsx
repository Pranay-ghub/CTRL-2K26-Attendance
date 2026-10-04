import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { AttendancePage } from './pages/AttendancePage';
import { PasswordGate } from './pages/PasswordGate';

function ProtectedAttendancePage() {
  const [isVerified, setIsVerified] = useState(
    () => sessionStorage.getItem('ctrl_attendance_access') === 'true'
  );

  if (!isVerified) {
    return <PasswordGate onSuccess={() => setIsVerified(true)} />;
  }

  return <AttendancePage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/attendance" element={<ProtectedAttendancePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
