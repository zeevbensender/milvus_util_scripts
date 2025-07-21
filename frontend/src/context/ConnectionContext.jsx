// src/context/ConnectionContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { CONFIG } from '../utils/config';

export const ConnectionContext = createContext();

export const ConnectionState = {
   IDLE: 0,
   CONNECTING: 1,
   CONNECTED: 2,
   FAILED: 3,
   DISCONNECTED: 4
}

export function ConnectionProvider({ children }) {
  const [connected, setConnected] = useState(false);
  const [host, setHost] = useState(null);
  const [port, setPort] = useState(null);
  const [status, setStatus] = useState(ConnectionState.IDLE); // idle, connecting, connected, error
  const connectToMilvus = async (targetHost, targetPort) => {
    setStatus(ConnectionState.CONNECTING);
    try {
      const res = await fetch(
        `http://${window.location.hostname}:${CONFIG.BACKEND_PORT}/api/milvus/ping?host=${targetHost}&port=${targetPort}`
      );
      const json = await res.json();
      if (json.connected) {
        setConnected(true);
        setHost(json.host);
        setPort(json.port);
        setStatus(ConnectionState.CONNECTED);

        // Save to localStorage
        localStorage.setItem('milvus_host', json.host);
        localStorage.setItem('milvus_port', json.port);
      } else {
        setConnected(false);
        setStatus(ConnectionState.FAILED);
      }
    } catch (err) {
      setConnected(false);
      setStatus(ConnectionState.FAILED);
    }
  };

  // On first mount, auto-connect if stored values exist
  useEffect(() => {
    const savedHost = localStorage.getItem('milvus_host');
    const savedPort = localStorage.getItem('milvus_port');
    if (savedHost && savedPort) {
      connectToMilvus(savedHost, savedPort);
    } else {
        setStatus(ConnectionState.DISCONNECTED);
    }
  }, []);

  // Background polling
  useEffect(() => {
    if (connected && host && port) {
      const interval = setInterval(() => {
        fetch(`http://${window.location.hostname}:${CONFIG.BACKEND_PORT}/api/milvus/ping?host=${host}&port=${port}`)
          .then(res => res.json())
          .then(json => {
            if (!json.connected) {
              setConnected(false);
              setStatus(ConnectionState.FAILED);
            }
          })
          .catch(() => {
            setConnected(false);
            setStatus(ConnectionState.FAILED);
          });
      }, CONFIG.POLL_INTERVAL_MS);

      return () => clearInterval(interval);
    }
  }, [connected, host, port]);

  return (
    <ConnectionContext.Provider value={{ connected, host, port, status, connectToMilvus }}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  return useContext(ConnectionContext);
}
