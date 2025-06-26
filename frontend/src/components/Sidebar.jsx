// src/components/Sidebar.jsx
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Sidebar.css';

const navItems = [
  { path: '/connection', icon: 'bi-plug', label: 'Connection' },
  { path: '/collections', icon: 'bi-collection', label: 'Collections' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="sidebar bg-white border-end p-3">
      <h5 className="text-primary mb-4">Milvus Admin</h5>
      <ul className="nav flex-column">
        {navItems.map(({ path, icon, label }) => {
          const active = location.pathname.startsWith(path);
          return (
            <li key={path} className="nav-item">
              <button
                className={`nav-link btn btn-link text-start w-100 d-flex align-items-center ${active ? 'active' : ''}`}
                onClick={() => navigate(path)}
              >
                <i className={`bi ${icon} me-2`}></i>
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
