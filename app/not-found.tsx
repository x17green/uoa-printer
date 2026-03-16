'use client';

export default function NotFound() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '400px',
      padding: '2rem'
    }}>
      <h2 style={{ 
        fontSize: '2rem', 
        fontWeight: 'bold', 
        marginBottom: '1rem' 
      }}>
        404 - Page Not Found
      </h2>
      <p style={{ marginBottom: '2rem' }}>
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <a 
        href="/" 
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: '#3b82f6',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '0.5rem'
        }}
      >
        Go Home
      </a>
    </div>
  );
}
