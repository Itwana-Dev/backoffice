// src/pages/ServiciosPage.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase'; // Ajusta la ruta si es necesario

// Importa componentes de Ant Design
import { Table, Button, Space, Tag, Popconfirm, message, Tooltip, Input, Image } from 'antd';
import { BsPlusLg, BsPencilSquare, BsTrash, BsGrid3X3Gap } from 'react-icons/bs'; // Añadir BsGrid3X3Gap para el icono de categorías
import { SearchOutlined } from '@ant-design/icons'; // Icono de búsqueda

// Importar los Modales
import AddEditProfesionalModal from './components/AddEditProfesionalModal';
import ManageServiceCategoriesModal from './components/ManageServiceCategoriesModal'; // Importar el modal de categorías

import './ServiciosPage.css'; // Asegúrate de tener este archivo CSS

function ServiciosPage() {
    // --- Estados para los profesionales ---
    const [professionalsList, setProfessionalsList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Estados y Ref para filtros de búsqueda ---
    const [, setSearchText] = useState('');
    const [, setSearchedColumn] = useState('');
    const searchInput = useRef(null);

    // --- Estados para Modales ---
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false); // Para añadir/editar profesional
    const [editingProfesional, setEditingProfesional] = useState(null); // Profesional actualmente en edición
    // Estado para el modal de gestionar categorías de servicio
    const [isManageServiceCategoriesModalOpen, setIsManageServiceCategoriesModalOpen] = useState(false);


    // --- Carga de Datos de Profesionales ---
    useEffect(() => {
        setIsLoading(true);
        const professionalsCollectionRef = collection(db, 'professionals');
        // Puedes ordenar por 'name' o 'categoryId' por defecto
        const q = query(professionalsCollectionRef, orderBy('name'));

        const unsubscribe = onSnapshot(q,
            (querySnapshot) => {
                const professionalsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setProfessionalsList(professionalsData);
                setIsLoading(false);
                setError(null);
            },
            (err) => {
                console.error("Error al obtener profesionales:", err);
                setError("Error al cargar los datos de los profesionales.");
                setIsLoading(false);
            }
        );
        return () => unsubscribe(); // Limpiar la suscripción al desmontar el componente
    }, []); // Dependencia vacía para que se ejecute solo una vez al montar

    // --- Funciones para controlar el Modal de AÑADIR/EDITAR PROFESIONAL ---
    const handleOpenAddProfesionalModal = () => {
        setEditingProfesional(null); // Para añadir, no hay profesional previo
        setIsAddEditModalOpen(true);
    };

    const handleEditProfesional = (profesional) => {
        setEditingProfesional(profesional); // Establecer el profesional a editar
        setIsAddEditModalOpen(true);
    };

     const handleCloseAddEditProfesionalModal = () => {
        setIsAddEditModalOpen(false);
        setEditingProfesional(null); // Limpiar el profesional en edición al cerrar
    };

    // Funciones para controlar el Modal de Gestionar Categorías
    const handleOpenManageServiceCategoriesModal = () => {
        setIsManageServiceCategoriesModalOpen(true);
    };

    const handleCloseManageServiceCategoriesModal = () => {
        setIsManageServiceCategoriesModalOpen(false);
    };


    // --- Función de Eliminar Profesional ---
    const handleDeleteProfesional = async (profesionalId) => {
        console.log("Intentando eliminar profesional ID:", profesionalId);
        try {
            const profesionalDocRef = doc(db, 'professionals', profesionalId);
            await deleteDoc(profesionalDocRef);
            message.success('Profesional eliminado correctamente');
             // onSnapshot se encargará de actualizar la tabla automáticamente
        } catch (error) {
            console.error("Error al eliminar profesional:", error);
            message.error(`Error al eliminar el profesional: ${error.message}`);
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
            title: 'Categoría', dataIndex: 'categoryId', key: 'categoryId',
             sorter: (a, b) => (a.categoryId || '').localeCompare(b.categoryId || ''),
             ...getColumnSearchProps('categoryId', 'Categoría'),
             // TODO: Añadir filtro por categoría si cargas las categorías como en SitiosPage
        },
         {
            title: 'Imagen Principal', dataIndex: 'imageUrl', key: 'imageUrl', width: 100,
            render: (url) => url ? <Image src={url} alt="Profesional" style={{ width: '60px', height: '60px', objectFit: 'cover' }} /> : <Tag>Sin imagen</Tag>,
         },
         {
            title: 'Nombre', dataIndex: 'name', key: 'name',
             sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
             ...getColumnSearchProps('name', 'Nombre'),
         },
         {
            title: 'Especialidad', dataIndex: 'specialty', key: 'specialty', responsive: ['md'],
             ...getColumnSearchProps('specialty', 'Especialidad'),
         },
        {
            title: 'Descripción', dataIndex: 'description', key: 'description',
             responsive: ['lg'], // Ocultar en pantallas pequeñas si es muy larga
             render: (text) => <Tooltip title={text}>{text ? `${text.substring(0, 50)}...` : '-'}</Tooltip>, // Mostrar tooltip y cortar texto largo
        },
        {
            title: 'Teléfono', dataIndex: 'phoneNumber', key: 'phoneNumber', responsive: ['md'],
             ...getColumnSearchProps('phoneNumber', 'Teléfono'),
        },
         {
             title: 'Rating', dataIndex: 'rating', key: 'rating', width: 80, align: 'center',
             sorter: (a, b) => (a.rating || 0) - (b.rating || 0),
             render: (rating) => rating ?? '-',
         },
         {
             title: 'Años Exp.', dataIndex: 'yearsOfExperience', key: 'yearsOfExperience', width: 100, align: 'center', responsive: ['lg'],
             sorter: (a, b) => (a.yearsOfExperience || 0) - (b.yearsOfExperience || 0),
             render: (years) => years ?? '-',
         },
         {
            title: 'Horario', dataIndex: 'schedule', key: 'schedule', responsive: ['lg'],
            render: (text) => <Tooltip title={text}>{text ? `${text.substring(0, 30)}...` : '-'}</Tooltip>, // Mostrar tooltip y cortar texto largo
         },
         {
            title: 'Idiomas', dataIndex: 'languages', key: 'languages', responsive: ['lg'],
            render: (languages) => Array.isArray(languages) && languages.length > 0 ? (
                 <Space size={[0, 'small']} wrap>
                     {languages.map((lang, index) => <Tag key={index}>{lang}</Tag>)}
                 </Space>
             ) : <Tag>Ninguno</Tag>,
         },
         {
            title: 'Servicios Adic.', dataIndex: 'services', key: 'services', responsive: ['lg'],
             render: (services) => Array.isArray(services) && services.length > 0 ? (
                 <Space size={[0, 'small']} wrap>
                     {services.map((service, index) => <Tag key={index} color="blue">{service}</Tag>)}
                 </Space>
             ) : <Tag>Ninguno</Tag>,
         },
         {
            title: 'Galería', dataIndex: 'galleryImages', key: 'galleryImages', width: 80, align: 'center',
            render: (images) => Array.isArray(images) ? <Tag>{images.length}</Tag> : <Tag>0</Tag>,
         },
          {
             title: 'Video URL', dataIndex: 'videoUrl', key: 'videoUrl', responsive: ['xl'], // Mostrar en pantallas extra grandes
             render: (url) => url ? <Tooltip title={url}><a href={url} target="_blank" rel="noopener noreferrer">Ver Video</a></Tooltip> : '-',
          },
          {
             title: 'WhatsApp Taps', dataIndex: 'whatsappTapCount', key: 'whatsappTapCount', width: 100, align: 'right', responsive: ['xl'],
             sorter: (a, b) => (a.whatsappTapCount || 0) - (b.whatsappTapCount || 0),
             render: (count) => count ?? 0,
          },

        {
            title: 'Acciones', key: 'actions', align: 'center', width: 100, fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                     <Tooltip title="Editar Profesional">
                        <Button type="link" icon={<BsPencilSquare />} onClick={() => handleEditProfesional(record)} aria-label="Editar Profesional"/>
                    </Tooltip>
                     <Tooltip title="Eliminar Profesional">
                         <Popconfirm
                             title="¿Eliminar este profesional?"
                             description="Esta acción eliminará el perfil del profesional permanentemente."
                             onConfirm={() => handleDeleteProfesional(record.id)}
                             okText="Sí" cancelText="No" okButtonProps={{ danger: true }}
                         >
                            <Button type="link" danger icon={<BsTrash />} aria-label="Eliminar Profesional"/>
                         </Popconfirm>
                     </Tooltip>
                </Space>
            ),
        },
    ], [getColumnSearchProps, handleDeleteProfesional, handleEditProfesional]); // Dependencias de useMemo

    return (
        <div className="page-container">
            <div className="page-header">
                <h2>Gestión de Servicios (Profesionales)</h2> {/* Título ajustado */}
                <Space> {/* Usar Space para separar los botones */}
                    <Button type="primary" icon={<BsPlusLg />} onClick={handleOpenAddProfesionalModal}>
                        Añadir Profesional
                    </Button>
                    {/* Botón para abrir el modal de gestión de categorías */}
                    <Button icon={<BsGrid3X3Gap />} onClick={handleOpenManageServiceCategoriesModal}>
                        Categorías
                    </Button>
                </Space>
            </div>

            <div className="page-content">
                 {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

                <Table
                    columns={columns}
                    dataSource={professionalsList}
                    loading={isLoading}
                    rowKey="id" // Usar el ID del documento como clave única
                    size="middle"
                    style={{ marginTop: '20px' }}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 'max-content' }} // Permite scroll horizontal
                />

                {/* Modal para añadir/editar profesional */}
                {isAddEditModalOpen && (
                     <AddEditProfesionalModal
                         open={isAddEditModalOpen}
                         onClose={handleCloseAddEditProfesionalModal}
                         profesionalData={editingProfesional} // Pasa el profesional si estamos editando
                     />
                 )}

                {/* Modal para gestionar categorías de servicio */}
                {isManageServiceCategoriesModalOpen && (
                    <ManageServiceCategoriesModal
                        open={isManageServiceCategoriesModalOpen}
                        onClose={handleCloseManageServiceCategoriesModal}
                    />
                )}
            </div>
        </div>
    );
}

export default ServiciosPage;
