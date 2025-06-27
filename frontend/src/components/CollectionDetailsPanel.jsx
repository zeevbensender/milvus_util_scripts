import { useParams, useSearchParams  } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Alert, Spinner, Table, Tabs, Tab } from 'react-bootstrap';
import { getCollectionDetails } from '../api/backend';
import { useMilvusConnection } from '../hooks/useMilvusConnection';


export default function CollectionDetailsPanel() {
  const { name } = useParams();
  const { host, port } = useMilvusConnection();
  const [details, setDetails] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
//   const tabFromUrl = searchParams.get('tab') || 'overview';
  const allowedTabs = ['overview', 'schema', 'indexes'];
  const tabFromUrl = allowedTabs.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'overview';


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
      <Tabs
          activeKey={tabFromUrl}
          onSelect={(k) => setSearchParams({ tab: k })}
          id="collection-tabs"
          className="mb-3"
        >
        <Tab eventKey="overview" title="Overview">
          {getCollectionData(details)}
        </Tab>
        <Tab eventKey="schema" title="Schema">
          {getCollectionSchema(details.schema)}
        </Tab>
        <Tab eventKey="indexes" title="Indexes">
          {getCollectionIndex(details.index_info)}
        </Tab>
      </Tabs>
    </div>
  );
}

function getCollectionData(details) {
  return (
    <div className="mb-4">
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
  if (!schema?.length) return <Alert variant="info">No schema data available.</Alert>;

  const hasAutoId = schema.some((field) => field.auto_id != null);
  const hasDesc = schema.some((field) => field.description);

  return (
    <div className="mb-4">
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
  if (!indexInfo?.length) return <Alert variant="info">No index information available.</Alert>;

  const sorted = [...indexInfo].sort((a, b) => (b.field || '').localeCompare(a.field || ''));

  return (
    <div className="mb-4">
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
              <tr key="index_name">
                <th>Index Name</th>
                <td colSpan={2}>{idx.index_name}</td>
              </tr>
            )}
            {idx.progress && (
              <tr key="progress">
                <td colSpan={3}>
                  Progress: {(idx.progress.indexed_rows / idx.progress.total_rows * 100).toFixed(2)}%
                  (Pending Rows: {idx.progress.pending_index_rows.toLocaleString()})
                </td>
              </tr>
            )}
            {idx.index_param.params && (
              <>
                <tr><th colSpan={3}>Index Parameters</th></tr>
                {Object.entries(idx.index_param.params).map(([key, value]) => (
                  <tr key={key}>
                    <th>{key}</th>
                    <td colSpan={2}>{value.toString()}</td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </Table>
      ))}
    </div>
  );
}
