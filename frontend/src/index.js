/**
 * FRONTEND INDEX.JS
 * React application entry point
 * 
 * WHAT THIS DOES:
 * - Imports React and ReactDOM
 * - Renders App component to DOM
 * - Initializes the entire frontend application
 * - Sets up root mount point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';

// Create root element and render App
// ReactDOM.createRoot is the new React 18 API
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// What this does:
// 1. ReactDOM.createRoot() - Creates React root in <div id="root"> from index.html
// 2. <React.StrictMode> - Highlights potential issues during development
// 3. <App /> - Renders the main App component
// 4. index.html must have <div id="root"></div> in body
