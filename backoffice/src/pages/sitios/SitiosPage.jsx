// src/pages/SitiosPage.jsx (Simplificado para usar AddEditSitioModal)
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase'; // Ajusta la ruta si es necesario

// Importa componentes de Ant Design (solo los necesarios para la página)
import { Table, Button, Space, Tag, Popconfirm, message } from 'antd'; // Añade message
import { BsPlusLg, BsPencilSquare, BsTrash } from 'react-icons/bs';

// Importa el NUEVO componente Modal
import AddEditSitioModal from './components/AddEditSitioModal'; // Ajusta la ruta si es necesario

import './SitiosPage.css';

function SitiosPage() {
    // Estados para la página principal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSitio, setEditingSitio] = useState(null); // Solo para pasar al modal
    const [sitiosList, setSitiosList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null); // Error de carga/eliminación de la lista

    // --- Carga de Datos (sin cambios) ---
    useEffect(() => {
        setIsLoading(true);
        const sitesCollectionRef = collection(db, 'sites');
        const q = query(sitesCollectionRef, orderBy('title'));

        const unsubscribe = onSnapshot(q,
            (querySnapshot) => {
                const sitesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setSitiosList(sitesData);
                setIsLoading(false);
                setError(null);
            },
            (err) => {
                console.error("Error al obtener sitios:", err);
                setError("Error al cargar los datos de los sitios.");
                setIsLoading(false);
            }
        );
        return () => unsubscribe();
    }, []);

    // --- Funciones para controlar el Modal ---
    const handleOpenAddModal = () => {
        setEditingSitio(null); // Limpia el sitio en edición
        setIsModalOpen(true);
    };

    const handleEdit = (sitio) => {
        setEditingSitio(sitio); // Establece el sitio a editar
        setIsModalOpen(true);
    };

     const handleCloseModal = () => {
        setIsModalOpen(false);
        // setEditingSitio(null); // El modal ahora se resetea internamente con destroyOnClose
    };


    // --- Función de Eliminar (se queda aquí, podría moverse a un servicio) ---
    const handleDelete = async (sitioId) => {
        console.log("Intentando eliminar sitio ID:", sitioId);
        try {
            const siteDocRef = doc(db, 'sites', sitioId);
            await deleteDoc(siteDocRef);
            message.success('Sitio eliminado correctamente'); // Usa message de AntD
        } catch (error) {
            console.error("Error al eliminar sitio:", error);
            message.error('Error al eliminar el sitio'); // Usa message de AntD
             // Podríamos querer establecer el estado de error de la página también
             // setError("Error al eliminar el sitio.");
        }
    };

    // --- Definición de Columnas para AntD Table (sin cambios) ---
     const columns = [
         {
             title: 'Título', dataIndex: 'title', key: 'title',
             sorter: (a, b) => a.title.localeCompare(b.title),
         },
         {
             title: 'Categoría', dataIndex: 'category', key: 'category',
             sorter: (a, b) => (a.category || '').localeCompare(b.category || ''),
         },
         { title: 'Ubicación', dataIndex: 'location', key: 'location', },
         {
             title: 'Premium', dataIndex: 'isPremium', key: 'isPremium', align: 'center',
             render: (isPremium) => (<Tag color={isPremium ? 'gold' : 'default'}>{isPremium ? 'Sí' : 'No'}</Tag>),
             filters: [{ text: 'Sí', value: true }, { text: 'No', value: false },],
             onFilter: (value, record) => record.isPremium === value,
         },
         {
             title: 'Acciones', key: 'actions', align: 'center',
             render: (_, record) => (
                 <Space size="small">
                     <Button type="link" icon={<BsPencilSquare />} onClick={() => handleEdit(record)} aria-label="Editar"/>
                     <Popconfirm
                         title="¿Eliminar el sitio?"
                         description="¿Estás seguro?"
                         onConfirm={() => handleDelete(record.id)}
                         okText="Sí" cancelText="No" okButtonProps={{ danger: true }} >
                         <Button type="link" danger icon={<BsTrash />} aria-label="Eliminar"/>
                     </Popconfirm>
                 </Space>
             ),
         },
     ];

    // --- Renderizado del Componente ---
    return (
        <div className="page-container">
            <div className="page-header">
                <h2>Gestión de Sitios</h2>
                <Button type="primary" icon={<BsPlusLg />} onClick={handleOpenAddModal}>
                    Añadir Sitio
                </Button>
            </div>

            <div className="page-content">
                {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>} {/* Muestra error */}

                <Table
                    columns={columns}
                    dataSource={sitiosList}
                    loading={isLoading}
                    rowKey="id"
                    size="middle"
                    style={{ marginTop: '20px' }}
                    pagination={{ pageSize: 10 }}
                />

                {/* Renderiza el componente Modal, pasando los props necesarios */}
                <AddEditSitioModal
                    open={isModalOpen}
                    onClose={handleCloseModal}
                    sitio={editingSitio} // Pasa el sitio actual para editar (o null si es nuevo)
                />
            </div>
        </div>
    );
}

export default SitiosPage;