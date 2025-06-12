import { useEffect, useState, useContext, useRef } from 'react';
import { getCollections, postMilvusAction } from '../api/backend';
import { ConnectionContext } from '../context/ConnectionContext';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

export default function CollectionsPanel() {
  const { host, port } = useContext(ConnectionContext);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingState, setLoadingState] = useState({ name: null, action: null });
  const [confirmDrop, setConfirmDrop] = useState(null);
  const toastRef = useRef();

  const fetchCollections = async () => {
    try {
      setLoading(true);
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

  const showToast = (message, type = 'success') => {
    const toastEl = toastRef.current;
    if (toastEl) {
      toastEl.querySelector('.toast-body').textContent = message;
      toastEl.classList.remove('bg-success', 'bg-danger');
      toastEl.classList.add(type === 'error' ? 'bg-danger' : 'bg-success');
      const bsToast = bootstrap.Toast.getOrCreateInstance(toastEl);
      bsToast.show();
    }
  };

  const handleAction = async (action, name) => {
    if (action === 'drop') {
      setConfirmDrop(name);
      return;
    }

    setLoadingState({ name, action });
    try {
      const res = await postMilvusAction(action, name, host, port);
      if (res.status === 'success') {
        await fetchCollections();
        showToast(res.message);
      } else {
        showToast(`Error: ${res.message}`, 'error');
      }
    } catch (err) {
      showToast(`Unexpected error: ${err.message}`, 'error');
    } finally {
      setLoadingState({ name: null, action: null });
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  return (
    <div className="container position-relative">
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
                <th>Load Status</th>
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
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary me-1"
                      onClick={() => handleAction('load', col.name)}
                      disabled={loadingState.name === col.name && loadingState.action === 'load'}
                    >
                      {loadingState.name === col.name && loadingState.action === 'load' ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" /> Loading…
                        </>
                      ) : (
                        'Load'
                      )}
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm btn-outline-warning me-1"
                      onClick={() => handleAction('release', col.name)}
                      disabled={loadingState.name === col.name && loadingState.action === 'release'}
                    >
                      {loadingState.name === col.name && loadingState.action === 'release' ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" /> Releasing…
                        </>
                      ) : (
                        'Release'
                      )}
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleAction('drop', col.name)}
                    >
                      Drop
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirm Drop Modal */}
      {confirmDrop && (
        <div className="modal d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Drop</h5>
                <button type="button" className="btn-close" onClick={() => setConfirmDrop(null)} />
              </div>
              <div className="modal-body">
                <p>
                  The collection <strong>{confirmDrop}</strong> will be permanently dropped. This action cannot be undone.
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setConfirmDrop(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={async () => {
                  const res = await postMilvusAction("drop", confirmDrop, host, port);
                  setConfirmDrop(null);
                  if (res.status === 'success') {
                    await fetchCollections();
                    showToast(res.message);
                  } else {
                    showToast(`Error: ${res.message}`, 'error');
                  }
                }}>Drop</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 9999 }}>
        <div
          className="toast align-items-center text-white border-0"
          role="alert"
          ref={toastRef}
          aria-live="assertive"
          aria-atomic="true"
        >
          <div className="d-flex">
            <div className="toast-body">Placeholder</div>
            <button
              type="button"
              className="btn-close btn-close-white me-2 m-auto"
              data-bs-dismiss="toast"
              aria-label="Close"
            ></button>
          </div>
        </div>
      </div>
    </div>
  );
}
