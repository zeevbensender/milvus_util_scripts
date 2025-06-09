// src/components/ConnectionPanel.jsx
import { useState } from 'react';

export default function ConnectionPanel() {
  const [mode, setMode] = useState('auto');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('19530');
  const [status, setStatus] = useState(null);

  const handleConnect = async () => {
    const targetHost = mode === 'auto' ? 'localhost' : host;
    const targetPort = mode === 'auto' ? '19530' : port;

    try {
      const res = await fetch(`/api/milvus/ping?host=${targetHost}&port=${targetPort}`);
      const json = await res.json();
      setStatus(json.connected ? 'Connected' : 'Failed to connect');
    } catch (err) {
      setStatus('Error connecting');
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
          <strong>Status:</strong> {status}
        </div>
      )}
    </div>
  );
}
