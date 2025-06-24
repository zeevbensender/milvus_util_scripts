// src/components/CollectionsPanel.jsx
import { useEffect, useState, useContext, useRef } from 'react';
import { getCollections, postMilvusAction } from '../api/backend';
import { ConnectionContext } from '../context/ConnectionContext';

export default function CollectionsPanel() {
  const { host, port } = useContext(ConnectionContext);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingState, setLoadingState] = useState({ name: null, action: null });
  const [toast, setToast] = useState(null);
  const pollingRef = useRef(null);
  const [sortKey, setSortKey] = useState(() => localStorage.getItem('sortKey') || 'name');
  const [sortAsc, setSortAsc] = useState(() => localStorage.getItem('sortAsc') !== 'false');

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

  return (
    <div className="container">
      <h2 className="mb-4">Collections</h2>

      {toast && (
        <div className={`alert alert-${toast.type} alert-dismissible fade show`} role="alert">
          {toast.message}
          <button type="button" className="btn-close" onClick={() => setToast(null)}></button>
        </div>
      )}

      {loading && <div className="text-muted">Loading collections...</div>}
      {error && <div className="text-danger">{error}</div>}

      {!loading && !error && (
        <div className="table-responsive">
          <table className="table table-bordered table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>Name</th>
                <th onClick={() => handleSort('description')} style={{ cursor: 'pointer' }}>Description</th>
                <th onClick={() => handleSort('loaded')} style={{ cursor: 'pointer' }}>Load State</th>
                <th onClick={() => handleSort('entity_count')} style={{ cursor: 'pointer' }}>Entity Count</th>
                <th onClick={() => handleSort('index_type')} style={{ cursor: 'pointer' }}>Index Type</th>
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
                  <td>{col.description}</td>
                  <td>
                    <span className={`badge ${col.loaded === 3 ? 'bg-success' : col.loaded === 2 ? 'bg-warning' : 'bg-secondary'}`}>
                      {['NotExist', 'NotLoad', 'Loading', 'Loaded'][col.loaded] || col.loaded}
                    </span>
                  </td>
                  <td>{col.entity_count.toLocaleString()}</td>
                  <td>{col.index_type}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-1" disabled={loadingState.name === col.name && loadingState.action === 'load'} onClick={() => handleAction('load', col.name)}>
                      {loadingState.name === col.name && loadingState.action === 'load' ? <span className="spinner-border spinner-border-sm" /> : 'Load'}
                    </button>
                    <button className="btn btn-sm btn-outline-warning me-1" disabled={loadingState.name === col.name && loadingState.action === 'release'} onClick={() => handleAction('release', col.name)}>
                      {loadingState.name === col.name && loadingState.action === 'release' ? <span className="spinner-border spinner-border-sm" /> : 'Release'}
                    </button>
                    <button className="btn btn-sm btn-outline-danger" disabled={loadingState.name === col.name && loadingState.action === 'drop'} onClick={() => handleAction('drop', col.name)}>
                      {loadingState.name === col.name && loadingState.action === 'drop' ? <span className="spinner-border spinner-border-sm" /> : 'Drop'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
