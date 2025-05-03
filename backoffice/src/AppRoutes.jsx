// src/AppRoutes.jsx (Actualizado con las páginas reales)
import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Importa las páginas existentes
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

// --- Importa las NUEVAS páginas ---
// (Asegúrate de que estos archivos existan en src/pages)
import UsuariosPage from './pages/usuarios/UsuariosPage';
import SitiosPage from './pages/sitios/SitiosPage';
import ServiciosPage from './pages/servicios/ServiciosPage';
import EventosPage from './pages/eventos/EventosPage';
import AppConfigPage from './pages/AppConfigPage';

// Ya no necesitamos PlaceholderPage

// Recibe el usuario como prop para decidir qué rutas mostrar
function AppRoutes({ user }) {
    return (
        <Routes>
            {user ? (
                // --- Rutas para usuarios autenticados ---
                <>
                    <Route path="/" element={<DashboardPage />} />
                    {/* --- Rutas con los componentes de página reales --- */}
                    <Route path="/usuarios" element={<UsuariosPage />} />
                    <Route path="/sitios" element={<SitiosPage />} />
                    <Route path="/servicios" element={<ServiciosPage />} />
                    <Route path="/eventos" element={<EventosPage />} />
                    <Route path="/appconfig" element={<AppConfigPage />} />

                    {/* Ruta por defecto o página 404 (si ninguna ruta coincide dentro del backoffice) */}
                    <Route path="*" element={
                        <div>
                            <h2>404 - Página no encontrada</h2>
                            <p>La ruta solicitada no existe dentro del panel.</p>
                        </div>
                    } />
                </>
            ) : (
                // --- Rutas para usuarios NO autenticados ---
                // Redirige todo a LoginPage si no hay usuario
                <Route path="*" element={<LoginPage />} />
            )}
        </Routes>
    );
}

export default AppRoutes;