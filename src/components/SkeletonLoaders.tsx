export function IdeaSkeleton() {
  return (
    <div className="idea-skeleton" style={{
      background: 'var(--s2)',
      border: '1px solid var(--b1)',
      borderRadius: 'var(--r)',
      padding: '1rem',
      marginBottom: '0.6rem',
      animation: 'pulse 1.5s ease-in-out infinite',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '0.55rem',
      }}>
        <div style={{
          width: '60px',
          height: '20px',
          background: 'var(--b2)',
          borderRadius: '10px',
        }} />
        <div style={{
          width: '80px',
          height: '14px',
          background: 'var(--b2)',
          borderRadius: '4px',
        }} />
      </div>
      <div style={{
        height: '14px',
        background: 'var(--b2)',
        borderRadius: '4px',
        marginBottom: '0.4rem',
      }} />
      <div style={{
        height: '14px',
        width: '70%',
        background: 'var(--b2)',
        borderRadius: '4px',
        marginBottom: '0.8rem',
      }} />
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
      }}>
        <div style={{
          width: '80px',
          height: '32px',
          background: 'var(--b2)',
          borderRadius: 'var(--rsm)',
        }} />
      </div>
    </div>
  );
}

export function PostSkeleton() {
  return (
    <div className="post-skeleton" style={{
      background: 'var(--s2)',
      border: '1px solid var(--b1)',
      borderRadius: 'var(--r)',
      padding: '0.875rem 1rem',
      marginBottom: '0.5rem',
      display: 'flex',
      gap: '0.75rem',
      animation: 'pulse 1.5s ease-in-out infinite',
    }}>
      <div style={{
        width: '46px',
        height: '40px',
        background: 'var(--b2)',
        borderRadius: '4px',
      }} />
      <div style={{ flex: 1 }}>
        <div style={{
          height: '13px',
          width: '60%',
          background: 'var(--b2)',
          borderRadius: '4px',
          marginBottom: '6px',
        }} />
        <div style={{
          height: '12px',
          width: '40%',
          background: 'var(--b2)',
          borderRadius: '4px',
        }} />
      </div>
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="stat-skeleton" style={{
      background: 'var(--s2)',
      border: '1px solid var(--b1)',
      borderRadius: 'var(--r)',
      padding: '1rem',
      animation: 'pulse 1.5s ease-in-out infinite',
    }}>
      <div style={{
        height: '30px',
        width: '50px',
        background: 'var(--b2)',
        borderRadius: '4px',
        marginBottom: '0.2rem',
      }} />
      <div style={{
        height: '11px',
        width: '70%',
        background: 'var(--b2)',
        borderRadius: '4px',
      }} />
    </div>
  );
}