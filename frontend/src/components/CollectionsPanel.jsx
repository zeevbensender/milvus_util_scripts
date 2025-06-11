// src/components/CollectionsPanel.jsx
import { useEffect, useState } from 'react';
import { getCollections } from '../api/backend';
import { CONFIG } from '../utils/config';

export default function CollectionsPanel() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const res = await fetch(`http://${window.location.hostname}:${CONFIG.BACKEND_PORT}/api/milvus/collections`);
        const json = await res.json();
        if (json.status === 'success') {
          setCollections(json.collections);
        } else {
          setError('Failed to load collections');
        }
      } catch (err) {
        console.log(err)
        setError('Error fetching collections');
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  if (loading) return <div>Loading collections...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div>
      <h2>Collections</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Loaded</th>
            <th>Entity Count</th>
            <th>Index Type</th>
          </tr>
        </thead>
        <tbody>
          {collections.map((col) => (
            <tr key={col.name}>
              <td>{col.name}</td>
              <td>{col.description}</td>
              <td>{col.loaded ? 'Yes' : 'No'}</td>
              <td>{col.entity_count.toLocaleString()}</td>
              <td>{col.index_type}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
