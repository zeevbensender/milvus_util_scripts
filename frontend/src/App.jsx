import { useState } from 'react';
import ConnectionPanel from './components/ConnectionPanel';
import CollectionsPanel from './components/CollectionsPanel';
import StatusBar from './components/StatusBar';

const TABS = {
  CONNECTION: 'connection',
  COLLECTIONS: 'collections',
};

export default function App() {
  const [activeTab, setActiveTab] = useState(TABS.CONNECTION);

  const renderActivePanel = () => {
    switch (activeTab) {
      case TABS.CONNECTION:
        return <ConnectionPanel />;
      case TABS.COLLECTIONS:
        return <CollectionsPanel />;
      default:
        return <div className="p-3">Select a panel from the sidebar</div>;
    }
  };

  return (
    <div className="container-fluid">
      <div className="row vh-100">
        {/* Sidebar */}
        <aside className="col-2 bg-light border-end p-3">
          <h5 className="text-primary">Milvus Admin</h5>
          <ul className="nav flex-column">
            <li className="nav-item">
              <button
                className={`nav-link btn btn-link ${activeTab === TABS.CONNECTION ? 'fw-bold' : ''}`}
                onClick={() => setActiveTab(TABS.CONNECTION)}
              >
                Connection
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link btn btn-link ${activeTab === TABS.COLLECTIONS ? 'fw-bold' : ''}`}
                onClick={() => setActiveTab(TABS.COLLECTIONS)}
              >
                Collections
              </button>
            </li>
          </ul>
        </aside>

        {/* Main Content */}
        <main className="col-10 p-3 position-relative">
          <StatusBar />
          {renderActivePanel()}
        </main>
      </div>
    </div>
  );
}
