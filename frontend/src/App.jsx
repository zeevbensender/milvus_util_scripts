// src/App.jsx
import { useState } from 'react';
import ConnectionPanel from './components/ConnectionPanel';

const TABS = {
  CONNECTION: 'connection',
  // COLLECTIONS: 'collections',
  // QUERIES: 'queries',
};

export default function App() {
  const [activeTab, setActiveTab] = useState(TABS.CONNECTION);

  const renderActivePanel = () => {
    switch (activeTab) {
      case TABS.CONNECTION:
        return <ConnectionPanel />;
      default:
        return <div>Select a panel from the sidebar</div>;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <aside style={{ width: '200px', borderRight: '1px solid #ccc', padding: '1rem' }}>
        <h3>Milvus Admin</h3>
        <nav>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li>
              <button onClick={() => setActiveTab(TABS.CONNECTION)}>Connection</button>
            </li>
            {/* Add more nav items here */}
          </ul>
        </nav>
      </aside>

      <main style={{ flex: 1, padding: '1rem' }}>
        {renderActivePanel()}
      </main>
    </div>
  );
}
