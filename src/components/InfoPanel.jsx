export default function InfoPanel({ planet, onDismiss }) {
  if (!planet) return null;

  return (
    <div onClick={onDismiss} style={{
      position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(4,6,24,0.92)', border: '0.5px solid rgba(255,255,255,0.13)',
      borderRadius: 12, padding: '13px 22px', minWidth: 230, maxWidth: 340,
      textAlign: 'center', cursor: 'pointer'
    }}>
      <p style={{ margin: '0 0 5px', fontSize: 17, fontWeight: 500, color: '#fff' }}>{planet.name}</p>
      <p style={{ margin: 0, fontSize: 12.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55 }}>{planet.facts}</p>
      <p style={{ margin: '8px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>click to dismiss</p>
    </div>
  );
}