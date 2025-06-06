// src/pages/EventosPage.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase'; // Ajusta la ruta si es necesario
import { format } from 'date-fns'; // Importar para formatear fechas si es necesario
import { es } from 'date-fns/locale'; // Importar locale si necesitas español

// Importa componentes de Ant Design
import { Table, Button, Space, Tag, Popconfirm, message, Tooltip, Input, Image } from 'antd';
import { BsPlusLg, BsPencilSquare, BsTrash } from 'react-icons/bs'; // Iconos para acciones
import { SearchOutlined } from '@ant-design/icons'; // Icono de búsqueda

// Importar el Modal de añadir/editar evento
import AddEditEventoModal from './components/AddEditEventoModal';

import './EventosPage.css'; // Asegúrate de tener este archivo CSS

function EventosPage() {
    // --- Estados para los eventos ---
    const [eventsList, setEventsList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Estados y Ref para filtros de búsqueda ---
    const [, setSearchText] = useState('');
    const [, setSearchedColumn] = useState('');
    const searchInput = useRef(null);

    // --- Estados para Modales ---
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false); // Para añadir/editar evento
    const [editingEvento, setEditingEvento] = useState(null); // Evento actualmente en edición

    // --- Carga de Datos de Eventos ---
    useEffect(() => {
        setIsLoading(true);
        const eventsCollectionRef = collection(db, 'events');
        // Puedes ordenar por fecha de inicio o título por defecto
        const q = query(eventsCollectionRef, orderBy('startDate', 'desc')); // Ordenar por fecha de inicio descendente

        const unsubscribe = onSnapshot(q,
            (querySnapshot) => {
                const eventsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setEventsList(eventsData);
                setIsLoading(false);
                setError(null);
            },
            (err) => {
                console.error("Error al obtener eventos:", err);
                setError("Error al cargar los datos de los eventos.");
                setIsLoading(false);
            }
        );
        return () => unsubscribe(); // Limpiar la suscripción al desmontar el componente
    }, []); // Dependencia vacía para que se ejecute solo una vez al montar

    // --- Funciones para controlar el Modal de AÑADIR/EDITAR EVENTO ---
    const handleOpenAddEventoModal = () => {
        setEditingEvento(null); // Para añadir, no hay evento previo
        setIsAddEditModalOpen(true);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const handleEditEvento = (evento) => {
        setEditingEvento(evento); // Establecer el evento a editar
        setIsAddEditModalOpen(true);
    };

     const handleCloseAddEditEventoModal = () => {
        setIsAddEditModalOpen(false);
        setEditingEvento(null); // Limpiar el evento en edición al cerrar
    };

    // --- Función de Eliminar Evento ---
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const handleDeleteEvento = async (eventoId) => {
        console.log("Intentando eliminar evento ID:", eventoId);
        try {
            const eventoDocRef = doc(db, 'events', eventoId);
            await deleteDoc(eventoDocRef);
            message.success('Evento eliminado correctamente');
             // onSnapshot se encargará de actualizar la tabla automáticamente
        } catch (error) {
            console.error("Error al eliminar evento:", error);
            message.error(`Error al eliminar el evento: ${error.message}`);
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
            title: 'Título', dataIndex: 'title', key: 'title',
             sorter: (a, b) => (a.title || '').localeCompare(b.title || ''),
            ...getColumnSearchProps('title', 'Título'),
        },
         {
            title: 'Imagen', dataIndex: 'imageUrl', key: 'imageUrl', width: 80,
            render: (url) => url ? <Image src={url} alt="Evento" style={{ width: '50px', height: '50px', objectFit: 'cover' }} /> : <Tag>Sin imagen</Tag>,
         },
        {
            title: 'Descripción', dataIndex: 'description', key: 'description',
             responsive: ['md'], // Ocultar en pantallas pequeñas si es muy larga
             render: (text) => <Tooltip title={text}>{text ? `${text.substring(0, 50)}...` : '-'}</Tooltip>, // Mostrar tooltip y cortar texto largo
        },
        {
            title: 'Ubicación', dataIndex: 'location', key: 'location',
             ...getColumnSearchProps('location', 'Ubicación'),
        },
         {
            title: 'Organizador', dataIndex: 'organizer', key: 'organizer', responsive: ['lg'],
             ...getColumnSearchProps('organizer', 'Organizador'),
         },
         {
            title: 'Responsable', dataIndex: 'responsible', key: 'responsible', responsive: ['lg'],
             ...getColumnSearchProps('responsible', 'Responsable'),
         },
         {
            title: 'Teléfono', dataIndex: 'phone', key: 'phone', responsive: ['md'],
             ...getColumnSearchProps('phone', 'Teléfono'),
         },
        {
            title: 'Fecha Inicio', dataIndex: 'startDate', key: 'startDate',
             sorter: (a, b) => (a.startDate?.toDate() || 0) - (b.startDate?.toDate() || 0), // Ordenar por marca de tiempo
             render: (timestamp) => timestamp ? format(timestamp.toDate(), 'dd/MM/yyyy HH:mm', { locale: es }) : '-', // Formatear fecha/hora
        },
        {
            title: 'Fecha Fin', dataIndex: 'endDate', key: 'endDate',
             sorter: (a, b) => (a.endDate?.toDate() || 0) - (b.endDate?.toDate() || 0), // Ordenar por marca de tiempo
             render: (timestamp) => timestamp ? format(timestamp.toDate(), 'dd/MM/yyyy HH:mm', { locale: es }) : '-', // Formatear fecha/hora
        },
        {
            title: 'Acciones', key: 'actions', align: 'center', width: 100, fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                     <Tooltip title="Editar Evento">
                        <Button type="link" icon={<BsPencilSquare />} onClick={() => handleEditEvento(record)} aria-label="Editar Evento"/>
                    </Tooltip>
                     <Tooltip title="Eliminar Evento">
                         <Popconfirm
                             title="¿Eliminar este evento?"
                             description="Esta acción eliminará el evento permanentemente."
                             onConfirm={() => handleDeleteEvento(record.id)}
                             okText="Sí" cancelText="No" okButtonProps={{ danger: true }}
                         >
                            <Button type="link" danger icon={<BsTrash />} aria-label="Eliminar Evento"/>
                         </Popconfirm>
                     </Tooltip>
                </Space>
            ),
        },
    ], [getColumnSearchProps, handleDeleteEvento, handleEditEvento]); // Dependencias de useMemo

    return (
        <div className="page-container">
            <div className="page-header">
                <h2>Gestión de Eventos</h2>
                <Button type="primary" icon={<BsPlusLg />} onClick={handleOpenAddEventoModal}>
                    Añadir Evento
                </Button>
            </div>

            <div className="page-content">
                 {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

                <Table
                    columns={columns}
                    dataSource={eventsList}
                    loading={isLoading}
                    rowKey="id" // Usar el ID del documento como clave única
                    size="middle"
                    style={{ marginTop: '20px' }}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 'max-content' }} // Permite scroll horizontal
                />

                {/* Modal para añadir/editar evento */}

                 {isAddEditModalOpen && (
                     <AddEditEventoModal
                         open={isAddEditModalOpen}
                         onClose={handleCloseAddEditEventoModal}
                         eventoData={editingEvento} // Pasa el evento si estamos editando
                     />
                 )}
            </div>
        </div>
    );
}

export default EventosPage;

