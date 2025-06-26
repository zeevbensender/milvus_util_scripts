import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ConnectionPanel from './components/ConnectionPanel';
import CollectionsPanel from './components/CollectionsPanel';
import CollectionDetailsPanel from './components/CollectionDetailsPanel';
import StatusBar from './components/StatusBar';
import Sidebar from './components/Sidebar';


function AppLayout() {
  return (
    <div className="container-fluid">
      <div className="row vh-100">
        <div className="col-2 d-flex flex-column p-0">
          <Sidebar />
        </div>
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
