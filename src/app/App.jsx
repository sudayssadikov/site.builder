import React from 'react';
import { useEditorStore } from '../store/editorStore.js';

export default function App() {
  const { project } = useEditorStore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      <header
        style={{
          height: '48px',
          background: 'var(--bg-panel)',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-heading)', fontSize: '16px' }}>
            SiteBuilder
          </strong>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>| {project.sozlamalar?.nom}</span>
        </div>
      </header>
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>SiteBuilder Ishga Tushirildi</p>
      </main>
    </div>
  );
}
