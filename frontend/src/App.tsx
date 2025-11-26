import { Routes, Route, Navigate } from 'react-router-dom';
import { Lobby } from './pages/Lobby';
import { Arena } from './pages/Arena';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Lobby />} />
      <Route path="/arena/:duelId" element={<Arena />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
