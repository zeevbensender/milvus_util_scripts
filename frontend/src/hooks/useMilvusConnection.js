// hooks/useMilvusConnection.js
import { useContext } from 'react';
import { ConnectionContext } from '../context/ConnectionContext';

export function useMilvusConnection() {
  const { host, port } = useContext(ConnectionContext);

  const effectiveHost = host || localStorage.getItem('milvusHost');
  const effectivePort = port || localStorage.getItem('milvusPort');

  return { host: effectiveHost, port: effectivePort };
}