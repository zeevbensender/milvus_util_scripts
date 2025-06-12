import { useEffect, useState, useContext } from 'react';
import { getCollections, postMilvusAction } from '../api/backend';
import { ConnectionContext } from '../context/ConnectionContext';

export default function CollectionsPanel() {
  const { host, port } = useContext(ConnectionContext);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  const fetchCollections = async () => {
    try {
      const json = await getCollections(host, port);
      if (json.status === 'success') {
        setCollections(json.collections);
        setError(null);
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
    fetchCollections(); // initial fetch

    const intervalId = setInterval(fetchCollections, 10000); // poll every 10 seconds
    return () => clearInterval(intervalId); // cleanup
  }, []);

  const handleAction = async (action, name) => {
    setActionLoading((prev) => ({ ...prev, [name + action]: true }));
    const res = await postMilvusAction(action, name, host, port);
    if (res.status === 'success') {
      console.log(res.message);
    } else {
      console.error(res.message);
    }
    await fetchCollections(); // refresh after action
    setActionLoading((prev) => ({ ...prev, [name + action]: false }));
  };

  const confirmAndDrop = async (name) => {
    if (window.confirm(`Collection "${name}" will be dropped and data lost forever. Continue?`)) {
      await handleAction('drop', name);
    }
  };

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
                <th>Load State</th>
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
                    <span className={`badge ${
                      col.loaded === 3 ? 'bg-success' :
                      col.loaded === 2 ? 'bg-warning text-dark' :
                      'bg-secondary'
                    }`}>
                      {{
                        0: 'NotExist',
                        1: 'NotLoad',
                        2: 'Loading',
                        3: 'Loaded'
                      }[col.loaded]}
                    </span>
                  </td>
                  <td>{col.entity_count.toLocaleString()}</td>
                  <td>{col.index_type}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-1" disabled={actionLoading[col.name + 'load']} onClick={() => handleAction('load', col.name)}>
                      {actionLoading[col.name + 'load'] ? (
                        <span className="spinner-border spinner-border-sm" role="status" />
                      ) : 'Load'}
                    </button>
                    <button className="btn btn-sm btn-outline-warning me-1" disabled={actionLoading[col.name + 'release']} onClick={() => handleAction('release', col.name)}>
                      {actionLoading[col.name + 'release'] ? (
                        <span className="spinner-border spinner-border-sm" role="status" />
                      ) : 'Release'}
                    </button>
                    <button className="btn btn-sm btn-outline-danger" disabled={actionLoading[col.name + 'drop']} onClick={() => confirmAndDrop(col.name)}>
                      {actionLoading[col.name + 'drop'] ? (
                        <span className="spinner-border spinner-border-sm" role="status" />
                      ) : 'Drop'}
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
