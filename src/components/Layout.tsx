import { NavLink, Outlet } from 'react-router-dom';
import { InstallPWA } from './InstallPWA';

export function Layout() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>🛒 App Alimentos</h1>
        <p className="subtitle">Distribución de bolsas</p>
        <InstallPWA />
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="bottom-nav">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          <span className="nav-icon">📦</span>
          <span>Distribuir</span>
        </NavLink>
        <NavLink to="/alimentos" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          <span className="nav-icon">🥫</span>
          <span>Alimentos</span>
        </NavLink>
        <NavLink to="/beneficiarios" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          <span className="nav-icon">👥</span>
          <span>Beneficiados</span>
        </NavLink>
        <NavLink to="/historial" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
          <span className="nav-icon">📋</span>
          <span>Entregas</span>
        </NavLink>
      </nav>
    </div>
  );
}
