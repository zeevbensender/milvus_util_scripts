import { useContext } from 'react';
import { ConnectionContext } from '../context/ConnectionContext';

export function useMilvusConnection() {
  const { host: contextHost, port: contextPort, status: status } = useContext(ConnectionContext);

  const host = contextHost || localStorage.getItem('milvusHost');
  const port = contextPort || localStorage.getItem('milvusPort');
  return { host, port,  status };
}