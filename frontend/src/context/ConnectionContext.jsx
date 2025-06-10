import { createContext, useContext, useState } from 'react';

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
      } else {
        setConnected(false);
        setStatus('error');
      }
    } catch (err) {
      setConnected(false);
      setStatus('error');
    }
  };

  return (
    <ConnectionContext.Provider value={{ connected, host, port, status, connectToMilvus }}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  return useContext(ConnectionContext);
}
