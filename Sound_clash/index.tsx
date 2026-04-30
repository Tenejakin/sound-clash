
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import PhotoPage from './PhotoPage';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const isPhotoPage = window.location.pathname.startsWith('/photo/');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {isPhotoPage ? <PhotoPage /> : <App />}
  </React.StrictMode>
);
