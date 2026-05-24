import { useEffect, useState } from 'react';
import { fetchAsteroids } from '../services/nasaService';

export default function AsteroidPanel({ onClose }) {
  const [asteroids, setAsteroids] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    fetchAsteroids()
      .then(data => {
        setAsteroids(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load asteroid data.');
        setLoading(false);
      });
  }, []);

  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div style={{
      position:   'absolute',
      top:        0,
      right:      0,
      height:     '100%',
      width:      320,
      background: 'rgba(4,6,24,0.96)',
      borderLeft: '0.5px solid rgba(255,255,255,0.1)',
      display:    'flex',
      flexDirection: 'column',
      overflow:   'hidden',
      zIndex:     10,
    }}>

      {/* Header */}
      <div style={{ padding: '16px 18px 12px', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: '#fff', letterSpacing: '.02em' }}>
            Near-Earth Asteroids
          </p>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0 }}
          >✕</button>
        </div>
        <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
          Live data from NASA NeoWs · {today}
        </p>
      </div>

      {/* Legend */}
      <div style={{ padding: '8px 18px', borderBottom: '0.5px solid rgba(255,255,255,0.06)', display: 'flex', gap: 16 }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff4444', display: 'inline-block' }} />
          Potentially hazardous
        </span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#44aaff', display: 'inline-block' }} />
          Safe
        </span>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {loading && (
          <div style={{ padding: '40px 18px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
            Fetching live data from NASA…
          </div>
        )}

        {error && (
          <div style={{ padding: '40px 18px', textAlign: 'center', color: '#ff6666', fontSize: 13 }}>
            {error}
          </div>
        )}

        {!loading && !error && asteroids.length === 0 && (
          <div style={{ padding: '40px 18px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
            No asteroids found for today.
          </div>
        )}

        {asteroids.map((a, i) => (
          <div
            key={a.id}
            style={{
              padding:      '10px 18px',
              borderBottom: '0.5px solid rgba(255,255,255,0.05)',
              cursor:       'pointer',
              transition:   'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            onClick={() => window.open(a.url, '_blank')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: a.hazardous ? '#ff4444' : '#44aaff',
              }} />
              <p style={{ margin: 0, fontSize: 12.5, fontWeight: 500, color: '#fff', flex: 1, lineHeight: 1.3 }}>
                {a.name}
              </p>
              {a.hazardous && (
                <span style={{ fontSize: 10, color: '#ff6666', border: '0.5px solid #ff444466', borderRadius: 4, padding: '1px 6px', flexShrink: 0 }}>
                  HAZARDOUS
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
              <Stat label="Size" value={`${Number(a.diameter).toLocaleString()} m`} />
              <Stat label="Speed" value={`${Number(a.speed).toLocaleString()} km/h`} />
              <Stat label="Miss dist." value={`${Number(a.missDistance).toLocaleString()} km`} />
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 18px', borderTop: '0.5px solid rgba(255,255,255,0.06)' }}>
        <p style={{ margin: 0, fontSize: 10.5, color: 'rgba(255,255,255,0.2)', lineHeight: 1.5 }}>
          Sorted by closest approach. Click an asteroid to view on NASA JPL.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 1 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.7)', fontVariantNumeric: 'tabular-nums' }}>{value}</p>
    </div>
  );
}