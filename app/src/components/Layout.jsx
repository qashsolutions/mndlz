import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Territory Overview', icon: '1' },
  { to: '/stockouts', label: 'Stockout Heatmap', icon: '2' },
  { to: '/archetypes', label: 'Outlet Archetypes', icon: '3' },
  { to: '/basket', label: 'Smart Basket', icon: '4' },
  { to: '/outlet', label: 'Outlet Detail', icon: '5' },
  { to: '/simulation', label: 'Pilot Simulation', icon: '6' },
];

export default function Layout() {
  return (
    <div className="app-layout">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">GT Intelligence</h1>
          <p className="sidebar-subtitle">Mondelez India</p>
        </div>
        <ul className="nav-list">
          {navItems.map(item => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <main className="main-content">
        <Outlet />
        <footer className="disclaimer">
          Prototype — synthetic data for demonstration purposes
        </footer>
      </main>
    </div>
  );
}
