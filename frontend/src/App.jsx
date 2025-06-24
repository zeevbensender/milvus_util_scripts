import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import ConnectionPanel from './components/ConnectionPanel';
import CollectionsPanel from './components/CollectionsPanel';
import CollectionDetailsPanel from './components/CollectionDetailsPanel';
import StatusBar from './components/StatusBar';

function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="col-2 bg-light border-end p-3">
      <h5 className="text-primary">Milvus Admin</h5>
      <ul className="nav flex-column">
        <li className="nav-item">
          <button className="nav-link btn btn-link" onClick={() => navigate('/connection')}>
            Connection
          </button>
        </li>
        <li className="nav-item">
          <button className="nav-link btn btn-link" onClick={() => navigate('/collections')}>
            Collections
          </button>
        </li>
      </ul>
    </aside>
  );
}

function AppLayout() {
  return (
    <div className="container-fluid">
      <div className="row vh-100">
        <Sidebar />
        <main className="col-10 p-3 position-relative">
          <StatusBar />
          <Routes>
            <Route path="/" element={<ConnectionPanel />} />
            <Route path="/connection" element={<ConnectionPanel />} />
            <Route path="/collections" element={<CollectionsPanel />} />
            <Route path="/collections/:name" element={<CollectionDetailsPanel />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
