// src/components/Sidebar.jsx (Con Iconos y nueva estructura)
import React from 'react';
import { NavLink } from 'react-router-dom';
// Importa los iconos que necesitas (ejemplo con Bootstrap Icons)
import {
    BsGrid1X2Fill,      // Icono para Dashboard
    BsPeopleFill,       // Icono para Usuarios
    BsGeoAltFill,       // Icono para Sitios
    BsGearFill,         // Icono para Servicios (usado como ejemplo)
    BsCalendarEventFill,// Icono para Eventos
    BsWrenchAdjustableCircleFill, // Icono para AppConfig
    BsBoxArrowLeft       // Icono para Cerrar Sesión
} from 'react-icons/bs';
import './Sidebar.css'; // Usaremos el CSS rediseñado

function Sidebar({ handleLogout }) {
    // Define los elementos del menú como un array para facilitar la gestión (opcional)
    const menuItems = [
        { path: "/", label: "Dashboard", icon: <BsGrid1X2Fill /> },
        { path: "/usuarios", label: "Usuarios", icon: <BsPeopleFill /> },
        { path: "/sitios", label: "Sitios", icon: <BsGeoAltFill /> },
        { path: "/servicios", label: "Servicios", icon: <BsGearFill /> },
        { path: "/eventos", label: "Eventos", icon: <BsCalendarEventFill /> },
        { path: "/appconfig", label: "AppConfig", icon: <BsWrenchAdjustableCircleFill /> },
    ];

    return (
        <aside className="sidebar"> {/* Cambiado div a aside por semántica */}
            <div className="sidebar-header">
                {/* Puedes añadir un logo aquí si quieres */}
                <h3>ItwanaPlus</h3> {/* Nombre más corto o logo */}
            </div>
            <nav className="sidebar-nav">
                <ul>
                    {menuItems.map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) => isActive ? 'nav-link active-link' : 'nav-link'}
                                // 'end' solo para el dashboard para evitar que esté activo en subrutas
                                end={item.path === "/"}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                <span className="nav-label">{item.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
            <div className="sidebar-footer">
                <button onClick={handleLogout} className="logout-button">
                    <span className="nav-icon"><BsBoxArrowLeft /></span>
                    <span className="nav-label">Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;