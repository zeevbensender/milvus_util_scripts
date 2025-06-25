import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Spinner } from 'react-bootstrap';
import { getCollectionDetails } from '../api/backend';
import { useMilvusConnection } from '../hooks/useMilvusConnection';

export default function CollectionDetailsPanel() {
  const { name } = useParams();
  const { host, port } = useMilvusConnection();
  const [details, setDetails] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!host || !port) {
      console.warn("Host or port not available yet. Skipping fetch.");
      return;
    }

    try {
//       console.log("HOST: " + host + ", PORT: " + port)
      const data = await getCollectionDetails(name, host, port);
//       console.log("===> DATA: " + JSON.stringify(data))
//       console.log("===> COLL ID: " + data.collection_id)
      setDetails(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch collection details:", err);
      setError("Failed to fetch collection details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); // initial load

    const interval = setInterval(() => {
      fetchData(); // periodic refresh
    }, 10000);

    return () => clearInterval(interval); // cleanup
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
        <li className="list-group-item">Collection ID: {details.collection_id || '—'}</li>
        <li className="list-group-item">Description: {details.description || '—'}</li>
        <li className="list-group-item">Entities: {details.entity_count.toLocaleString()}</li>
        <li className="list-group-item">Load State: {['NotExist', 'NotLoad', 'Loading', 'Loaded'][details.load_state] || "Unknown"}</li>

        {/* Extend with more fields if needed */}
      </ul>
      <h5>Schema:</h5>
      <ul className="list-group">
        {details.schema.map((field) => (
        <li className="list-group-item"><b>{field.name}</b> {field.auto_id ? "(AutoId)" : ""} {field.primary ? "(Primary)" : ""} - {field.type}{field.dimension ? " - Dimension: " + field.dimension : ""} </li>
      ))}
      </ul>

    </div>
  );
}

default function IndexTable(indexes) {
    if(!indexes){
        return ""
    }
    return(
      <h5>Index:</h5>
      <ul className="list-group">
        {indexes.map((index) => (
        <li className="list-group-item"><b>{field.name}</b> {field.auto_id ? "(AutoId)" : ""} {field.primary ? "(Primary)" : ""} - {field.type}{field.dimension ? " - Dimension: " + field.dimension : ""} </li>
      ))}
      </ul>

    )
}