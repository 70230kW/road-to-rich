type SkeletonLayout = 'data' | 'collection' | 'form';

const DATA_TABS = new Set(['dashboard', 'ranking', 'history', 'rank', 'simulator']);
const COLLECTION_TABS = new Set(['trophies', 'rules', 'seasons']);

function getLayout(tab: string): SkeletonLayout {
  if (DATA_TABS.has(tab)) return 'data';
  if (COLLECTION_TABS.has(tab)) return 'collection';
  return 'form';
}

export function TabSkeleton({ tab, compact = false, label = '画面を読み込み中' }: {
  tab: string;
  compact?: boolean;
  label?: string;
}) {
  const layout = getLayout(tab);

  return (
    <div className={`premium-skeleton premium-skeleton-${layout}${compact ? ' is-compact' : ''}`} role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="premium-skeleton-content" aria-hidden="true">
        {!compact && (
          <div className="skeleton-heading-card">
            <i className="skeleton-icon" />
            <div><i className="skeleton-kicker" /><i className="skeleton-title" /><i className="skeleton-description" /></div>
          </div>
        )}

        {layout === 'data' && (
          <>
            <div className="skeleton-filter-row">{Array.from({ length: 4 }, (_, index) => <i key={index} />)}</div>
            <div className="skeleton-feature-card"><i /><i /><i /></div>
            <div className="skeleton-metric-grid">{Array.from({ length: 4 }, (_, index) => <i key={index} />)}</div>
            <div className="skeleton-wide-panel"><i /><i /><i /></div>
          </>
        )}

        {layout === 'collection' && (
          <>
            <div className="skeleton-overview-row">{Array.from({ length: 3 }, (_, index) => <i key={index} />)}</div>
            <div className="skeleton-search-field" />
            <div className="skeleton-card-grid">{Array.from({ length: 4 }, (_, index) => <i key={index} />)}</div>
          </>
        )}

        {layout === 'form' && (
          <>
            <div className="skeleton-overview-row">{Array.from({ length: 3 }, (_, index) => <i key={index} />)}</div>
            <div className="skeleton-form-panel"><i /><i /></div>
            <div className="skeleton-card-grid">{Array.from({ length: 2 }, (_, index) => <i key={index} />)}</div>
          </>
        )}
      </div>
    </div>
  );
}
