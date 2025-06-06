// src/pages/components/ManageMenuItemsModal.jsx (CORREGIDO EL IMPORT)
import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Table, Button, Space, Popconfirm, message, Tooltip, Tag } from 'antd';
import { collection, query, onSnapshot, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase'; // Ajusta la ruta
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
// --- ¡¡CORRECCIÓN IMPORTANTE AQUÍ!! ---
import AddEditMenuItemModal from './AddEditMenuItemModal'; // Importa el componente correcto

function ManageMenuItemsModal({ open, onClose, sitio }) {
    const [menuItemsList, setMenuItemsList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const [isItemModalVisible, setIsItemModalVisible] = useState(false);
    const [editingMenuItem, setEditingMenuItem] = useState(null);

    const menuItemsCollectionRef = useMemo(() => {
        return sitio?.id ? collection(db, 'sites', sitio.id, 'menuItems') : null;
    }, [sitio?.id]);

    useEffect(() => {
        if (open && menuItemsCollectionRef) {
            setIsLoading(true);
            const q = query(menuItemsCollectionRef, orderBy('name'));

            const unsubscribe = onSnapshot(q,
                (querySnapshot) => {
                    const itemsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setMenuItemsList(itemsData);
                    setIsLoading(false);
                    setError(null);
                },
                (err) => {
                    console.error(`Error al obtener menuItems para ${sitio?.id || 'ID NULO'}:`, err);
                    setError("Error al cargar los productos del menú.");
                    setIsLoading(false);
                }
            );
            return () => unsubscribe();
        } else {
            setMenuItemsList([]);
            setIsLoading(false);
            setError(null);
        }
    }, [open, menuItemsCollectionRef]);

    const handleOpenAddItemModal = () => {
        setEditingMenuItem(null);
        setIsItemModalVisible(true);
    };

    const handleOpenEditItemModal = (item) => {
        setEditingMenuItem(item);
        setIsItemModalVisible(true);
    };

    const handleCloseItemModal = () => {
        setIsItemModalVisible(false);
        setEditingMenuItem(null);
    };

    const handleDeleteMenuItem = async (menuItemId) => {
        if (!menuItemsCollectionRef || !menuItemId) return;
        const itemDocRef = doc(menuItemsCollectionRef, menuItemId);
        try {
            await deleteDoc(itemDocRef);
            message.success('Producto del menú eliminado.');
        } catch (error) {
            console.error("Error al eliminar menuItem:", error);
            message.error('Error al eliminar el producto.');
            setError('Error al eliminar el producto.');
        }
    };

        const columns = [
            {
                title: 'Imagen', dataIndex: 'image', key: 'image', width: 80,
                render: (url) => url ? <img src={url} alt="producto" style={{ width: '50px', height: '50px', objectFit: 'cover' }} /> : <Tag>Sin imagen</Tag>,
            },
            {
                title: 'Nombre', dataIndex: 'name', key: 'name',
                sorter: (a, b) => a.name.localeCompare(b.name),
            },
            {
                title: 'Descripción', dataIndex: 'description', key: 'description',
                 responsive: ['md'],
            },
            {
                title: 'Precio', dataIndex: 'price', key: 'price', align: 'right',
                render: (price) => `$${Number(price || 0).toLocaleString('es-CO')}`,
                sorter: (a, b) => (a.price || 0) - (b.price || 0),
            },
             {
                 title: 'Likes', dataIndex: 'likes', key: 'likes', align: 'center', responsive: ['lg'],
                 sorter: (a, b) => (a.likes || 0) - (b.likes || 0),
             },
            {
                title: 'Acciones', key: 'actions', align: 'center', width: 100,
                render: (_, record) => (
                    <Space size="small">
                        <Tooltip title="Editar Producto">
                            <Button type="link" icon={<EditOutlined />} onClick={() => handleOpenEditItemModal(record)} />
                        </Tooltip>
                        <Tooltip title="Eliminar Producto">
                            <Popconfirm
                                title="¿Eliminar este producto?"
                                onConfirm={() => handleDeleteMenuItem(record.id)}
                                okText="Sí" cancelText="No" okButtonProps={{ danger: true }}
                            >
                                <Button type="link" danger icon={<DeleteOutlined />} />
                            </Popconfirm>
                        </Tooltip>
                    </Space>
                ),
            },
        ];

    return (
        <Modal
            title={`Gestionar Menú de "${sitio?.title || 'Sitio Desconocido'}"`}
            open={open}
            onCancel={onClose}
            width={1000}
            footer={[
                <Button key="close" onClick={onClose}>
                    Cerrar
                </Button>,
                 <Button key="add" type="primary" icon={<PlusOutlined />} onClick={handleOpenAddItemModal}>
                    Añadir Producto
                </Button>,
            ]}
            destroyOnClose={true}
        >
             {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}
            <Table
                columns={columns}
                dataSource={menuItemsList}
                loading={isLoading}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 5 }}
                scroll={{ y: 400 }}
            />

            {/* Ahora esto renderizará el componente AddEditMenuItemModal CORRECTO */}
            {isItemModalVisible && (
                 <AddEditMenuItemModal
                    open={isItemModalVisible}
                    onClose={handleCloseItemModal}
                    sitioId={sitio.id}
                    menuItemData={editingMenuItem}
                />
            )}
        </Modal>
    );
}

export default ManageMenuItemsModal;