import { useEffect, useState } from 'react';
import { getHealthStatus } from './api/backend';

export default function App() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    getHealthStatus().then(setHealth);
  }, []);

  return (
    <div>
      <h1>Milvus Admin Panel</h1>
      <h2>Backend Health:</h2>
      {health ? (
        <pre>{JSON.stringify(health, null, 2)}</pre>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
