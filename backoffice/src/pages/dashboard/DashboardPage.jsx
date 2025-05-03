// src/pages/DashboardPage.jsx (CON TOOLTIPS EN LAS TARJETAS DE ESTADÍSTICAS)
import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore'; // Importar getDocs para obtener datos una vez
import { db } from '../../firebase'; // Ajusta la ruta si es necesario

// Importa componentes de Ant Design
import { Card, Col, Row, Statistic, Spin, Alert, Typography, Tooltip } from 'antd'; // Añadir Tooltip
import { UserOutlined, ShopOutlined, CalendarOutlined, TeamOutlined, StarOutlined, TagOutlined, FolderOutlined, PictureOutlined } from '@ant-design/icons'; // Más iconos para las estadísticas/gráficos

// Importar componentes de Chart.js y react-chartjs-2
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Registrar los elementos necesarios de Chart.js
ChartJS.register(ArcElement, ChartTooltip, Legend);

import './DashboardPage.css'; // Asegúrate de tener este archivo CSS

const { Title } = Typography; // Usar Title de Typography para subtítulos

function DashboardPage() {
    const [counts, setCounts] = useState({
        users: 0,
        sites: 0,
        events: 0,
        professionals: 0,
         // NUEVOS conteos generales
        siteCategories: 0,
        serviceCategories: 0,
        totalSiteBanners: 0,
        totalServiceBanners: 0,
    });
     // Estados para conteos específicos de sitios (para el gráfico)
     // Mantener si quieres mostrar esta estadística por separado
    const [premiumSitesDashboardCount, setPremiumSitesDashboardCount] = useState(0);
    const [, setNonPremiumSitesDashboardCount] = useState(0);


    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estados para los datos de los gráficos
    const [entityDistributionChartData, setEntityDistributionChartData] = useState(null); // Gráfico 1 (Entidades Principales)
    const [premiumSitesChartData, setPremiumSitesChartData] = useState(null); // Gráfico 2 (Sitios Premium)


    // --- Cargar datos para el Dashboard ---
    useEffect(() => {
        const fetchDataAndPrepareCharts = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const usersCollection = collection(db, 'users');
                const sitesCollection = collection(db, 'sites');
                const eventsCollection = collection(db, 'events');
                const professionalsCollection = collection(db, 'professionals');
                 // Referencias a las colecciones de categorías
                const siteCategoriesCollection = collection(db, 'site_categories');
                const serviceCategoriesCollection = collection(db, 'serviceCategories');


                // Obtener snapshots de las colecciones
                const [usersSnap, sitesSnap, eventsSnap, professionalsSnap, siteCategoriesSnap, serviceCategoriesSnap] = await Promise.all([
                    getDocs(usersCollection),
                    getDocs(sitesCollection),
                    getDocs(eventsCollection),
                    getDocs(professionalsCollection),
                    getDocs(siteCategoriesCollection), // Obtener categorías de sitios
                    getDocs(serviceCategoriesCollection), // Obtener categorías de servicios
                ]);

                // --- Calcular conteos generales ---
                const fetchedCounts = {
                    users: usersSnap.size,
                    sites: sitesSnap.size,
                    events: eventsSnap.size,
                    professionals: professionalsSnap.size,
                    siteCategories: siteCategoriesSnap.size, // Conteo de categorías de sitios
                    serviceCategories: serviceCategoriesSnap.size, // Conteo de categorías de servicios
                };

                 // --- Calcular total de banners por tipo de categoría ---
                 let totalSiteBanners = 0;
                 siteCategoriesSnap.docs.forEach(doc => {
                     const data = doc.data();
                     if (Array.isArray(data.bannerPaths)) {
                         totalSiteBanners += data.bannerPaths.length;
                     }
                 });
                 fetchedCounts.totalSiteBanners = totalSiteBanners;

                 let totalServiceBanners = 0;
                 serviceCategoriesSnap.docs.forEach(doc => {
                     const data = doc.data();
                     if (Array.isArray(data.bannerPaths)) {
                         totalServiceBanners += data.bannerPaths.length;
                     }
                 });
                 fetchedCounts.totalServiceBanners = totalServiceBanners;


                setCounts(fetchedCounts);

                // --- Calcular conteos específicos para sitios (para el gráfico) ---
                const allSitesData = sitesSnap.docs.map(doc => doc.data());
                const premiumCount = allSitesData.filter(site => site.isPremium === true).length;
                const nonPremiumCount = allSitesData.length - premiumCount;

                setPremiumSitesDashboardCount(premiumCount);
                setNonPremiumSitesDashboardCount(nonPremiumCount);


                // --- Preparar datos para Gráfico 1 (Distribución de Entidades Principales) ---
                setEntityDistributionChartData({
                    labels: ['Usuarios', 'Sitios', 'Eventos', 'Profesionales'],
                    datasets: [
                        {
                            label: 'Cantidad',
                            data: [fetchedCounts.users, fetchedCounts.sites, fetchedCounts.events, fetchedCounts.professionals],
                            backgroundColor: [
                                'rgba(54, 162, 235, 0.6)', // Azul para Usuarios
                                'rgba(255, 206, 86, 0.6)', // Amarillo para Sitios
                                'rgba(75, 192, 192, 0.6)', // Cian para Eventos
                                'rgba(153, 102, 255, 0.6)', // Púrpura para Profesionales
                            ],
                            borderColor: [
                                'rgba(54, 162, 235, 1)',
                                'rgba(255, 206, 86, 1)',
                                'rgba(75, 192, 192, 1)',
                                'rgba(153, 102, 255, 1)',
                            ],
                            borderWidth: 1,
                        },
                    ],
                });

                 // --- Preparar datos para Gráfico 2 (Distribución de Sitios Premium) ---
                 // Solo si hay sitios para evitar error en el gráfico
                 if (allSitesData.length > 0) {
                     setPremiumSitesChartData({
                         labels: ['Premium', 'No Premium'],
                         datasets: [
                             {
                                 label: 'Cantidad de Sitios',
                                 data: [premiumCount, nonPremiumCount],
                                 backgroundColor: [
                                     'rgba(255, 165, 0, 0.6)', // Naranja/Dorado para Premium
                                     'rgba(201, 203, 207, 0.6)', // Gris para No Premium
                                 ],
                                  borderColor: [
                                     'rgba(255, 165, 0, 1)',
                                     'rgba(201, 203, 207, 1)',
                                 ],
                                 borderWidth: 1,
                             },
                         ],
                     });
                 } else {
                     setPremiumSitesChartData(null); // No mostrar gráfico si no hay sitios
                 }


                setIsLoading(false);
            } catch (err) {
                console.error("Error al obtener datos para el dashboard:", err);
                setError("Error al cargar los datos del resumen.");
                setIsLoading(false);
            }
        };

        fetchDataAndPrepareCharts();
    }, []); // Dependencia vacía

    // Opciones del gráfico (se pueden aplicar a ambos o crear opciones separadas)
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                enabled: true,
            }
        },
    };


    return (
        <div className="page-container">
            <div className="page-header">
                <h2>Dashboard</h2>
            </div>

            <div className="page-content">
                {error && <Alert message={error} type="error" showIcon style={{ marginBottom: '20px' }} />}

                {isLoading ? (
                    <div style={{ textAlign: 'center', marginTop: '50px' }}>
                        <Spin size="large" tip="Cargando resumen..." />
                    </div>
                ) : (
                    <>
                        {/* Sección de Estadísticas Rápidas */}
                        <Title level={4} style={{ marginTop: 0, marginBottom: 20 }}>Resumen General</Title>
                        <Row gutter={[16, 16]}>
                            {/* Estadística de Usuarios Registrados */}
                            <Col xs={24} sm={12} md={8} lg={6}>
                                <Tooltip title="Número total de usuarios registrados en la aplicación."> {/* Tooltip */}
                                    <Card>
                                        <Statistic
                                            title="Usuarios Registrados"
                                            value={counts.users}
                                            prefix={<UserOutlined style={{ color: 'rgba(54, 162, 235, 0.8)' }} />}
                                        />
                                    </Card>
                                </Tooltip>
                            </Col>

                            {/* Estadística de Sitios Registrados */}
                            <Col xs={24} sm={12} md={8} lg={6}>
                                <Tooltip title="Número total de sitios (establecimientos, lugares) registrados en la aplicación."> {/* Tooltip */}
                                    <Card>
                                        <Statistic
                                            title="Sitios Registrados"
                                            value={counts.sites}
                                            prefix={<ShopOutlined style={{ color: 'rgba(255, 206, 86, 0.8)' }} />}
                                        />
                                    </Card>
                                </Tooltip>
                            </Col>

                             {/* Estadística solo para Sitios Premium */}
                             <Col xs={24} sm={12} md={8} lg={6}>
                                <Tooltip title="Cantidad de sitios que tienen una suscripción o estado premium."> {/* Tooltip */}
                                    <Card>
                                        <Statistic
                                            title="Sitios Premium"
                                            value={premiumSitesDashboardCount}
                                            prefix={<StarOutlined style={{ color: 'rgba(255, 165, 0, 0.8)' }} />} // Icono de estrella dorada
                                        />
                                    </Card>
                                </Tooltip>
                            </Col>

                            {/* Estadística de Eventos Programados */}
                            <Col xs={24} sm={12} md={8} lg={6}>
                                <Tooltip title="Número total de eventos especiales o promociones programadas."> {/* Tooltip */}
                                    <Card>
                                        <Statistic
                                            title="Eventos Programados"
                                            value={counts.events}
                                            prefix={<CalendarOutlined style={{ color: 'rgba(75, 192, 192, 0.8)' }} />}
                                        />
                                    </Card>
                                </Tooltip>
                            </Col>

                            {/* Estadística de Profesionales Registrados */}
                            <Col xs={24} sm={12} md={8} lg={6}>
                                <Tooltip title="Número total de perfiles de profesionales/servicios registrados."> {/* Tooltip */}
                                    <Card>
                                        <Statistic
                                            title="Profesionales"
                                            value={counts.professionals}
                                            prefix={<TeamOutlined style={{ color: 'rgba(153, 102, 255, 0.8)' }} />}
                                        />
                                    </Card>
                                </Tooltip>
                            </Col>

                             {/* Estadísticas para Categorías de Sitios */}
                             <Col xs={24} sm={12} md={8} lg={6}>
                                <Tooltip title="Cantidad total de categorías disponibles para clasificar los sitios."> {/* Tooltip */}
                                    <Card>
                                        <Statistic
                                            title="Categorías de Sitios"
                                            value={counts.siteCategories}
                                            prefix={<FolderOutlined style={{ color: 'rgba(255, 99, 132, 0.8)' }} />} // Icono de carpeta (rojo)
                                        />
                                    </Card>
                                </Tooltip>
                            </Col>
                            {/* Estadísticas para Categorías de Servicios */}
                             <Col xs={24} sm={12} md={8} lg={6}>
                                <Tooltip title="Cantidad total de categorías disponibles para clasificar los profesionales/servicios."> {/* Tooltip */}
                                    <Card>
                                        <Statistic
                                            title="Categorías de Servicios"
                                            value={counts.serviceCategories}
                                            prefix={<FolderOutlined style={{ color: 'rgba(50, 205, 50, 0.8)' }} />} // Icono de carpeta (verde lima)
                                        />
                                    </Card>
                                </Tooltip>
                            </Col>

                             {/* Estadísticas para Total de Banners de Sitios */}
                             <Col xs={24} sm={12} md={8} lg={6}>
                                <Tooltip title="Número total de imágenes de banner añadidas a las categorías de sitios."> {/* Tooltip */}
                                    <Card>
                                        <Statistic
                                            title="Total Banners (Sitios)"
                                            value={counts.totalSiteBanners}
                                            prefix={<PictureOutlined style={{ color: 'rgba(255, 159, 64, 0.8)' }} />} // Icono de imagen (naranja)
                                        />
                                    </Card>
                                </Tooltip>
                            </Col>
                             {/* Estadísticas para Total de Banners de Servicios */}
                             <Col xs={24} sm={12} md={8} lg={6}>
                                <Tooltip title="Número total de imágenes de banner añadidas a las categorías de servicios."> {/* Tooltip */}
                                    <Card>
                                        <Statistic
                                            title="Total Banners (Servicios)"
                                            value={counts.totalServiceBanners}
                                            prefix={<PictureOutlined style={{ color: 'rgba(192, 192, 192, 0.8)' }} />} // Icono de imagen (gris)
                                        />
                                    </Card>
                                </Tooltip>
                            </Col>


                            {/* Puedes añadir más tarjetas aquí para otras colecciones */}
                        </Row>

                        {/* Sección de Gráficos */}
                         <Title level={4} style={{ marginTop: 40, marginBottom: 20 }}>Visualizaciones</Title>
                         <Row gutter={[16, 16]}>
                             {/* Gráfico 1: Distribución General de Entidades */}
                             {entityDistributionChartData && (
                                 <Col xs={24} md={12}>
                                     <Card title="Distribución de Entidades Principales">
                                          <div style={{ height: '300px' }}>
                                             <Doughnut data={entityDistributionChartData} options={chartOptions} />
                                          </div>
                                     </Card>
                                 </Col>
                             )}

                              {/* Gráfico 2: Distribución de Sitios Premium vs No Premium */}
                              {premiumSitesChartData && (
                                 <Col xs={24} md={12}>
                                     <Card title="Distribución de Sitios (Premium vs No Premium)">
                                          <div style={{ height: '300px' }}>
                                             <Doughnut data={premiumSitesChartData} options={chartOptions} />
                                          </div>
                                     </Card>
                                 </Col>
                              )}

                             {/* Puedes añadir más gráficos aquí, por ejemplo, distribución por categorías */}
                         </Row>
                    </>
                )}
            </div>
        </div>
    );
}

export default DashboardPage;