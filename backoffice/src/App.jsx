// src/App.jsx (Simplificado, solo configura BrowserRouter)
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppLayout from './AppLayout'; // Importa el nuevo componente de Layout/Auth

function App() {
    return (
        <BrowserRouter>
            <AppLayout /> {/* Renderiza el componente que ahora tiene la lógica */}
        </BrowserRouter>
    );
}

export default App;