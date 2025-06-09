const DEFAULT_BACKEND_PORT = 8080;

// Get backend URL based on current frontend URL
const getBackendUrl = () => {
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:${DEFAULT_BACKEND_PORT}`;
};

export async function getHealthStatus() {
  try {
    const response = await fetch(`${getBackendUrl()}/health`);
    if (!response.ok) throw new Error("Request failed");
    return await response.json();
  } catch (err) {
    console.error("Failed to fetch health:", err);
    return null;
  }
}
