// src/pages/SitiosPage.jsx (Usando Ant Design Table)
import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc } from 'firebase/firestore'; // Añade doc y deleteDoc
import { db } from '../../firebase';

// Importa componentes de Ant Design
import { Table, Button, Space, Tag, Popconfirm } from 'antd'; // Importa Table, Button, Space, Tag, Popconfirm
import { BsPlusLg, BsPencilSquare, BsTrash } from 'react-icons/bs'; // Mantenemos iconos

// Importa el Modal (aún por implementar)
// import AddSitioModal from '../components/AddSitioModal';

// Estilos específicos de la página (mantén los de .page-header, .add-button, etc.)
import './SitiosPage.css';

function SitiosPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSitio, setEditingSitio] = useState(null);
    const [sitiosList, setSitiosList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Carga de Datos (sin cambios) ---
    useEffect(() => {
        setIsLoading(true);
        const sitesCollectionRef = collection(db, 'sites');
        const q = query(sitesCollectionRef, orderBy('title')); // Ordenar por título

        const unsubscribe = onSnapshot(q,
            (querySnapshot) => {
                const sitesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setSitiosList(sitesData);
                setIsLoading(false);
                setError(null);
                console.log("Sitios cargados/actualizados:", sitesData.length);
            },
            (err) => {
                console.error("Error al obtener sitios:", err);
                setError("Error al cargar los datos de los sitios.");
                setIsLoading(false);
            }
        );
        return () => unsubscribe();
    }, []);

    // --- Funciones Modal y Acciones ---
    const handleOpenAddModal = () => {
        setEditingSitio(null);
        setIsModalOpen(true);
        console.log("Abriendo modal para AÑADIR sitio");
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingSitio(null);
    };

    const handleEdit = (sitio) => {
        setEditingSitio(sitio);
        setIsModalOpen(true);
        console.log("Abriendo modal para EDITAR sitio:", sitio.id);
    };

    const handleDelete = async (sitioId) => { // Convertida a async para await
        console.log("Intentando eliminar sitio ID:", sitioId);
        try {
            const siteDocRef = doc(db, 'sites', sitioId);
            await deleteDoc(siteDocRef);
            console.log("Sitio eliminado con éxito:", sitioId);
            // Opcional: Mostrar notificación de éxito con AntD Message/Notification
            // message.success('Sitio eliminado correctamente');
        } catch (error) {
            console.error("Error al eliminar sitio:", error);
            setError("Error al eliminar el sitio.");
             // Opcional: Mostrar notificación de error
             // message.error('Error al eliminar el sitio');
        }
    };

    // --- Definición de Columnas para AntD Table ---
    const columns = [
        {
            title: 'Título', // Texto del encabezado
            dataIndex: 'title', // Campo del objeto de datos a mostrar
            key: 'title', // Clave única para la columna
            sorter: (a, b) => a.title.localeCompare(b.title), // Habilita ordenación
        },
        {
            title: 'Categoría',
            dataIndex: 'category',
            key: 'category',
            sorter: (a, b) => (a.category || '').localeCompare(b.category || ''),
        },
        {
            title: 'Ubicación',
            dataIndex: 'location',
            key: 'location',
        },
        {
            title: 'Premium',
            dataIndex: 'isPremium',
            key: 'isPremium',
            align: 'center', // Centrar contenido
            render: (isPremium) => ( // Función para renderizado personalizado
                <Tag color={isPremium ? 'gold' : 'default'}> {/* Usa AntD Tag */}
                    {isPremium ? 'Sí' : 'No'}
                </Tag>
            ),
            filters: [ // Habilita filtrado
              { text: 'Sí', value: true },
              { text: 'No', value: false },
            ],
            onFilter: (value, record) => record.isPremium === value,
        },
        {
            title: 'Acciones',
            key: 'actions',
            align: 'center',
            render: (_, record) => ( // El primer argumento es el valor, el segundo es todo el registro (objeto sitio)
                <Space size="small"> {/* AntD Space para espaciar botones */}
                    <Button
                        type="link" // Estilo de botón como enlace
                        icon={<BsPencilSquare />}
                        onClick={() => handleEdit(record)}
                        aria-label="Editar" // Para accesibilidad
                    />
                    {/* Popconfirm para confirmación antes de borrar */}
                    <Popconfirm
                        title="¿Eliminar el sitio?"
                        description="¿Estás seguro de que quieres eliminar este sitio?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Sí, eliminar"
                        cancelText="Cancelar"
                        okButtonProps={{ danger: true }} // Botón OK en rojo
                    >
                        <Button
                            type="link"
                            danger // Estilo peligro (rojo)
                            icon={<BsTrash />}
                            aria-label="Eliminar"
                        />
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
                {/* Botón Añadir con estilo AntD */}
                <Button type="primary" icon={<BsPlusLg />} onClick={handleOpenAddModal}>
                    Añadir Sitio
                </Button>
            </div>

            <div className="page-content">
                {error && <p style={{ color: 'red' }}>{error}</p>} {/* Muestra error si existe */}

                {/* Tabla de Ant Design */}
                <Table
                    columns={columns} // Define las columnas
                    dataSource={sitiosList} // Pasa la lista de sitios
                    loading={isLoading} // Muestra indicador de carga
                    rowKey="id" // Indica que 'id' es la clave única de cada fila
                    size="middle" // Tamaño de la tabla (small, middle, large)
                    style={{ marginTop: '20px' }} // Margen superior
                    // Puedes añadir más props como pagination, scroll, etc.
                     pagination={{ pageSize: 10 }} // Ejemplo de paginación
                />

                 {/* Placeholder para el Modal (usar AntD Modal después) */}
                 {isModalOpen && (
                     <div className="modal-placeholder">
                         <h3>{editingSitio ? 'Editar Sitio' : 'Añadir Nuevo Sitio'}</h3>
                         <p>Aquí irá el formulario AntD...</p>
                         {editingSitio && <pre>{JSON.stringify(editingSitio, null, 2)}</pre>}
                         <Button onClick={handleCloseModal} style={{marginTop: '15px'}}>Cerrar Placeholder</Button>
                     </div>
                 )}
            </div>
        </div>
    );
}

export default SitiosPage;