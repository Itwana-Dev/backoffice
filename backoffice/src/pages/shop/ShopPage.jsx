// src/pages/ShopPage.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase'; // Ajusta la ruta si es necesario

// Importa componentes de Ant Design
import { Table, Button, Space, Tag, Popconfirm, message, Tooltip, Input, Image } from 'antd';
import { BsPlusLg, BsPencilSquare, BsTrash } from 'react-icons/bs'; // Iconos para acciones
import { SearchOutlined } from '@ant-design/icons'; // Icono de búsqueda

// Importar el Modal de añadir/editar producto
import AddEditProductModal from './components/AddEditProductModal'; // Importación corregida

import './ShopPage.css'; // Asegúrate de tener este archivo CSS

function ShopPage() {
    // --- Estados para los productos ---
    const [productsList, setProductsList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Estados y Ref para filtros de búsqueda ---
    const [, setSearchText] = useState('');
    const [, setSearchedColumn] = useState('');
    const searchInput = useRef(null);

    // --- Estados para Modales ---
    // Declaración correcta de los estados del modal
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // --- Carga de Datos de Productos ---
    useEffect(() => {
        setIsLoading(true);
        const productsCollectionRef = collection(db, 'products');
        // Puedes ordenar por 'name' o 'price' por defecto
        const q = query(productsCollectionRef, orderBy('name'));

        const unsubscribe = onSnapshot(q,
            (querySnapshot) => {
                const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setProductsList(productsData);
                setIsLoading(false);
                setError(null);
            },
            (err) => {
                console.error("Error al obtener productos:", err);
                setError("Error al cargar los datos de los productos.");
                setIsLoading(false);
            }
        );
        return () => unsubscribe(); // Limpiar la suscripción al desmontar el componente
    }, []); // Dependencia vacía para que se ejecute solo una vez al montar

    // --- Funciones para controlar el Modal de AÑADIR/EDITAR PRODUCTO ---
    const handleOpenAddProductModal = () => {
        setEditingProduct(null); // Para añadir, no hay producto previo
        setIsAddEditModalOpen(true);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const handleEditProduct = (product) => {
        setEditingProduct(product); // Establecer el producto a editar
        setIsAddEditModalOpen(true);
    };

     // Función para cerrar el modal
     const handleCloseAddEditProductModal = () => {
        setIsAddEditModalOpen(false);
        setEditingProduct(null); // Limpiar el producto en edición al cerrar
    };


    // --- Función de Eliminar Producto ---
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const handleDeleteProduct = async (productId) => {
        console.log("Intentando eliminar producto ID:", productId);
        try {
            const productDocRef = doc(db, 'products', productId);
            await deleteDoc(productDocRef);
            message.success('Producto eliminado correctamente');
             // onSnapshot se encargará de actualizar la tabla automáticamente
        } catch (error) {
            console.error("Error al eliminar producto:", error);
            message.error(`Error al eliminar el producto: ${error.message}`);
        }
    };

     // --- Funciones para manejar el filtro de búsqueda ---
    const handleSearch = (selectedKeys, confirm, dataIndex) => {
        confirm();
        setSearchText(selectedKeys[0] || '');
        setSearchedColumn(dataIndex);
    };

    const handleReset = (clearFilters, confirm) => {
        clearFilters();
        setSearchText('');
        setSearchedColumn(''); // Limpiar columna también
        confirm();
    };

    // --- Función reutilizable para propiedades de filtro de búsqueda ---
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const getColumnSearchProps = (dataIndex, columnTitle) => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
            <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
                <Input
                    ref={searchInput}
                    placeholder={`Buscar ${columnTitle}`}
                    value={selectedKeys[0]}
                    onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
                    style={{ marginBottom: 8, display: 'block' }}
                />
                <Space>
                    <Button
                        type="primary"
                        onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
                        icon={<SearchOutlined />}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Buscar
                    </Button>
                    <Button
                        onClick={() => clearFilters && handleReset(clearFilters, confirm)}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Resetear
                    </Button>
                    <Button
                        type="link"
                        size="small"
                        onClick={() => { close(); }}
                    >
                        Cerrar
                    </Button>
                </Space>
            </div>
        ),
        filterIcon: (filtered) => (
            <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />
        ),
        onFilter: (value, record) =>
            record[dataIndex]
                ? record[dataIndex].toString().toLowerCase().includes((value || '').toLowerCase())
                : false,
        onFilterDropdownOpenChange: (visible) => {
            if (visible) {
                setTimeout(() => searchInput.current?.select(), 100);
            }
        },
        // render: (text) => ( ... ) // Opcional para resaltar
    });


    // --- Definición de Columnas para AntD Table ---
    const columns = useMemo(() => [ // Usar useMemo para optimizar
        {
            title: 'Nombre', dataIndex: 'name', key: 'name',
             sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
             ...getColumnSearchProps('name', 'Nombre'),
        },
         {
            title: 'Imagen Principal', dataIndex: 'imageUrl', key: 'imageUrl', width: 100,
            render: (url) => url ? <Image src={url} alt="Producto" style={{ width: '60px', height: '60px', objectFit: 'cover' }} /> : <Tag>Sin imagen</Tag>,
         },
        {
            title: 'Descripción', dataIndex: 'description', key: 'description',
             responsive: ['md'], // Ocultar en pantallas pequeñas si es muy larga
             render: (text) => <Tooltip title={text}>{text ? `${text.substring(0, 50)}...` : '-'}</Tooltip>, // Mostrar tooltip y cortar texto largo
        },
        {
            title: 'Precio', dataIndex: 'price', key: 'price', width: 120, align: 'right',
            sorter: (a, b) => (a.price || 0) - (b.price || 0),
            render: (price) => `$${Number(price || 0).toLocaleString('es-CO')}`, // Formato de moneda (Colombia)
        },
         {
            title: 'Coins', dataIndex: 'coins', key: 'coins', width: 100, align: 'right', responsive: ['lg'],
            sorter: (a, b) => (a.coins || 0) - (b.coins || 0),
            render: (coins) => coins ?? 0,
         },
         {
            title: 'Galería', dataIndex: 'galleryImages', key: 'galleryImages', width: 80, align: 'center', responsive: ['lg'],
            render: (images) => Array.isArray(images) ? <Tag>{images.length}</Tag> : <Tag>0</Tag>,
         },
        {
            title: 'Acciones', key: 'actions', align: 'center', width: 100, fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                     <Tooltip title="Editar Producto">
                        <Button type="link" icon={<BsPencilSquare />} onClick={() => handleEditProduct(record)} aria-label="Editar Producto"/>
                    </Tooltip>
                     <Tooltip title="Eliminar Producto">
                         <Popconfirm
                             title="¿Eliminar este producto?"
                             description="Esta acción eliminará el producto permanentemente."
                             onConfirm={() => handleDeleteProduct(record.id)}
                             okText="Sí" cancelText="No" okButtonProps={{ danger: true }}
                         >
                            <Button type="link" danger icon={<BsTrash />} aria-label="Eliminar Producto"/>
                         </Popconfirm>
                     </Tooltip>
                </Space>
            ),
        },
    ], [getColumnSearchProps, handleDeleteProduct, handleEditProduct]); // Dependencias de useMemo

    return (
        <div className="page-container">
            <div className="page-header">
                <h2>Gestión de Tienda</h2>
                <Button type="primary" icon={<BsPlusLg />} onClick={handleOpenAddProductModal}>
                    Añadir Producto
                </Button>
            </div>

            <div className="page-content">
                 {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

                <Table
                    columns={columns}
                    dataSource={productsList}
                    loading={isLoading}
                    rowKey="id" // Usar el ID del documento como clave única
                    size="middle"
                    style={{ marginTop: '20px' }}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 'max-content' }} // Permite scroll horizontal
                />

                {/* Modal para añadir/editar producto */}

                 {isAddEditModalOpen && (
                     <AddEditProductModal
                         open={isAddEditModalOpen}
                         onClose={handleCloseAddEditProductModal}
                         productData={editingProduct} // Pasa el producto si estamos editando
                     />
                 )}
            </div>
                   
        </div>
    );
}

export default ShopPage;
