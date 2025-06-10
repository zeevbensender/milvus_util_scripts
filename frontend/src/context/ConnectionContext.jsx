// src/context/ConnectionContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const ConnectionContext = createContext();

export function ConnectionProvider({ children }) {
  const [connected, setConnected] = useState(false);
  const [host, setHost] = useState(null);
  const [port, setPort] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, connecting, connected, error

  const connectToMilvus = async (targetHost, targetPort) => {
    setStatus('connecting');
    try {
      const res = await fetch(
        `http://${window.location.hostname}:8080/api/milvus/ping?host=${targetHost}&port=${targetPort}`
      );
      const json = await res.json();
      if (json.connected) {
        setConnected(true);
        setHost(json.host);
        setPort(json.port);
        setStatus('connected');
        localStorage.setItem('milvus_host', json.host);
        localStorage.setItem('milvus_port', json.port);
      } else {
        setConnected(false);
        setStatus('error');
      }
    } catch (err) {
      setConnected(false);
      setStatus('error');
    }
  };

// Load from localStorage
useEffect(() => {
  const savedHost = localStorage.getItem('milvus_host');
  const savedPort = localStorage.getItem('milvus_port');
  if (savedHost && savedPort) {
    connectToMilvus(savedHost, savedPort);
  }
}, []);


  // Background polling
  useEffect(() => {
    if (connected && host && port) {
      const interval = setInterval(() => {
        fetch(`http://${window.location.hostname}:8080/api/milvus/ping?host=${host}&port=${port}`)
          .then(res => res.json())
          .then(json => {
            if (!json.connected) {
              setConnected(false);
              setStatus('error');
            }
          })
          .catch(() => {
            setConnected(false);
            setStatus('error');
          });
      }, 30000); // every 30 seconds

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
