import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DistribucionPage } from './pages/DistribucionPage';
import { AlimentosPage } from './pages/AlimentosPage';
import { BeneficiariosPage } from './pages/BeneficiariosPage';
import { HistorialPage } from './pages/HistorialPage';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DistribucionPage />} />
          <Route path="alimentos" element={<AlimentosPage />} />
          <Route path="beneficiarios" element={<BeneficiariosPage />} />
          <Route path="historial" element={<HistorialPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
