// src/components/CollectionsPanel.jsx
import { useEffect, useState, useContext } from 'react';
import { getCollections, postMilvusAction } from '../api/backend';
import { ConnectionContext } from '../context/ConnectionContext';

export default function CollectionsPanel() {
  const { host, port } = useContext(ConnectionContext);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

    const handleAction = async (action, name) => {
      const res = await postMilvusAction(action, name, host, port);
      if (res.status === 'success') {
        alert(res.message);
        window.location.reload();  // or re-fetch collections
      } else {
        alert(`Error: ${res.message}`);
      }
    };

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const json = await getCollections(host, port);
        if (json.status === 'success') {
          setCollections(json.collections);
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

    fetchCollections();
  }, []);

  return (
    <div className="container">
      <h2 className="mb-4">Collections</h2>

      {loading && <div className="text-muted">Loading collections...</div>}
      {error && <div className="text-danger">{error}</div>}

      {!loading && !error && (
        <div className="table-responsive">
          <table className="table table-bordered table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Loaded</th>
                <th>Entity Count</th>
                <th>Index Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {collections.map((col) => (
                <tr key={col.name}>
                  <td>{col.name}</td>
                  <td>{col.description}</td>
                  <td>
                    <span className={`badge ${col.loaded ? 'bg-success' : 'bg-secondary'}`}>
                      {col.loaded ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>{col.entity_count.toLocaleString()}</td>
                  <td>{col.index_type}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleAction('load', col.name)}>Load</button>
                    <button className="btn btn-sm btn-outline-warning me-1" onClick={() => handleAction('release', col.name)}>Release</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleAction('drop', col.name)}>Drop</button>
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
