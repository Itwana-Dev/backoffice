// src/pages/components/ManageCategoriesModal.jsx (CORREGIDO Y COMPLETO)
import React, { useState, useEffect } from 'react';
import { Modal, Table, Button, Space, Popconfirm, message, Tooltip, Tag, Image } from 'antd';
import { collection, query, onSnapshot, doc, deleteDoc, orderBy, documentId } from 'firebase/firestore'; // Asegúrate de importar documentId
import { db } from '../../../firebase'; // Ajusta la ruta
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import AddEditCategoryModal from './AddEditCategoryModal'; // Modal para añadir/editar categoría individual

function ManageCategoriesModal({ open, onClose }) {
    const [categoriesList, setCategoriesList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isAddEditModalVisible, setIsAddEditModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    // Cargar Categorías
    useEffect(() => {
        if (open) {
            setIsLoading(true);
            const categoriesCollectionRef = collection(db, 'site_categories');
            const q = query(categoriesCollectionRef, orderBy(documentId(), 'asc')); // Ordenar por ID (nombre)

            const unsubscribe = onSnapshot(q,
                (querySnapshot) => {
                    const itemsData = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
                    setCategoriesList(itemsData);
                    setIsLoading(false);
                    setError(null);
                },
                (err) => {
                    console.error("Error al obtener site_categories:", err);
                    setError("Error al cargar las categorías.");
                    setIsLoading(false);
                }
            );
            return () => unsubscribe();
        } else {
            setCategoriesList([]); // Limpiar al cerrar
            setIsLoading(false);
            setError(null);
        }
    }, [open]);

    // Handlers para modal anidado
    const handleOpenAddModal = () => { setEditingCategory(null); setIsAddEditModalVisible(true); };
    const handleOpenEditModal = (category) => { setEditingCategory(category); setIsAddEditModalVisible(true); };
    const handleCloseAddEditModal = () => { setIsAddEditModalVisible(false); setEditingCategory(null); };

    // Handler para eliminar categoría
    const handleDeleteCategory = async (categoryId) => {
        if (!categoryId) return;
        try {
            await deleteDoc(doc(db, 'site_categories', categoryId));
            message.success(`Categoría "${categoryId}" eliminada.`);
        } catch (err) {
            console.error("Error al eliminar categoría:", err);
            message.error('Error al eliminar la categoría.');
            setError('Error al eliminar la categoría.');
        }
    };

    // Columnas de la tabla
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
        <Modal title="Gestionar Categorías de Sitios" open={open} onCancel={onClose} width={900}
            footer={[
                <Button key="close" onClick={onClose}>Cerrar</Button>,
                 <Button key="add" type="primary" icon={<PlusOutlined />} onClick={handleOpenAddModal}>Añadir Categoría</Button>,
            ]}
            destroyOnClose={true} >
             {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 15 }} />}
            <Table columns={columns} dataSource={categoriesList} loading={isLoading} rowKey="id" size="small" pagination={{ pageSize: 8 }} scroll={{ y: 450 }}/>
            {isAddEditModalVisible && (
                 <AddEditCategoryModal open={isAddEditModalVisible} onClose={handleCloseAddEditModal} categoryData={editingCategory}/>
            )}
        </Modal>
    );
}
export default ManageCategoriesModal;