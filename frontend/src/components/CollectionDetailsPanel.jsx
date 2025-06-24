import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Spinner } from 'react-bootstrap';
import { ConnectionContext } from '../context/ConnectionContext';
import { getCollectionDetails } from '../api/backend';

export default function CollectionDetailsPanel() {
  const { name } = useParams();
  const { host, port } = useContext(ConnectionContext);
  const [details, setDetails] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
     const effectiveHost = host || localStorage.getItem('milvusHost');
     const effectivePort = port || localStorage.getItem('milvusPort');

    const fetchData = async () => {
      try {
        if (!effectiveHost || !effectivePort){
            return;
        }
        const data = await getCollectionDetails(name, effectiveHost, effectivePort);
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
