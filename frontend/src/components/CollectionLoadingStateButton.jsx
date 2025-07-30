
const renderLoadStateButton = (col, releaseAction, loadAction, loadingState, isHovering, setIsHovering, setLoadTarget, setShowLoadModal) => {
  const stateMap = ['NotExist', 'NotLoaded', 'Loading', 'Loaded'];
  const label = stateMap[col.loaded] || 'Unknown';

  const isLoaded = col.loaded === 3;
  const isLoading = col.loaded === 2;
  const isNotLoaded = col.loaded === 1;

  const variant = isLoaded
    ? 'success'
    : isLoading
    ? 'warning'
    : isNotLoaded
    ? 'outline-secondary'
    : 'secondary';

  const tooltipText = isLoaded
    ? 'Release'
    : isNotLoaded
    ? 'Load'
    : null;

  const action = isLoaded
    ? () => releaseAction('release', col.name)
    : isNotLoaded
    ? () => {
           setLoadTarget(col.name);
           setShowLoadModal(true);
         }
    : null;



  const isBusy =
  loadingState.name === col.name &&
  (loadingState.action === 'load' || loadingState.action === 'release');

    const btn = (
      <button
        className={`btn btn-sm btn-${variant} d-inline-flex align-items-center`}
        style={{ minWidth: '100px', textAlign: 'center', justifyContent: 'center'}}
        onClick={action}
        disabled={!action || isBusy}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}

      >
        {isBusy && <span className="spinner-border spinner-border-sm me-2" role="status" />}
        {/* {label} */}
        {isHovering ? tooltipText : label}
      </button>
    );
  return btn;
};


export default renderLoadStateButton;