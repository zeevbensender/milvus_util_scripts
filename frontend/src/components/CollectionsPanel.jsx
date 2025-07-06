// src/components/CollectionsPanel.jsx
import { useEffect, useState, useContext, useRef } from 'react';
import { getCollections, postMilvusAction } from '../api/backend';
import { ConnectionContext } from '../context/ConnectionContext';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import RenameCollectionModal from './RenameCollectionModal';
import { postMilvusRenameCollection } from '../api/backend';
import ToastManager from './ToastManager';

export default function CollectionsPanel() {
  const { host, port } = useContext(ConnectionContext);
  const isReady = host && port;
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingState, setLoadingState] = useState({ name: null, action: null });
  const [toast, setToast] = useState(null);
  const pollingRef = useRef(null);
  const [sortKey, setSortKey] = useState(() => localStorage.getItem('sortKey') || 'name');
  const [sortAsc, setSortAsc] = useState(() => localStorage.getItem('sortAsc') !== 'false');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameTarget, setRenameTarget] = useState(null);


  const fetchCollections = async () => {
    try {
      const json = await getCollections(host, port);
      if (json.status === 'success') {
        let sorted = [...json.collections];
        sorted.sort((a, b) => {
          const primary = sortAsc
            ? a[sortKey] > b[sortKey]
            : a[sortKey] < b[sortKey];
          if (a[sortKey] !== b[sortKey]) return primary ? 1 : -1;
          return a.name.localeCompare(b.name);
        });
        setCollections(sorted);
      } else {
        setError('Failed to load collections');
      }
    } catch (err) {
      console.error(err);
      setError('Error fetching collections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isReady) return;
    fetchCollections();
    pollingRef.current = setInterval(fetchCollections, 5000);
    return () => clearInterval(pollingRef.current);
  }, [host, port, sortKey, sortAsc]);

  const handleSort = (key) => {
    const newAsc = key === sortKey ? !sortAsc : true;
    setSortKey(key);
    setSortAsc(newAsc);
    localStorage.setItem('sortKey', key);
    localStorage.setItem('sortAsc', newAsc);
  };

    const handleAction = async (action, name) => {
        setLoadingState({ name, action });
        if (action === 'load') {
          postMilvusAction(action, name, host, port)
            .catch((err) => {
              console.error(err);
              setToast({ type: 'error', message: `Failed to trigger load for ${name}` });
            })
            .finally(() => setLoadingState({ name: null, action: null }));
          return;
        }

        if (action === 'drop') {
          const confirmed = window.confirm("Collection will be dropped and data lost forever. Proceed?");
          if (!confirmed) {
            setLoadingState({ name: null, action: null });
            return;
          }
        }

        const res = await postMilvusAction(action, name, host, port);
        setToast({
          type: res.status === 'success' ? 'success' : 'error',
          message: res.message
        });
        setLoadingState({ name: null, action: null });
    };

const renderLoadStateButton = (col, handleAction) => {
  const stateMap = ['NotExist', 'NotLoaded', 'Loading', 'Loaded'];
  const label = stateMap[col.loaded] || 'Unknown';

  const isLoaded = col.loaded === 3;
  const isLoading = col.loaded === 2;
  const isNotLoaded = col.loaded === 1;

  const variant = isLoaded
    ? 'success'
    : isLoading
    ? 'warning'
    : isNotLoaded
    ? 'outline-secondary'
    : 'secondary';

  const tooltipText = isLoaded
    ? 'Release'
    : isNotLoaded
    ? 'Load'
    : null;

  const action = isLoaded
    ? () => handleAction('release', col.name)
    : isNotLoaded
    ? () => handleAction('load', col.name)
    : null;



  const isBusy =
  loadingState.name === col.name &&
  (loadingState.action === 'load' || loadingState.action === 'release');

    const btn = (
      <button
        className={`btn btn-sm btn-${variant} d-inline-flex align-items-center`}
        onClick={action}
        disabled={!action || isBusy}
      >
        {isBusy && <span className="spinner-border spinner-border-sm me-2" role="status" />}
        {label}
      </button>
    );

  return tooltipText ? (
    <OverlayTrigger placement="top" overlay={<Tooltip>{tooltipText}</Tooltip>}>
      <span>{btn}</span>
    </OverlayTrigger>
  ) : (
    btn
  );
};

  return (
    <div>
    <div className="container">
      <h2 className="mb-4">Collections</h2>


      {loading && <div className="text-muted">Loading collections...</div>}
      {error && <div className="text-danger">{error}</div>}

      {!loading && !error && (
        <div className="table-responsive">
          <table className="table table-hover align-middle collections-table table-sm-custom">
            <thead className="table-light">
              <tr>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                    Name{sortKey === 'name' && (sortAsc ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('description')} style={{ cursor: 'pointer' }}>
                    Description{sortKey === 'description' && (sortAsc ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('loaded')} style={{ cursor: 'pointer' }}>
                    Load State{sortKey === 'loaded' && (sortAsc ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('entity_count')} style={{ cursor: 'pointer' }}>
                    Entity Count{sortKey === 'entity_count' && (sortAsc ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('index_type')} style={{ cursor: 'pointer' }}>
                    Index Type{sortKey === 'index_type' && (sortAsc ? '↑' : '↓')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {collections.map((col) => (
                <tr key={col.name}>
                  <td>
                   <a href={`/collections/${encodeURIComponent(col.name)}`} className="text-decoration-none">
                    {col.name}
                   </a>
                  </td>
                  <td>
                    <OverlayTrigger placement="top" overlay={<Tooltip>{col.description}</Tooltip>}>
                      <span className="truncated-cell" title={col.description}>
                        {col.description}
                      </span>
                    </OverlayTrigger>
                  </td>
                  <td>
                    {renderLoadStateButton(col, handleAction)}
                  </td>
                  <td>{col.entity_count.toLocaleString()}</td>
                  <td>{col.index_type}</td>
                  <td>
                    <OverlayTrigger placement="top" overlay={<Tooltip>Compact Collection</Tooltip>}>
                      <button
                        className="btn btn-sm btn-outline-secondary me-2"
                        onClick={() => handleAction('compact', col.name)}
                      >
                        <i className="bi bi-box-seam-fill" />
                      </button>
                    </OverlayTrigger>
                    <OverlayTrigger placement="top" overlay={<Tooltip>Rename Collection</Tooltip>}>
                      <button
                        className="btn btn-sm btn-outline-secondary me-2"
                        onClick={() => {
                          setRenameTarget(col.name);     // You'll define this state
                          setShowRenameModal(true);      // You'll define this state too
                        }}
                      >
                        <i className="bi bi-pencil" />
                      </button>
                    </OverlayTrigger>
                    <OverlayTrigger placement="top" overlay={<Tooltip>Drop Collection</Tooltip>}>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        disabled={loadingState.name === col.name && loadingState.action === 'drop'}
                        onClick={() => handleAction('drop', col.name)}
                      >
                        {loadingState.name === col.name && loadingState.action === 'drop' ? (
                          <span className="spinner-border spinner-border-sm" role="status" />
                        ) : (
                          <i className="bi bi-trash" />
                        )}
                      </button>
                    </OverlayTrigger>

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    <RenameCollectionModal
      show={showRenameModal}
      onClose={() => setShowRenameModal(false)}
      oldName={renameTarget}
      onRename={async (newName) => {
        const res = await postMilvusRenameCollection(renameTarget, newName, host, port);
        setToast({
          type: res.status === 'success' ? 'success' : 'error',
          message: res.message
        });
        setShowRenameModal(false);
        setRenameTarget(null);
        if (res.status === 'success') fetchCollections();
      }}
    />
    <ToastManager toast={toast} setToast={setToast} />
    </div>

  );
}
