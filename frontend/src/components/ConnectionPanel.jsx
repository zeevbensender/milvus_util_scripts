// src/components/ConnectionPanel.jsx
import { useState } from 'react';
import { useConnection } from '../context/ConnectionContext.jsx';

export default function ConnectionPanel() {
  const [mode, setMode] = useState('auto');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('19530');

  const { connectToMilvus, status, connected, host: activeHost, port: activePort } = useConnection();

  const handleConnect = () => {
    const targetHost = mode === 'auto' ? 'localhost' : host;
    const targetPort = mode === 'auto' ? '19530' : port;
    connectToMilvus(targetHost, targetPort);
  };

  const renderStatus = () => {
    switch (status) {
      case 'connecting':
        return '🔄 Connecting...';
      case 'connected':
        return `🟢 Connected to ${activeHost}:${activePort}`;
      case 'error':
        return '🔴 Failed to connect';
      case 'idle':
      default:
        return null;
    }
  };

  return (
    <div>
      <h2>Milvus Connection</h2>
      <div>
        <label>
          <input
            type="radio"
            name="mode"
            value="auto"
            checked={mode === 'auto'}
            onChange={() => setMode('auto')}
          />{' '}
          Auto-connect to localhost
        </label>
        <br />
        <label>
          <input
            type="radio"
            name="mode"
            value="remote"
            checked={mode === 'remote'}
            onChange={() => setMode('remote')}
          />{' '}
          Connect to remote host
        </label>
      </div>

      {mode === 'remote' && (
        <div style={{ marginTop: '1rem' }}>
          <label>
            Host:{' '}
            <input value={host} onChange={(e) => setHost(e.target.value)} />
          </label>
          <br />
          <label>
            Port:{' '}
            <input value={port} onChange={(e) => setPort(e.target.value)} />
          </label>
        </div>
      )}

      <button style={{ marginTop: '1rem' }} onClick={handleConnect}>
        Connect
      </button>

      {status && (
        <div style={{ marginTop: '1rem' }}>
          <strong>Status:</strong> {renderStatus()}
        </div>
      )}
    </div>
  );
}
