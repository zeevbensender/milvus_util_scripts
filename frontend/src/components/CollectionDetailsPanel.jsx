import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Alert, Spinner, Table, Card } from 'react-bootstrap';
import { getCollectionDetails } from '../api/backend';
import { useMilvusConnection } from '../hooks/useMilvusConnection';

export default function CollectionDetailsPanel() {
  const { name } = useParams();
  const { host, port } = useMilvusConnection();
  const [details, setDetails] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timer;

    const fetchData = async () => {
      try {
        const data = await getCollectionDetails(name, host, port);
        setDetails(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch collection details:', err);
        setError('Failed to fetch collection details');
      } finally {
        setLoading(false);
      }
    };

    if (host && port) {
      fetchData();
      timer = setInterval(fetchData, 5000);
    }

    return () => clearInterval(timer);
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
    <div className="mb-4">
      <h5>Collection Info</h5>
      <Table striped bordered hover responsive style={{ maxWidth: 'fit-content' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Collection ID</th>
            <th>Description</th>
            <th>Entities</th>
            <th>Load State</th>
          </tr>
        </thead>
        <tbody>
            <tr>
              <td>{details.name}</td>
              <td>{details.collection_id}</td>
              <td>{details.description || ''}</td>
              <td>{details.entity_count.toLocaleString()}</td>
              <td>{['NotExist', 'NotLoaded', 'Loading', 'Loaded'][details.load_state] || 'Unknown'}</td>
            </tr>
        </tbody>
      </Table>
    </div>
  );
}

function getCollectionSchema(schema) {
  if (!schema?.length) return null;

  const hasAutoId = schema.some((field) => field.auto_id != null);
  const hasDesc = schema.some((field) => field.description);

  return (
    <div className="mb-4">
      <h5>Schema</h5>
      <Table striped bordered hover responsive style={{ maxWidth: 'fit-content' }}>
        <thead>
          <tr>
            <th>Field Name</th>
            <th>Type</th>
            <th>Primary</th>
            {hasAutoId && <th>Auto ID</th>}
            <th>Dimension</th>
            {hasDesc && <th>Description</th>}
          </tr>
        </thead>
        <tbody>
          {schema.map((field, idx) => (
            <tr key={idx}>
              <td>{field.name}</td>
              <td>{field.type}</td>
              <td>{field.primary ? 'Yes' : ''}</td>
              {hasAutoId && <td>{field.auto_id ? 'Yes' : ''}</td>}
              <td>{field.dimension ?? ''}</td>
              {hasDesc && <td>{field.description || '—'}</td>}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

function getCollectionIndex(indexInfo) {
  if (!indexInfo?.length) return null;

  const sorted = [...indexInfo].sort((a, b) => (b.field || '').localeCompare(a.field || ''));

  return (
    <div className="mb-4">
      <h5>Index Info</h5>
      {sorted.map((idx, i) => (
        <Table striped bordered hover responsive key={i} style={{ maxWidth: 'fit-content' }}>
          <thead>
            <tr>
              <th>Field Name</th>
              <th>Index Type</th>
              <th>Metric Type</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{idx.field}</td>
              <td>{idx.index_param.index_type}</td>
              <td>{idx.index_param.metric_type}</td>
            </tr>
              {idx.index_name !== idx.field && (
              <tr key={key}>
                <th>Index Name</th>
                <td colSpan={2}>{idx.index_name}</td>
              </tr>
              )}
              {idx.progress && (
              <tr key={key}>
                <th>Indexing Progress</th>
                <td colSpan={2}>{idx.progress.indexed_rows} of {idx.progress.total_rows} </td>
              </tr>
              )}
            {Object.entries(idx.index_param.params || {}).map(([key, value]) => (
              <tr key={key}>
                <th>{key}</th>
                <td colSpan={2}>{value.toString()}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      ))}
    </div>
  );
}
