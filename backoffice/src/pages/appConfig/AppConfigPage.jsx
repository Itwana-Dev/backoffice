// src/pages/AppConfigPage.jsx
import React, { useState, useEffect } from 'react';
// Importar componentes de Ant Design para el formulario y layout
// CORRECCIÓN: Remover TextArea de la importación directa de antd
import { Form, Input, InputNumber, Switch, Select, Button, Space, Card, Row, Col, message } from 'antd';

// Correcta desestructuración de TextArea desde Input
const { TextArea } = Input;

// Ejemplo de datos de configuración hardcodeados
const hardcodedConfig = {
    appName: "ItwanaPlus",
    appVersion: "1.0.0",
    contactEmail: "support@itwanaplus.com",
    itemsPerPage: 10,
    enableNewRegistrations: true,
    defaultUserCoins: 1000,
    welcomeMessage: "¡Bienvenido a ItwanaPlus! Explora sitios, servicios y eventos.",
    // Ejemplo de ajuste con opciones predefinidas
    defaultTheme: "dark",
};

// Opciones para un campo select de ejemplo
const themeOptions = [
    { value: 'light', label: 'Claro' },
    { value: 'dark', label: 'Oscuro' },
    { value: 'system', label: 'Según Sistema' },
];

function AppConfigPage() {
    const [form] = Form.useForm();
    const [isSaving, setIsSaving] = useState(false); // Estado para simular el guardado

    // Cargar los datos de configuración hardcodeados en el formulario al montar
    useEffect(() => {
        form.setFieldsValue(hardcodedConfig);
    }, [form]); // Dependencia 'form' para asegurar que se inicialice después de que form esté listo

    // Manejador para el botón Guardar (simulado)
    const handleSave = async (values) => {
        setIsSaving(true);
        console.log('Simulando guardar configuración:', values);

        // Aquí iría la lógica REAL para guardar en Firestore o backend
        // Por ejemplo:
        // try {
        //   await updateDoc(doc(db, 'appConfig', 'settingsId'), values);
        //   message.success('Configuración guardada en Firestore!');
        // } catch (error) {
        //   console.error("Error al guardar en Firestore:", error);
        //   message.error('Error al guardar la configuración.');
        // }


        // Simular un tiempo de espera para guardar
        await new Promise(resolve => setTimeout(resolve, 1000));

        message.success('Configuración guardada (simulado)!');
        setIsSaving(false);
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h2>Configuración de la Aplicación</h2>
            </div>
            <div className="page-content">
                <Card title="Ajustes Generales de la Aplicación">
                    <Form
                        form={form} // Conecta la instancia del formulario
                        layout="vertical" // Etiquetas encima de los campos
                        onFinish={handleSave} // Llama a handleSave al enviar el formulario
                    >
                        <Row gutter={16}> {/* Espacio entre columnas */}
                            <Col xs={24} sm={12} lg={8}> {/* Columnas responsivas */}
                                <Form.Item
                                    name="appName"
                                    label="Nombre de la Aplicación"
                                    rules={[{ required: true, message: 'Ingresa el nombre' }]}
                                >
                                    <Input />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} lg={8}>
                                <Form.Item
                                    name="appVersion"
                                    label="Versión de la Aplicación"
                                >
                                    <Input disabled /> {/* Campo deshabilitado como ejemplo */}
                                </Form.Item>
                            </Col>
                             <Col xs={24} sm={12} lg={8}>
                                <Form.Item
                                    name="contactEmail"
                                    label="Email de Contacto"
                                    rules={[{ type: 'email', message: 'Email no válido' }]}
                                >
                                    <Input />
                                </Form.Item>
                            </Col>
                             <Col xs={24} sm={12} lg={8}>
                                <Form.Item
                                    name="itemsPerPage"
                                    label="Ítems por Página (Tablas)"
                                    tooltip="Define cuántos elementos se muestran por defecto en las tablas paginadas."
                                >
                                     <InputNumber min={5} max={100} style={{ width: '100%' }}/>
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} lg={8}>
                                <Form.Item
                                    name="defaultUserCoins"
                                    label="Coins por Defecto (Nuevo Usuario)"
                                    tooltip="Cantidad de coins asignados a un usuario al registrarse."
                                >
                                     <InputNumber min={0} style={{ width: '100%' }}/>
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} lg={8}>
                                <Form.Item
                                     name="enableNewRegistrations"
                                     label="Habilitar Nuevos Registros"
                                     valuePropName="checked"
                                     tooltip="Controla si los nuevos usuarios pueden registrarse en la aplicación."
                                 >
                                     <Switch />
                                 </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} lg={8}>
                                <Form.Item
                                     name="defaultTheme"
                                     label="Tema por Defecto"
                                 >
                                     <Select options={themeOptions} placeholder="Selecciona un tema"/>
                                 </Form.Item>
                            </Col>
                             <Col span={24}> {/* Campo que ocupa todo el ancho */}
                                <Form.Item
                                    name="welcomeMessage"
                                    label="Mensaje de Bienvenida (App)"
                                >
                                    <TextArea rows={3} /> {/* Aquí se usa correctamente TextArea */}
                                </Form.Item>
                             </Col>

                        </Row>

                        <Form.Item>
                            {/* Botón de Guardar */}
                            <Button type="primary" htmlType="submit" loading={isSaving}>
                                Guardar Configuración
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            </div>
        </div>
    );
}

export default AppConfigPage;