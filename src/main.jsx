import React from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  return React.createElement('div', { id: 'site-builder-root' }, 'SiteBuilder');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  React.createElement(React.StrictMode, null, React.createElement(App, null))
);

export default App;
