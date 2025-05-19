// src/pages/OrdersPage.jsx (CON FUNCIONALIDAD DE CAMBIO DE ESTADO)
import React, { useState, useEffect, useRef, useMemo } from 'react';
// Importar updateDoc para actualizar el estado
import { collection, onSnapshot, query, orderBy, doc,  updateDoc } from 'firebase/firestore';
import { db } from '../../firebase'; // Ajusta la ruta si es necesario

// Importa componentes de Ant Design
import { Table, Tag, Space, Tooltip, Input, Image, Typography, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons'; // Icono de búsqueda
import { ShoppingCartOutlined, UserOutlined, HomeOutlined, CalendarOutlined, CreditCardOutlined, DollarOutlined } from '@ant-design/icons'; // Iconos para renderizado

import { format } from 'date-fns'; // Importar para formatear fechas
import { es } from 'date-fns/locale'; // Importar locale para español


import './OrdersPage.css'; // Asegúrate de tener este archivo CSS

const { Text } = Typography;
import { message } from 'antd';
// Definir el flujo de estados de la orden y sus colores
const ORDER_STATUS_FLOW = ['Pendiente', 'Aprobadoo', 'Alistado', 'En camino', 'Entregado'];
const STATUS_COLORS = {
    'Pendiente': 'gold',
    'Aprobado': 'blue',
    'Alistado': 'cyan',
    'En camino': 'purple',
    'Entregado': 'green',
    'Cancelado': 'red', // Incluir Cancelado aunque no esté en el flujo de avance
};

function OrdersPage() {
    // --- Estados para las órdenes ---
    const [ordersList, setOrdersList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Estados y Ref para filtros de búsqueda ---
    const [, setSearchText] = useState('');
    const [, setSearchedColumn] = useState('');
    const searchInput = useRef(null);

    // --- Carga de Datos de Órdenes ---
    useEffect(() => {
        setIsLoading(true);
        const ordersCollectionRef = collection(db, 'orders');
        // Ordenar por la marca de tiempo de la orden
        const q = query(ordersCollectionRef, orderBy('orderTimestamp', 'desc'));

        const unsubscribe = onSnapshot(q,
            (querySnapshot) => {
                const ordersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setOrdersList(ordersData);
                setIsLoading(false);
                setError(null);
            },
            (err) => {
                console.error("Error al obtener órdenes:", err);
                setError("Error al cargar los datos de las órdenes.");
                setIsLoading(false);
            }
        );
        return () => unsubscribe(); // Limpiar la suscripción al desmontar el componente
    }, []); // Dependencia vacía para que se ejecute solo una vez al montar

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
                    {/* Button se usa aquí */}
                    <Button
                        type="primary"
                        onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
                        icon={<SearchOutlined />}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Buscar
                    </Button>
                    {/* Button se usa aquí */}
                    <Button
                        onClick={() => clearFilters && handleReset(clearFilters, confirm)}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Resetear
                    </Button>
                    {/* Button se usa aquí */}
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
        onFilter: (value, record) => {
             // Manejar campos potencialmente nulos o no string
             const text = record[dataIndex] ? String(record[dataIndex]).toLowerCase() : '';
             return text.includes(String(value).toLowerCase());
        },
        onFilterDropdownOpenChange: (visible) => {
            if (visible) {
                setTimeout(() => searchInput.current?.select(), 100);
            }
        },
    });

    // --- Función para actualizar el estado de una orden en Firestore ---
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const handleUpdateOrderStatus = async (orderId, currentStatus) => {
        const currentIndex = ORDER_STATUS_FLOW.indexOf(currentStatus);
        const nextIndex = currentIndex + 1;

        // Si el estado actual no está en el flujo o ya es el último estado, no hacemos nada
        if (currentIndex === -1 || nextIndex >= ORDER_STATUS_FLOW.length) {
            message.info(`La orden ID ${orderId} ya está en el estado final o un estado no manejable.`);
            return;
        }

        const nextStatus = ORDER_STATUS_FLOW[nextIndex];
        console.log(`Intentando actualizar estado de orden ${orderId} a ${nextStatus}`);

        try {
            const orderDocRef = doc(db, 'orders', orderId);
            await updateDoc(orderDocRef, { status: nextStatus });
            message.success(`Estado de orden ${orderId} actualizado a "${nextStatus}"`);
            // onSnapshot se encargará de actualizar la tabla automáticamente
        } catch (error) {
            console.error(`Error al actualizar estado de orden ${orderId}:`, error);
            message.error(`Error al actualizar estado: ${error.message}`);
        }
    };


    // --- Definición de Columnas para la Tabla de Órdenes ---
    const columns = useMemo(() => {
         // Opciones de filtro para la columna de estado (incluye estados del flujo y Cancelado)
         const statusFilters = ORDER_STATUS_FLOW.map(status => ({ text: status, value: status }));
         statusFilters.push({ text: 'Cancelado', value: 'Cancelado' });


        return [
            {
                title: 'ID Orden', dataIndex: 'id', key: 'id', width: 100,
                 ...getColumnSearchProps('id', 'ID Orden'),
            },
            {
                title: 'Usuario', dataIndex: 'userName', key: 'userName',
                 ...getColumnSearchProps('userName', 'Usuario'),
                 render: (text, record) => (
                     <Tooltip title={`ID Usuario: ${record.userId}`}>
                         <Space>
                             <UserOutlined /> <Text>{text || '-'}</Text>
                         </Space>
                     </Tooltip>
                 ),
            },
            {
                 title: 'Email Usuario', dataIndex: 'userEmail', key: 'userEmail', responsive: ['md'],
                 ...getColumnSearchProps('userEmail', 'Email'),
                 render: (text) => text || '-',
            },
            {
                title: 'Estado', dataIndex: 'status', key: 'status', width: 120, align: 'center',
                 filters: statusFilters, // Añadir filtro por estados
                 onFilter: (value, record) => record.status === value, // Lógica de filtro
                 render: (status) => {
                     const color = STATUS_COLORS[status] || 'default'; // Obtener color del mapa
                     return <Tag color={status ? color : 'default'}>{status || 'Desconocido'}</Tag>;
                 },
            },
             {
                title: 'Método Pago', dataIndex: 'paymentMethod', key: 'paymentMethod', responsive: ['lg'],
                render: (text) => text || '-',
             },
             {
                 title: 'Submétodo Pago', dataIndex: 'paymentSubMethod', key: 'paymentSubMethod', responsive: ['lg'],
                 render: (text) => text || '-',
             },
             {
                title: 'Total COP', dataIndex: 'totalPriceCOP', key: 'totalPriceCOP', width: 120, align: 'right',
                sorter: (a, b) => (a.totalPriceCOP || 0) - (b.totalPriceCOP || 0),
                render: (price) => `$${Number(price || 0).toLocaleString('es-CO')}`, // Formato de moneda
             },
             {
                 title: 'Total Coins', dataIndex: 'totalCoinsSpent', key: 'totalCoinsSpent', width: 100, align: 'right',
                 sorter: (a, b) => (a.totalCoinsSpent || 0) - (b.totalCoinsSpent || 0),
                 render: (coins) => coins ?? 0,
             },
             {
                 title: 'Dirección Entrega', dataIndex: 'deliveryAddress', key: 'deliveryAddress', responsive: ['lg'],
                 render: (text) => text || '-',
             },
             {
                 title: 'Fecha Entrega Estimada', dataIndex: 'deliveryDateString', key: 'deliveryDateString', responsive: ['lg'],
                 render: (text) => text || '-',
             },
            {
                title: 'Fecha Orden', dataIndex: 'orderTimestamp', key: 'orderTimestamp', width: 160,
                sorter: (a, b) => (a.orderTimestamp?.toDate() || 0) - (b.orderTimestamp?.toDate() || 0), // Ordenar por marca de tiempo
                render: (timestamp) => timestamp ? format(timestamp.toDate(), 'dd/MM/yyyy HH:mm', { locale: es }) : '-', // Formatear fecha/hora
            },
            {
                title: 'Acciones', key: 'actions', align: 'center', width: 150, fixed: 'right', // Ajustar ancho para el botón
                render: (_, record) => {
                    const currentStatus = record.status;
                    const currentIndex = ORDER_STATUS_FLOW.indexOf(currentStatus);
                    const nextIndex = currentIndex + 1;
                    const showNextStatusButton = currentIndex !== -1 && nextIndex < ORDER_STATUS_FLOW.length;
                    const nextStatusLabel = showNextStatusButton ? `→ ${ORDER_STATUS_FLOW[nextIndex]}` : '';

                    return (
                        <Space size="small">
                             {/* Botón para avanzar estado */}
                             {showNextStatusButton && (
                                 <Tooltip title={`Cambiar estado a "${ORDER_STATUS_FLOW[nextIndex]}"`}>
                                     <Button
                                         type="primary" // O 'default' o 'dashed' dependiendo del estilo deseado
                                         size="small"
                                         onClick={() => handleUpdateOrderStatus(record.id, currentStatus)}
                                     >
                                         {nextStatusLabel}
                                     </Button>
                                 </Tooltip>
                             )}
                             {/* Si quieres añadir otras acciones aquí (ej: ver detalles avanzados en un modal), añádelas */}
                        </Space>
                    );
                },
            },
        ];
    }, [getColumnSearchProps, handleUpdateOrderStatus]); // Dependencias de useMemo


    // --- Renderizado de fila expandida (detalles de los ítems de la orden) ---
    const expandedRowRender = (record) => {
        const items = Array.isArray(record.items) ? record.items : [];

        // Definir columnas para la tabla de ítems
        const itemColumns = [
             {
                 title: 'Imagen', dataIndex: 'imageUrl', key: 'imageUrl', width: 60,
                 render: (url) => url ? <Image src={url} alt="Ítem" style={{ width: '40px', height: '40px', objectFit: 'cover' }} /> : <Tag>Sin imagen</Tag>,
             },
            { title: 'Producto', dataIndex: 'name', key: 'name' },
            { title: 'Cantidad', dataIndex: 'quantity', key: 'quantity', width: 80, align: 'center', render: (qty) => qty ?? 1 }, // Valor por defecto 1 si no está presente
            { title: 'Precio Unitario', dataIndex: 'price', key: 'price', width: 120, align: 'right', render: (price) => `$${Number(price || 0).toLocaleString('es-CO')}` },
            { title: 'Coins Unitarios', dataIndex: 'coins', key: 'coins', width: 100, align: 'right', render: (coins) => coins ?? 0 },
            // Puedes añadir más columnas para los ítems si tienen más detalles
        ];

        return (
            <div style={{ margin: '10px 0' }}>
                <Typography.Text strong>Detalles de los Productos:</Typography.Text>
                 {items.length === 0 ? (
                     <p style={{ marginTop: 10 }}>No hay detalles de productos para esta orden.</p>
                 ) : (
                    <Table
                        columns={itemColumns}
                        dataSource={items.map((item, index) => ({ ...item, key: index }))} // Añadir una clave única para cada item
                        pagination={false} // No paginar la tabla de ítems
                        size="small"
                        showHeader={true} // Mostrar encabezados de columna en la tabla de ítems
                        rowKey="key" // Usar la clave generada
                        style={{ marginTop: 10 }}
                    />
                 )}
            </div>
        );
    };


    return (
        <div className="page-container">
            <div className="page-header">
                <h2>Gestión de Ordenes de Compra</h2>
                 {/* No hay botón de añadir, ya que las órdenes se crean desde la app del usuario */}
            </div>

            <div className="page-content">
                 {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

                <Table
                    columns={columns}
                    dataSource={ordersList}
                    loading={isLoading}
                    rowKey="id" // Usar el ID del documento como clave única de la orden
                    size="middle"
                    style={{ marginTop: '20px' }}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 'max-content' }} // Permite scroll horizontal
                    // Configurar la fila expandible
                    expandedRowRender={expandedRowRender}
                    expandable={{
                         // Opcional: Configurar cuándo es expandible (ej: solo si tiene items)
                         // expandedRowKeys={...} // Si quieres controlar las filas expandidas programáticamente
                         // defaultExpandAllRows={true} // Expandir todas por defecto (puede ser abrumador con muchas órdenes)
                     }}
                />

                 {/* No hay modales de añadir/editar ya que no se gestionan así las órdenes */}
            </div>
        </div>
    );
}

export default OrdersPage;