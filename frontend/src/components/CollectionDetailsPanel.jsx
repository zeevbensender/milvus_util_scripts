import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Spinner, Table } from 'react-bootstrap';
import { getCollectionDetails } from '../api/backend';
import { useMilvusConnection } from '../hooks/useMilvusConnection';

export default function CollectionDetailsPanel() {
  const { name } = useParams();
  const { host, port } = useMilvusConnection();
  const [details, setDetails] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!host || !port) return;
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
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [name, host, port]);

  if (loading) return <Spinner animation="border" className="m-3" />;
  if (error) return <Alert variant="danger" className="m-3">{error}</Alert>;
  if (!details) return <Alert variant="warning" className="m-3">No collection data available.</Alert>;

  return (
    <div className="m-3">
      <h4>Collection: {name}</h4>
      {getCollectionData(details)}
      {getCollectionSchema(details.schema)}
      {getCollectionIndex(details.index_info)}
    </div>
  );
}

function getCollectionData(details) {
  return (
    <>
      <h5>Collection Info</h5>
      <ul className="list-group mb-4">
        <li className="list-group-item">Collection ID: {details.collection_id || '—'}</li>
        <li className="list-group-item">Description: {details.description || '—'}</li>
        <li className="list-group-item">Entities: {details.entity_count.toLocaleString()}</li>
        <li className="list-group-item">Load State: {['NotExist', 'NotLoad', 'Loading', 'Loaded'][details.load_state] || 'Unknown'}</li>
      </ul>
    </>
  );
}

function getCollectionSchema(schema) {
  if (!schema || !Array.isArray(schema) || schema.length === 0) return null;
  return (
    <>
      <h5>Schema</h5>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Field Name</th>
            <th>Type</th>
            <th>Primary</th>
            <th>Auto ID</th>
            <th>Dimension</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {schema.map((field, i) => (
            <tr key={i}>
              <td>{field.name}</td>
              <td>{field.type}</td>
              <td>{field.primary ? 'Yes' : ''}</td>
              <td>{field.auto_id ? 'Yes' : ''}</td>
              <td>{field.dimension || '—'}</td>
              <td>{field.description || '—'}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}

function getCollectionIndex(indexInfo) {
  if (!indexInfo || !Array.isArray(indexInfo) || indexInfo.length === 0) return null;
  return (
    <>
      <h5>Index Info</h5>
      {indexInfo.map((idx, i) => (
        <div key={i} className="mb-4">
          <Table bordered>
            <tbody>
              <tr>
                <th>Index Name</th>
                <td>{idx.index_name}</td>
              </tr>
              {idx.field !== idx.index_name && (
                <tr>
                  <th>Field Name</th>
                  <td>{idx.field}</td>
                </tr>
              )}
              <tr>
                <th>Index Type</th>
                <td>{idx.index_param?.index_type || '—'}</td>
              </tr>
              <tr>
                <th>Metric Type</th>
                <td>{idx.index_param?.metric_type || '—'}</td>
              </tr>
              {idx.index_param?.params &&
                Object.entries(idx.index_param.params).map(([key, value], j) => (
                  <tr key={j}>
                    <th>{key}</th>
                    <td>{String(value)}</td>
                  </tr>
                ))}
            </tbody>
          </Table>
        </div>
      ))}
    </>
  );
}
