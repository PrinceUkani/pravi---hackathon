import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppRoutes } from './routes/AppRoutes';

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: '#042716',
                color: '#f8faf9',
                borderRadius: '12px',
                border: '1px solid #0d4f2e',
                fontSize: '12px',
                fontWeight: '500',
                boxShadow: '0 10px 25px -5px rgba(4, 39, 22, 0.4)',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#042716',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#042716',
                },
              },
            }}
          />
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
