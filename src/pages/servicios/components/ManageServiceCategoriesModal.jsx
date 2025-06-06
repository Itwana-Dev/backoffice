// src/pages/servicios/components/ManageServiceCategoriesModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Table, Button, Space, Popconfirm, message, Tooltip, Tag, Image } from 'antd';
import { collection, query, onSnapshot, doc, deleteDoc, orderBy, documentId } from 'firebase/firestore'; // Asegúrate de importar documentId
import { db } from '../../../firebase'; // Ajusta la ruta
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
// Importar el modal para añadir/editar una sola categoría
import AddEditServiceCategoryModal from './AddEditServiceCategoryModal';

function ManageServiceCategoriesModal({ open, onClose }) {
    const [categoriesList, setCategoriesList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Estados para controlar el modal anidado de añadir/editar una sola categoría
    const [isAddEditModalVisible, setIsAddEditModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    // Cargar Categorías de Servicios
    useEffect(() => {
        if (open) { // Solo cargar cuando el modal está abierto
            setIsLoading(true);
            const categoriesCollectionRef = collection(db, 'serviceCategories');
             // Ordenar por el ID (nombre) de la categoría
            const q = query(categoriesCollectionRef, orderBy(documentId(), 'asc'));

            const unsubscribe = onSnapshot(q,
                (querySnapshot) => {
                    const itemsData = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
                    setCategoriesList(itemsData);
                    setIsLoading(false);
                    setError(null);
                },
                (err) => {
                    console.error("Error al obtener serviceCategories:", err);
                    setError("Error al cargar las categorías de servicio.");
                    setIsLoading(false);
                }
            );
            return () => unsubscribe();
        } else {
            setCategoriesList([]); // Limpiar al cerrar el modal principal
            setIsLoading(false);
            setError(null);
        }
    }, [open]); // Dependencia: se ejecuta si el modal principal se abre/cierra

    // Handlers para el modal anidado (AddEditServiceCategoryModal)
    const handleOpenAddModal = () => { setEditingCategory(null); setIsAddEditModalVisible(true); };
    const handleOpenEditModal = (category) => { setEditingCategory(category); setIsAddEditModalVisible(true); };
    const handleCloseAddEditModal = () => { setIsAddEditModalVisible(false); setEditingCategory(null); };

    // Handler para eliminar categoría
    const handleDeleteCategory = async (categoryId) => {
        if (!categoryId) return;
        try {
            // **Consideración:** Eliminar una categoría podría afectar a los profesionales que la usan.
            // Podrías querer verificar si hay profesionales asociados antes de eliminar,
            // o decidir qué hacer con esos profesionales (ej: desvincular la categoría).
            await deleteDoc(doc(db, 'serviceCategories', categoryId));
            message.success(`Categoría "${categoryId}" eliminada.`);
             // onSnapshot actualizará la tabla automáticamente
        } catch (err) {
            console.error("Error al eliminar categoría de servicio:", err);
            message.error(`Error al eliminar la categoría: ${err.message || 'Error desconocido'}`);
            setError(`Error al eliminar la categoría: ${err.message || 'Error desconocido'}`);
        }
    };

    // Columnas de la tabla de categorías
    const columns = [
        { title: 'Nombre (ID)', dataIndex: 'id', key: 'id', sorter: (a, b) => a.id.localeCompare(b.id) },
        { title: 'Icono', dataIndex: 'iconPath', key: 'iconPath', width: 80, render: (url) => url ? <Image src={url} alt="icono" width={40} height={40} style={{ objectFit: 'contain' }}/> : <Tag>N/A</Tag> },
        { title: 'Banners', dataIndex: 'bannerPaths', key: 'bannerPaths', render: (paths) => !paths || paths.length === 0 ? <Tag>0</Tag> : <Tooltip title={paths.join(', ')}><Tag color="blue">{paths.length}</Tag></Tooltip> },
        { title: 'Acciones', key: 'actions', align: 'center', width: 100, render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Editar Categoría"><Button type="link" icon={<EditOutlined />} onClick={() => handleOpenEditModal(record)} /></Tooltip>
                    <Tooltip title="Eliminar Categoría"><Popconfirm title={`¿Eliminar categoría "${record.id}"?`} onConfirm={() => handleDeleteCategory(record.id)} okText="Sí" cancelText="No" okButtonProps={{ danger: true }}><Button type="link" danger icon={<DeleteOutlined />} /></Popconfirm></Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <Modal
            title="Gestionar Categorías de Servicio"
            open={open} // Controlado por el estado de la página principal (ServiciosPage)
            onCancel={onClose} // Llama a la función onClose de la página principal
            width={800}
            footer={[
                <Button key="close" onClick={onClose}>Cerrar</Button>,
                 <Button key="add" type="primary" icon={<PlusOutlined />} onClick={handleOpenAddModal}>Añadir Categoría</Button>,
            ]}
            destroyOnClose={true} // Asegura que el modal se resetee al cerrar
        >
             {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 15 }} />}
            <Table
                columns={columns}
                dataSource={categoriesList}
                loading={isLoading}
                rowKey="id" // Usar el ID del documento como clave única
                size="small"
                pagination={{ pageSize: 5 }}
                scroll={{ y: 300 }} // Permite scroll si hay muchas categorías
            />

            {/* Modal anidado para añadir/editar una sola categoría */}
            {isAddEditModalVisible && (
                 <AddEditServiceCategoryModal
                    open={isAddEditModalVisible} // Controlado por el estado de este modal
                    onClose={handleCloseAddEditModal} // Llama a la función de este modal para cerrar
                    categoryData={editingCategory} // Pasa la categoría si estamos editando
                />
            )}
        </Modal>
    );
}

export default ManageServiceCategoriesModal;