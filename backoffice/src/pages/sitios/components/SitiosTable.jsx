// src/components/SitiosTable.jsx
import React from 'react';
// Importa los iconos para los botones de acción
import { BsPencilSquare, BsTrash } from 'react-icons/bs';

// Recibe la lista de sitios y las funciones onEdit/onDelete como props
function SitiosTable({ sitios, onEdit, onDelete }) {

    if (!sitios || sitios.length === 0) {
        return <p>No hay sitios para mostrar.</p>;
    }

    return (
        <table className="sitios-table">
            <thead>
                <tr>
                    <th>Título</th>
                    <th>Categoría</th>
                    <th>Ubicación</th>
                    <th>Premium</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                {sitios.map((sitio) => (
                    <tr key={sitio.id}>
                        <td>{sitio.title || 'N/A'}</td>
                        <td>{sitio.category || 'N/A'}</td>
                        <td>{sitio.location || 'N/A'}</td>
                        <td>
                            {/* Muestra Sí/No o un ícono basado en isPremium */}
                            <span className={`status-badge ${sitio.isPremium ? 'premium' : 'standard'}`}>
                                {sitio.isPremium ? 'Sí' : 'No'}
                            </span>
                        </td>
                        <td>
                            <div className="action-buttons">
                                <button
                                    onClick={() => onEdit(sitio)}
                                    className="edit-button"
                                    title="Editar" // Tooltip para accesibilidad
                                >
                                    <BsPencilSquare />
                                </button>
                                <button
                                    onClick={() => onDelete(sitio.id)}
                                    className="delete-button"
                                    title="Eliminar" // Tooltip para accesibilidad
                                >
                                    <BsTrash />
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default SitiosTable;