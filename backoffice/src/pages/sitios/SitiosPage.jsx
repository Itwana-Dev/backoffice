// src/pages/SitiosPage.jsx (CON FILTROS AÑADIDOS, SIN ELIMINAR NADA)
import React, { useState, useEffect, useRef, useMemo } from 'react'; // <--- Añadido useRef y useMemo
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase'; // Ajusta la ruta si es necesario

// Importa componentes de Ant Design
import { Table, Button, Space, Tag, Popconfirm, message, Tooltip, Input } from 'antd'; // <--- Añadido Input
import { BsPlusLg, BsPencilSquare, BsTrash, BsCardList } from 'react-icons/bs';
import { SearchOutlined } from '@ant-design/icons'; // <--- Añadido SearchOutlined


// Importa los Modales existentes y NUEVOS
import AddEditSitioModal from './components/AddEditSitioModal'; // Ajusta la ruta
import ManageMenuItemsModal from './components/ManageMenuItemsModal'; // NUEVO MODAL (crear este archivo)

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

    // --- NUEVOS Estados y Ref para filtros de búsqueda ---
    const [, setSearchText] = useState('');
    const [, setSearchedColumn] = useState('');
    const searchInput = useRef(null); // Ref para acceder al input de búsqueda
    // --- FIN NUEVOS Estados y Ref ---

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


    // --- NUEVAS Funciones para controlar el Modal de GESTIONAR MENU ITEMS (sin cambios)---
    const handleOpenMenuItemsModal = (sitio) => {
        setSelectedSitioForMenu(sitio);
        setIsMenuItemsModalOpen(true);
    };

    const handleCloseMenuItemsModal = () => {
        setIsMenuItemsModalOpen(false);
        setSelectedSitioForMenu(null);
    };


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

    // --- NUEVO: Funciones para manejar el filtro de búsqueda ---
    const handleSearch = (selectedKeys, confirm, dataIndex) => {
        confirm(); // Confirma la operación de filtrado
        setSearchText(selectedKeys[0] || ''); // Guarda el texto buscado (o vacío si no hay)
        setSearchedColumn(dataIndex); // Guarda la columna donde se buscó
    };

    const handleReset = (clearFilters, confirm) => { // Añadido confirm para reaplicar tabla sin filtro
        clearFilters(); // Limpia los filtros aplicados en la columna
        setSearchText(''); // Limpia el estado del texto buscado
        setSearchedColumn(''); // Limpia la columna buscada
        confirm(); // Confirma para que la tabla se actualice sin el filtro
    };

    // --- NUEVO: Función reutilizable para propiedades de filtro de búsqueda ---
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
                        // Pasamos confirm a handleReset para actualizar la tabla
                        onClick={() => clearFilters && handleReset(clearFilters, confirm)}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Resetear
                    </Button>
                    <Button
                        type="link"
                        size="small"
                        onClick={() => {
                            // Solo cierra el dropdown, no confirma filtro
                            close();
                        }}
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
                : false, // Si no hay valor en el registro, no coincide
        onFilterDropdownOpenChange: (visible) => {
            if (visible) {
                setTimeout(() => searchInput.current?.select(), 100);
            }
        },
        // Puedes descomentar 'render' si instalas 'react-highlight-words' para resaltar
        // render: (text) =>
        //     searchedColumn === dataIndex ? (
        //         /* Componente Highlighter aquí */
        //         text
        //     ) : (
        //         text
        //     ),
    });
    // --- FIN NUEVAS funciones de búsqueda ---

    // --- NUEVO: Generar filtros de categoría dinámicamente ---
    const categoryFilters = useMemo(() => {
        const categories = new Set(sitiosList.map(sitio => sitio.category).filter(Boolean));
        return Array.from(categories).sort().map(category => ({
            text: category,
            value: category,
        }));
    }, [sitiosList]);
    // --- FIN NUEVO cálculo de filtros ---

    // --- Definición de Columnas para AntD Table (AÑADIDOS FILTROS) ---
     const columns = [
         {
             title: 'Título',
             dataIndex: 'title',
             key: 'title',
             // Se mantiene el sorter existente
             sorter: (a, b) => a.title.localeCompare(b.title),
             // Se AÑADEN las propiedades de filtro
             ...getColumnSearchProps('title', 'Título'),
         },
         {
             title: 'Categoría',
             dataIndex: 'category',
             key: 'category',
             // Se mantiene el sorter existente
             sorter: (a, b) => (a.category || '').localeCompare(b.category || ''),
             // Se AÑADEN las propiedades de filtro
             filters: categoryFilters,
             onFilter: (value, record) => record.category === value,
         },
         {
             title: 'Ubicación',
             dataIndex: 'location',
             key: 'location',
             // Se AÑADEN las propiedades de filtro
              ...getColumnSearchProps('location', 'Ubicación'),
              // Se mantiene sin sorter (como estaba antes)
         },
         {
             // Columna Premium (sin cambios, ya tenía filtro)
             title: 'Premium', dataIndex: 'isPremium', key: 'isPremium', align: 'center',
             render: (isPremium) => (<Tag color={isPremium ? 'gold' : 'default'}>{isPremium ? 'Sí' : 'No'}</Tag>),
             filters: [{ text: 'Sí', value: true }, { text: 'No', value: false },],
             onFilter: (value, record) => record.isPremium === value,
         },
         {
             // Columna Acciones (sin cambios)
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

    // --- Renderizado del Componente (SIN CAMBIOS) ---
    return (
        <div className="page-container">
            <div className="page-header">
                <h2>Gestión de Sitios</h2>
                <Button type="primary" icon={<BsPlusLg />} onClick={handleOpenAddSitioModal}>
                    Añadir Sitio
                </Button>
            </div>

            <div className="page-content">
                {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

                <Table
                    columns={columns} // Usa la nueva definición de columnas con filtros
                    dataSource={sitiosList}
                    loading={isLoading}
                    rowKey="id"
                    size="middle"
                    style={{ marginTop: '20px' }}
                    pagination={{ pageSize: 10 }}
                />

                {/* Modal para AÑADIR/EDITAR el SITIO (sin cambios funcionales) */}
                <AddEditSitioModal
                    open={isAddEditModalOpen}
                    onClose={handleCloseAddEditSitioModal}
                    sitio={editingSitio}
                />

                {/* NUEVO MODAL para GESTIONAR MENU ITEMS (sin cambios funcionales)*/}
                {selectedSitioForMenu && (
                    <ManageMenuItemsModal
                        open={isMenuItemsModalOpen}
                        onClose={handleCloseMenuItemsModal}
                        sitio={selectedSitioForMenu}
                    />
                )}
            </div>
        </div>
    );
}

export default SitiosPage;