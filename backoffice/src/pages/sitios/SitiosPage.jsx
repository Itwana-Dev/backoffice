// src/pages/SitiosPage.jsx (COMPLETO CON FILTROS Y GESTIÓN DE CATEGORÍAS AÑADIDA)
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase'; // Ajusta la ruta si es necesario

// Importa componentes de Ant Design
import { Table, Button, Space, Tag, Popconfirm, message, Tooltip, Input } from 'antd';
import { BsPlusLg, BsPencilSquare, BsTrash, BsCardList, BsGrid3X3Gap } from 'react-icons/bs'; // <-- Icono añadido
import { SearchOutlined } from '@ant-design/icons';


// Importa los Modales existentes y NUEVOS
import AddEditSitioModal from './components/AddEditSitioModal'; // Ajusta la ruta
import ManageMenuItemsModal from './components/ManageMenuItemsModal';
import ManageCategoriesModal from './components/ManageCategoriesModal'; // <-- Importado modal de categorías

import './SitiosPage.css';

function SitiosPage() {
    // --- Estados existentes (sin cambios)---
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [editingSitio, setEditingSitio] = useState(null);
    const [sitiosList, setSitiosList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isMenuItemsModalOpen, setIsMenuItemsModalOpen] = useState(false);
    const [selectedSitioForMenu, setSelectedSitioForMenu] = useState(null);

    // --- Estados y Ref para filtros de búsqueda (sin cambios)---
    const [, setSearchText] = useState(''); // Volvemos a necesitar el estado para el resaltado opcional
    const [, setSearchedColumn] = useState('');
    const searchInput = useRef(null);

    // --- NUEVO: Estado para el modal de Categorías ---
    const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
    // --- FIN NUEVO Estado ---

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

    // --- Funciones para controlar el Modal de AÑADIR/EDITAR SITIO (sin cambios)---
    const handleOpenAddSitioModal = () => {
        setEditingSitio(null);
        setIsAddEditModalOpen(true);
    };

    const handleEditSitio = (sitio) => {
        setEditingSitio(sitio);
        setIsAddEditModalOpen(true);
    };

     const handleCloseAddEditSitioModal = () => {
        setIsAddEditModalOpen(false);
    };


    // --- Funciones para controlar el Modal de GESTIONAR MENU ITEMS (sin cambios)---
    const handleOpenMenuItemsModal = (sitio) => {
        setSelectedSitioForMenu(sitio);
        setIsMenuItemsModalOpen(true);
    };

    const handleCloseMenuItemsModal = () => {
        setIsMenuItemsModalOpen(false);
        setSelectedSitioForMenu(null);
    };

    // --- NUEVO: Funciones para controlar el Modal de CATEGORÍAS ---
    const handleOpenCategoriesModal = () => {
        setIsCategoriesModalOpen(true);
    };

    const handleCloseCategoriesModal = () => {
        setIsCategoriesModalOpen(false);
    };
    // --- FIN NUEVAS Funciones ---


    // --- Función de Eliminar Sitio (sin cambios) ---
    const handleDeleteSitio = async (sitioId) => {
        console.log("Intentando eliminar sitio ID:", sitioId);
        try {
            const siteDocRef = doc(db, 'sites', sitioId);
            await deleteDoc(siteDocRef);
            message.success('Sitio eliminado correctamente');
        } catch (error) {
            console.error("Error al eliminar sitio:", error);
            message.error('Error al eliminar el sitio');
        }
    };

    // --- Funciones para manejar el filtro de búsqueda (sin cambios) ---
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

    // --- Función reutilizable para propiedades de filtro de búsqueda (sin cambios) ---
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

    // --- Generar filtros de categoría dinámicamente (sin cambios) ---
    const categoryFilters = useMemo(() => {
        const categories = new Set(sitiosList.map(sitio => sitio.category).filter(Boolean));
        return Array.from(categories).sort().map(category => ({
            text: category,
            value: category,
        }));
    }, [sitiosList]);

    // --- Definición de Columnas para AntD Table (sin cambios respecto a la versión con filtros) ---
     const columns = [
         {
             title: 'Título', dataIndex: 'title', key: 'title',
             sorter: (a, b) => a.title.localeCompare(b.title),
             ...getColumnSearchProps('title', 'Título'),
         },
         {
             title: 'Categoría', dataIndex: 'category', key: 'category',
             sorter: (a, b) => (a.category || '').localeCompare(b.category || ''),
             filters: categoryFilters,
             onFilter: (value, record) => record.category === value,
         },
         {
             title: 'Ubicación', dataIndex: 'location', key: 'location',
             ...getColumnSearchProps('location', 'Ubicación'),
         },
         {
             title: 'Premium', dataIndex: 'isPremium', key: 'isPremium', align: 'center',
             render: (isPremium) => (<Tag color={isPremium ? 'gold' : 'default'}>{isPremium ? 'Sí' : 'No'}</Tag>),
             filters: [{ text: 'Sí', value: true }, { text: 'No', value: false },],
             onFilter: (value, record) => record.isPremium === value,
         },
         {
             title: 'Acciones', key: 'actions', align: 'center', width: 150,
             render: (_, record) => (
                 <Space size="small">
                      <Tooltip title="Gestionar Menú/Productos">
                          <Button type="link" icon={<BsCardList />} onClick={() => handleOpenMenuItemsModal(record)} aria-label="Gestionar Menú"/>
                      </Tooltip>
                      <Tooltip title="Editar Sitio">
                        <Button type="link" icon={<BsPencilSquare />} onClick={() => handleEditSitio(record)} aria-label="Editar Sitio"/>
                      </Tooltip>
                      <Tooltip title="Eliminar Sitio">
                        <Popconfirm
                            title="¿Eliminar el sitio?"
                            description="¡Esto NO eliminará los productos del menú! ¿Estás seguro?"
                            onConfirm={() => handleDeleteSitio(record.id)}
                            okText="Sí" cancelText="No" okButtonProps={{ danger: true }}
                        >
                            <Button type="link" danger icon={<BsTrash />} aria-label="Eliminar Sitio"/>
                        </Popconfirm>
                     </Tooltip>
                 </Space>
             ),
         },
     ];

    // --- Renderizado del Componente (CON BOTÓN Y MODAL DE CATEGORÍAS) ---
    return (
        <div className="page-container">
             {/* --- Cabecera Modificada --- */}
            <div className="page-header">
                <h2>Gestión de Sitios</h2>
                <Space> {/* Agrupamos los botones */}
                    {/* Botón Añadir Sitio (existente) */}
                    <Button type="primary" icon={<BsPlusLg />} onClick={handleOpenAddSitioModal}>
                        Añadir Sitio
                    </Button>
                    {/* NUEVO Botón Categorías */}
                    <Button icon={<BsGrid3X3Gap />} onClick={handleOpenCategoriesModal}>
                        Categorías
                    </Button>
                </Space>
            </div>

            <div className="page-content">
                {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

                <Table
                    columns={columns}
                    dataSource={sitiosList}
                    loading={isLoading}
                    rowKey="id"
                    size="middle"
                    style={{ marginTop: '20px' }}
                    pagination={{ pageSize: 10 }}
                />

                 {/* --- Modales --- */}

                {/* Modal Añadir/Editar Sitio */}
                <AddEditSitioModal
                    open={isAddEditModalOpen}
                    onClose={handleCloseAddEditSitioModal}
                    sitio={editingSitio}
                />

                {/* Modal Gestionar Menu Items */}
                {selectedSitioForMenu && (
                    <ManageMenuItemsModal
                        open={isMenuItemsModalOpen}
                        onClose={handleCloseMenuItemsModal}
                        sitio={selectedSitioForMenu}
                    />
                )}

                {/* NUEVO: Modal Gestionar Categorías */}
                {/* Se renderiza siempre pero se controla visibilidad con 'open' */}
                <ManageCategoriesModal
                    open={isCategoriesModalOpen}
                    onClose={handleCloseCategoriesModal}
                />

            </div>
        </div>
    );
}

export default SitiosPage;