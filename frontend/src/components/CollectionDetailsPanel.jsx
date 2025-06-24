import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Spinner } from 'react-bootstrap';
// import { ConnectionContext } from '../context/ConnectionContext';
import { getCollectionDetails } from '../api/backend';
import { useMilvusConnection } from '../hooks/useMilvusConnection.js'

export default function CollectionDetailsPanel() {
  const { name } = useParams();
//   const { host, port } = useContext(ConnectionContext);
  const [details, setDetails] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { host, port } = useMilvusConnection();
  const isReady = host && port;

  useEffect(() => {
    if (!isReady) return;
    const fetchData = async () => {
      try {
        const data = await getCollectionDetails(name, host, port);
        setDetails(data);
      } catch (err) {
        console.error("Failed to fetch collection details:", err);
        setError("Failed to fetch collection details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [name, host, port]);

  if (loading) {
    return <Spinner animation="border" className="m-3" />;
  }

  if (error) {
    return <Alert variant="danger" className="m-3">{error}</Alert>;
  }

  if (!details) {
    return <Alert variant="warning" className="m-3">No collection data available.</Alert>;
  }

  return (
    <div className="m-3">
      <h4>Collection: {name}</h4>
      <ul className="list-group">
        <li className="list-group-item">Description: {details.description || '—'}</li>
        <li className="list-group-item">Index Type: {details.index_type}</li>
        <li className="list-group-item">Entities: {details.entity_count}</li>
        <li className="list-group-item">Load State: {details.load_state}</li>
        {/* Extend with more fields as needed */}
      </ul>
    </div>
  );
}
