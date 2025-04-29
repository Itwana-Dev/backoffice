// src/pages/UsuariosPage.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from 'firebase/firestore'; // Importar doc, deleteDoc para futuras acciones si es necesario
import { db } from '../../firebase'; // Ajusta la ruta si es necesario

// Importa componentes de Ant Design
import { Table, Button, Space, Tag, Popconfirm, message, Tooltip, Input, Image } from 'antd'; // Añadir Image para la foto de perfil
import { BsPersonPlus, BsPencilSquare, BsTrash } from 'react-icons/bs'; // Iconos para acciones
import { SearchOutlined } from '@ant-design/icons'; // Icono de búsqueda

// Importa el Modal de añadir/editar usuario
import AddEditUserModal from './components/AddEditUserModal';

import './UsuariosPage.css'; // Crearemos un archivo CSS similar al de sitios si es necesario

function UsuariosPage() {
    // --- Estados para los usuarios ---
    const [usersList, setUsersList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Estados y Ref para filtros de búsqueda (adaptado de SitiosPage) ---
    const [, setSearchText] = useState('');
    const [, setSearchedColumn] = useState('');
    const searchInput = useRef(null);

    // --- Estados para Modales (inicialmente cerrados) ---
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false); // Para añadir/editar usuario
    const [editingUser, setEditingUser] = useState(null); // Usuario actualmente en edición

    // --- Carga de Datos de Usuarios ---
    useEffect(() => {
        setIsLoading(true);
        const usersCollectionRef = collection(db, 'users');
        // Puedes ordenar por 'name', 'surname', o cualquier otro campo por defecto
        const q = query(usersCollectionRef, orderBy('name'));

        const unsubscribe = onSnapshot(q,
            (querySnapshot) => {
                const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setUsersList(usersData);
                setIsLoading(false);
                setError(null);
            },
            (err) => {
                console.error("Error al obtener usuarios:", err);
                setError("Error al cargar los datos de los usuarios.");
                setIsLoading(false);
            }
        );
        return () => unsubscribe(); // Limpiar la suscripción al desmontar el componente
    }, []); // Dependencia vacía para que se ejecute solo una vez al montar

    // --- Funciones para controlar el Modal de AÑADIR/EDITAR USUARIO ---
    const handleOpenAddUserModal = () => {
        setEditingUser(null); // Para añadir, no hay usuario previo
        setIsAddEditModalOpen(true);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const handleEditUser = (user) => {
        setEditingUser(user); // Establecer el usuario a editar
        setIsAddEditModalOpen(true);
    };

     const handleCloseAddEditUserModal = () => {
        setIsAddEditModalOpen(false);
        setEditingUser(null); // Limpiar el usuario en edición al cerrar
    };

    // --- Función de Eliminar Usuario (Requiere implementación cuidadosa, placeholder) ---
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const handleDeleteUser = async (userId) => {
        console.log("Intentando eliminar usuario ID:", userId);
         // ** IMPORTANTE: La eliminación de usuarios en Firestore (colección 'users')
         // no elimina automáticamente el usuario de Firebase Authentication.
         // Si necesitas eliminar también la cuenta de Authentication, esto debe hacerse
         // desde un entorno seguro (como un servidor backend o Cloud Functions)
         // usando el Admin SDK de Firebase, NUNCA directamente desde el cliente web por seguridad. **
        try {
            const userDocRef = doc(db, 'users', userId);
            await deleteDoc(userDocRef);
            message.success('Usuario eliminado correctamente');
             // onSnapshot se encargará de actualizar la tabla automáticamente
        } catch (error) {
            console.error("Error al eliminar usuario:", error);
            message.error(`Error al eliminar el usuario: ${error.message}`);
        }
    };

     // --- Funciones para manejar el filtro de búsqueda (adaptado de SitiosPage) ---
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

    // --- Función reutilizable para propiedades de filtro de búsqueda (adaptado) ---
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
    const columns = useMemo(() => [ // Usar useMemo para optimizar la definición de columnas
        {
            title: 'UID', dataIndex: 'uid', key: 'uid', responsive: ['md'], width: 150, // Ancho ajustado
            ...getColumnSearchProps('uid', 'UID'),
        },
         {
            title: 'Foto', dataIndex: 'profileImage', key: 'profileImage', width: 70,
            render: (url) => url ? <Image src={url} alt="Perfil" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} /> : <Tag>Sin foto</Tag>,
         },
        {
            title: 'Nombre', dataIndex: 'name', key: 'name', width: 150, // Ancho ajustado
            sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
             ...getColumnSearchProps('name', 'Nombre'),
        },
         {
            title: 'Apellido', dataIndex: 'surname', key: 'surname', responsive: ['lg'], width: 150, // Ancho ajustado
            sorter: (a, b) => (a.surname || '').localeCompare(b.surname || ''),
             ...getColumnSearchProps('surname', 'Apellido'),
         },
        {
            title: 'Email', dataIndex: 'email', key: 'email', width: 200, // Ancho ajustado
             ...getColumnSearchProps('email', 'Email'),
        },
        {
            title: 'Teléfono', dataIndex: 'phoneNumber', key: 'phoneNumber', responsive: ['md'], width: 120, // Ancho ajustado
             ...getColumnSearchProps('phoneNumber', 'Teléfono'),
        },
         {
            title: 'Edad', dataIndex: 'age', key: 'age', width: 70, align: 'center', responsive: ['lg'], // Mostrar Edad en pantallas grandes+
             sorter: (a, b) => (a.age || 0) - (b.age || 0),
             render: (age) => age ?? '-', // Mostrar '-' si no hay edad
         },
         {
            title: 'Sexo', dataIndex: 'sex', key: 'sex', width: 90, align: 'center', responsive: ['lg'],
            filters: [{ text: 'Masculino', value: 'Masculino' }, { text: 'Femenino', value: 'Femenino' }],
            onFilter: (value, record) => record.sex === value,
            render: (sex) => sex ?? '-', // Mostrar '-' si no hay sexo
         },
        {
            title: 'Coins', dataIndex: 'itwanaCoins', key: 'itwanaCoins', width: 100, align: 'right',
            sorter: (a, b) => (a.itwanaCoins || 0) - (b.itwanaCoins || 0),
            render: (coins) => (coins ?? 0).toLocaleString('es-CO'), // Formato de número
        },
         {
            title: 'Admin', dataIndex: 'isAdmin', key: 'isAdmin', width: 80, align: 'center',
            render: (isAdmin) => (<Tag color={isAdmin ? 'gold' : 'default'}>{isAdmin ? 'Sí' : 'No'}</Tag>),
            filters: [{ text: 'Sí', value: true }, { text: 'No', value: false },],
            onFilter: (value, record) => !!record.isAdmin === value, // Asegura booleano en la comparación
         },
        {
            title: 'Acciones', key: 'actions', align: 'center', width: 100, fixed: 'right', // Ancho y fijado a la derecha
            render: (_, record) => (
                <Space size="small">
                     <Tooltip title="Editar Usuario">
                        <Button type="link" icon={<BsPencilSquare />} onClick={() => handleEditUser(record)} aria-label="Editar Usuario"/>
                    </Tooltip>
                     {/* Botón de eliminar - Usar Popconfirm para confirmación */}
                     <Tooltip title="Eliminar Usuario">
                         <Popconfirm
                             title="¿Eliminar este usuario?"
                             description="Esta acción eliminará el perfil del usuario. Para eliminar la cuenta de autenticación, se requieren pasos adicionales."
                             onConfirm={() => handleDeleteUser(record.id)} // Usar record.id para eliminar el documento
                             okText="Sí" cancelText="No" okButtonProps={{ danger: true }}
                         >
                            <Button type="link" danger icon={<BsTrash />} aria-label="Eliminar Usuario"/>
                         </Popconfirm>
                     </Tooltip>
                </Space>
            ),
        },
    ], [getColumnSearchProps, handleDeleteUser, handleEditUser]); // Dependencias de useMemo

    return (
        <div className="page-container">
            <div className="page-header">
                <h2>Gestión de Usuarios</h2>
                <Button type="primary" icon={<BsPersonPlus />} onClick={handleOpenAddUserModal}>
                    Añadir Usuario
                </Button>
            </div>

            <div className="page-content">
                 {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

                <Table
                    columns={columns}
                    dataSource={usersList}
                    loading={isLoading}
                    rowKey="id" // Usar el ID del documento como clave única
                    size="middle"
                    style={{ marginTop: '20px' }}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 'max-content' }} // Permite scroll horizontal si la tabla es muy ancha
                />

                {/* Modal para añadir/editar usuario */}
                {isAddEditModalOpen && (
                    <AddEditUserModal
                        open={isAddEditModalOpen}
                        onClose={handleCloseAddEditUserModal}
                        userData={editingUser} // Pasa el usuario si estamos editando
                    />
                )}
            </div>
        </div>
    );
}

export default UsuariosPage;
