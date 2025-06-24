// src/components/ConnectionPanel.jsx
import { useState } from 'react';
import { useConnection } from '../context/ConnectionContext';

export default function ConnectionPanel() {
  const { connectToMilvus, status, host: connectedHost, port: connectedPort } = useConnection();
  const [mode, setMode] = useState('auto');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('19530');

  // TODO: fetch the host and port values for default
  const handleConnect = () => {
    const targetHost = mode === 'auto' ? 'localhost' : host;
    const targetPort = mode === 'auto' ? '19530' : port;
    connectToMilvus(targetHost, targetPort);
  };

  const renderStatus = () => {
    if (status === 'connected') {
      return (
        <div className="mt-3">
          <strong>Status:</strong>{' '}
          <span className="badge bg-success">
            Connected to {connectedHost}:{connectedPort}
          </span>
        </div>
      );
    } else if (status === 'error') {
      return (
        <div className="mt-3">
          <strong>Status:</strong>{' '}
          <span className="badge bg-danger">Connection Error</span>
        </div>
      );
    } else if (status === 'connecting') {
      return (
        <div className="mt-3">
          <strong>Status:</strong>{' '}
          <span className="badge bg-warning text-dark">Connecting...</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="container">
      <h2 className="mb-4">Milvus Connection</h2>

      <div className="form-check">
        <input
          type="radio"
          id="auto"
          name="mode"
          value="auto"
          checked={mode === 'auto'}
          onChange={() => setMode('auto')}
          className="form-check-input"
        />
        <label htmlFor="auto" className="form-check-label">
          Auto-connect to localhost
        </label>
      </div>

      <div className="form-check mb-3">
        <input
          type="radio"
          id="manual"
          name="mode"
          value="manual"
          checked={mode === 'manual'}
          onChange={() => setMode('manual')}
          className="form-check-input"
        />
        <label htmlFor="manual" className="form-check-label">
          Connect to remote host
        </label>
      </div>

      {mode === 'manual' && (
        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label htmlFor="host" className="form-label">Host</label>
            <input
              id="host"
              type="text"
              className="form-control"
              value={host}
              onChange={(e) => setHost(e.target.value)}
            />
          </div>

          <div className="col-md-6">
            <label htmlFor="port" className="form-label">Port</label>
            <input
              id="port"
              type="text"
              className="form-control"
              value={port}
              onChange={(e) => setPort(e.target.value)}
            />
          </div>
        </div>
      )}

      <button className="btn btn-primary" onClick={handleConnect}>
        Connect
      </button>

      {renderStatus()}
    </div>
  );
}
