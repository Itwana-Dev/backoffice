// src/components/AddEditSitioModal.jsx (Versión CORREGIDA para galleryImages)
import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Switch, Select, InputNumber, Button, message, Space, Upload, Alert } from 'antd'; // Añadir Alert
import { UploadOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
// Asegúrate que la ruta a firebase es correcta desde ESTE archivo (components)
import { db } from '../../../firebase'; // Ajusta esta ruta si es necesario
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
// import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const { TextArea } = Input;
// const storage = getStorage();

const categoryOptions = [
    { value: 'Bares', label: 'Bares' },
    { value: 'Restaurantes', label: 'Restaurantes' },
    { value: 'Cafes', label: 'Cafés' },
    { value: 'Tiendas', label: 'Tiendas' },
    // Agrega más categorías según necesites
];

function AddEditSitioModal({ open, onClose, sitio }) {
    const [form] = Form.useForm();
    const [isPremium, setIsPremium] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null); // Estado para errores del submit

    // Observa el valor del campo 'isPremium' en el formulario
    const premiumValue = Form.useWatch('isPremium', form);

    // Actualiza el estado local 'isPremium' cuando cambia el valor en el form
    useEffect(() => {
        if (premiumValue !== undefined) {
            setIsPremium(premiumValue);
        }
    }, [premiumValue]);

    // Efecto para inicializar el formulario cuando se abre el modal o cambia el 'sitio'
    useEffect(() => {
        setSubmitError(null); // Limpia errores previos al abrir/cambiar sitio
        if (open) {
            if (sitio) {
                // --- Modo Edición ---
                // Pre-procesa los datos del sitio para asegurar que los arrays existan
                const initialData = {
                    ...sitio,
                    // Asegura que los campos de tipo array tengan un array vacío como fallback
                    aboutSections: sitio.aboutSections ?? [],
                    promos: sitio.promos ?? [],
                    events: sitio.events ?? [],
                    // IMPORTANTE: galleryImages viene de Firestore como array,
                    // pero el TextArea espera un string. Convertimos el array a string.
                    galleryImages: Array.isArray(sitio.galleryImages)
                        ? sitio.galleryImages.join('\n') // Une las URLs con saltos de línea para el TextArea
                        : '', // Si no es array (o no existe), string vacío
                    actions: sitio.actions ?? {},
                };
                form.setFieldsValue(initialData);
                setIsPremium(sitio.isPremium ?? false);
            } else {
                // --- Modo Añadir ---
                form.resetFields();
                // Establece valores iniciales seguros para campos que podrían no estar en el form inicialmente
                form.setFieldsValue({
                    isPremium: false,
                    likes: 0,
                    galleryImages: '', // Inicializa como string vacío para el TextArea
                    aboutSections: [],
                    promos: [],
                    events: [],
                    actions: {},
                });
                setIsPremium(false);
            }
        }
    }, [sitio, open, form]); // Dependencias: se ejecuta si cambia el sitio, si se abre/cierra, o si cambia la instancia del form

    // --- Manejador del envío del formulario ---
    const handleFinish = async (values) => {
        setIsSubmitting(true);
        setSubmitError(null); // Limpia error previo

        // --- Prepara los datos para Firestore ---
        const siteData = {
            ...values, // Incluye todos los valores del formulario
            isPremium: values.isPremium ?? false, // Asegura valor booleano
            likes: values.likes ?? 0, // Asegura valor numérico

            // *** CORRECCIÓN AQUÍ ***
            // Convierte el string del TextArea de galleryImages de nuevo a un array
            galleryImages: typeof values.galleryImages === 'string'
                ? values.galleryImages
                    .split(/[\n,]+/)          // Divide por saltos de línea o comas
                    .map(url => url.trim())     // Quita espacios en blanco
                    .filter(url => url !== '')  // Filtra URLs vacías
                : [], // Si no es string, guarda array vacío

            // Filtra posibles elementos nulos/undefined en arrays de Form.List (si se borraron items)
            aboutSections: (values.aboutSections ?? []).filter(section => section && section.title), // Asegura que al menos el título exista
            promos: (values.promos ?? []).filter(promo => promo && promo.title), // Asegura que al menos el título exista
            events: (values.events ?? []).filter(event => event && event.title), // Asegura que al menos el título exista
            actions: values.actions ?? {}, // Asegura objeto vacío como fallback
        };

        // --- Lógica de subida de imágenes (si la implementas) iría aquí ---
        // Ejemplo: si usaras un componente Upload de AntD, aquí procesarías los archivos
        // y obtendrías las URLs de descarga antes de guardar en Firestore.

        // --- Guarda en Firestore ---
        try {
            if (sitio) {
                // Actualizar documento existente
                const siteDocRef = doc(db, 'sites', sitio.id);
                await updateDoc(siteDocRef, siteData);
                message.success('Sitio actualizado correctamente');
            } else {
                // Añadir nuevo documento
                const sitesCollectionRef = collection(db, 'sites');
                await addDoc(sitesCollectionRef, siteData);
                message.success('Sitio añadido correctamente');
            }
            onClose(); // Cierra el modal si todo fue bien
        } catch (error) {
            console.error("Error al guardar sitio:", error);
            const errorMsg = `Error al guardar: ${error.message || 'Ocurrió un error desconocido'}`;
            setSubmitError(errorMsg); // Muestra el error en el Alert dentro del modal
            message.error(errorMsg); // Muestra también mensaje flotante de error
        } finally {
            setIsSubmitting(false); // Termina el estado de carga del botón
        }
    };

    // --- Renderizado del Modal y Formulario ---
    return (
        <Modal
            title={sitio ? 'Editar Sitio' : 'Añadir Nuevo Sitio'}
            open={open}
            onCancel={onClose} // Llama a la función onClose pasada por props al cancelar
            footer={null} // Quitamos los botones por defecto para poner los nuestros en el Form
            width={800}
            // key fuerza el re-renderizado completo del Modal y su contenido si 'sitio' cambia.
            // Útil para asegurar limpieza de estado entre modo "Añadir" y "Editar".
            // Alternativa a usar `destroyOnClose` en Modal o lógica más compleja en useEffect.
            key={sitio ? `edit-${sitio.id}` : 'add-new'}
            // destroyOnClose // Otra opción para limpiar el estado del form al cerrar (puede tener ligera penalización de rendimiento)
        >
            <Form
                form={form} // Instancia del formulario AntD
                layout="vertical" // Etiquetas encima de los campos
                onFinish={handleFinish} // Función a ejecutar al enviar el form validado
                // No usar initialValues aquí si ya usas form.setFieldsValue en useEffect,
                // podría causar conflictos o comportamientos inesperados.
            >
                {/* Muestra el error de submit si existe */}
                {submitError && (
                    <Alert message={submitError} type="error" showIcon style={{ marginBottom: '15px' }}/>
                )}

                {/* --- Campos Básicos --- */}
                <Form.Item name="title" label="Título" rules={[{ required: true, message: 'Por favor ingresa el título' }]}>
                    <Input />
                </Form.Item>
                <Form.Item name="subtitle" label="Subtítulo">
                    <Input />
                </Form.Item>
                <Form.Item name="category" label="Categoría" rules={[{ required: true, message: 'Por favor selecciona una categoría' }]}>
                    <Select options={categoryOptions} placeholder="Selecciona categoría" />
                </Form.Item>
                <Form.Item name="location" label="Ubicación (Zona/Barrio)">
                    <Input />
                </Form.Item>
                <Form.Item name="description" label="Descripción Detallada">
                    <TextArea rows={4} />
                </Form.Item>
                <Form.Item name="imageUrl" label="URL Imagen Principal">
                    <Input placeholder="https://..." />
                </Form.Item>
                <Form.Item name="verificationCode" label="Código Verificación">
                    <Input />
                </Form.Item>
                <Form.Item name="likes" label="Likes Iniciales">
                    <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="isPremium" label="¿Es Sitio Premium?" valuePropName="checked">
                    <Switch />
                </Form.Item>


                {/* --- Campos Premium (Condicionales) --- */}
                {isPremium && (
                    <>
                        <hr style={{ margin: '20px 0', borderColor: '#eee' }} />
                        <h3>Campos Premium</h3>

                        <Form.Item name="logoImageUrl" label="URL Logo">
                            <Input placeholder="https://..." />
                        </Form.Item>
                        <Form.Item name="phone" label="Teléfono">
                            <Input />
                        </Form.Item>
                        <Form.Item name="address" label="Dirección Completa">
                            <Input />
                        </Form.Item>
                        <Form.Item name="schedule" label="Horario">
                            <Input />
                        </Form.Item>
                        <Form.Item name="videoUrl" label="URL Video Principal">
                            <Input placeholder="https://..." />
                        </Form.Item>
                        <Form.Item name="videoThumbnail" label="URL Miniatura Video">
                            <Input placeholder="https://..." />
                        </Form.Item>
                        <Form.Item name="mapImageUrl" label="URL Imagen Mapa">
                            <Input placeholder="https://..." />
                        </Form.Item>

                        {/* --- Galería de Imágenes (Input.TextArea) --- */}
                        <Form.Item
                            name="galleryImages"
                            label="Galería de Imágenes (URLs)"
                            tooltip="Añade una URL por línea o separadas por comas."
                        >
                            <Input.TextArea
                                rows={3}
                                placeholder="https://ejemplo.com/imagen1.jpg&#10;https://ejemplo.com/imagen2.jpg, https://ejemplo.com/imagen3.jpg"
                            />
                        </Form.Item>

                        {/* --- Secciones 'Acerca de' (Form.List) --- */}
                        <Form.Item label="Secciones 'Acerca de'">
                            <Form.List name="aboutSections">
                                {(fields, { add, remove }) => (
                                    <>
                                        {fields.map(({ key, name, ...restField }) => (
                                            <Space key={key} style={{ display: 'flex', marginBottom: 8, border: '1px dashed #ccc', padding: '10px', borderRadius: '4px' }} align="baseline">
                                                <Form.Item {...restField} name={[name, 'icon']} style={{ flexShrink: 0 }}>
                                                    <Input placeholder="Icono" style={{width: '100px'}}/>
                                                </Form.Item>
                                                <Form.Item {...restField} name={[name, 'title']} rules={[{ required: true, message: 'Falta título' }]} style={{flexGrow: 1}}>
                                                    <Input placeholder="Título Sección" />
                                                </Form.Item>
                                                <Form.Item {...restField} name={[name, 'content']} rules={[{ required: true, message: 'Falta contenido' }]} style={{flexGrow: 2}}>
                                                    <TextArea rows={1} placeholder="Contenido Sección" />
                                                </Form.Item>
                                                <Button type="link" danger onClick={() => remove(name)} icon={<DeleteOutlined />} aria-label="Eliminar sección"/>
                                            </Space>
                                        ))}
                                        <Form.Item>
                                            <Button type="dashed" onClick={() => add({icon:'', title:'', content:''})} block icon={<PlusOutlined />}>
                                                Añadir Sección Acerca de
                                            </Button>
                                        </Form.Item>
                                    </>
                                )}
                            </Form.List>
                        </Form.Item>


                        {/* --- PROMOCIONES (Form.List) --- */}
                        <Form.Item label="Promociones">
                            <Form.List name="promos">
                                {(fields, { add, remove }, { errors }) => (
                                    <>
                                        {fields.map(({ key, name, ...restField }) => (
                                            <Space key={key} style={{ display: 'flex', marginBottom: 8, border: '1px dashed #ccc', padding: '10px', borderRadius: '4px' }} align="start">
                                                <div style={{ display: 'flex', flexDirection: 'column', width: '150px', gap: '8px' }}>
                                                    <Form.Item {...restField} name={[name, 'icon']} label="Icono" rules={[{ required: true, message: 'Icono requerido' }]}>
                                                        <Input placeholder="ej: local_offer" />
                                                    </Form.Item>
                                                    <Form.Item {...restField} name={[name, 'validity']} label="Validez">
                                                        <Input placeholder="ej: Jueves" />
                                                    </Form.Item>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, gap: '8px' }}>
                                                    <Form.Item {...restField} name={[name, 'title']} label="Título Promo" rules={[{ required: true, message: 'Título requerido' }]}>
                                                        <Input />
                                                    </Form.Item>
                                                    <Form.Item {...restField} name={[name, 'description']} label="Descripción Promo" rules={[{ required: true, message: 'Descripción requerida' }]}>
                                                        <TextArea rows={2} />
                                                    </Form.Item>
                                                </div>
                                                <Button type="link" danger onClick={() => remove(name)} icon={<DeleteOutlined />} style={{ alignSelf: 'center', marginLeft: '8px' }} aria-label="Eliminar promoción"/>
                                            </Space>
                                        ))}
                                        <Form.Item>
                                            <Button type="dashed" onClick={() => add({ icon: 'local_offer', title: '', description: '', validity: '' })} block icon={<PlusOutlined />}>
                                                Añadir Promoción
                                            </Button>
                                            <Form.ErrorList errors={errors} />
                                        </Form.Item>
                                    </>
                                )}
                            </Form.List>
                        </Form.Item>

                        {/* --- EVENTOS (Form.List) --- */}
                        <Form.Item label="Eventos">
                             <Form.List name="events">
                                {(fields, { add, remove }, { errors }) => (
                                    <>
                                        {fields.map(({ key, name, ...restField }) => (
                                            <Space key={key} style={{ display: 'flex', marginBottom: 8, border: '1px dashed #ccc', padding: '10px', borderRadius: '4px' }} align="start">
                                                <div style={{ display: 'flex', flexDirection: 'column', width: '150px', gap: '8px' }}>
                                                    <Form.Item {...restField} name={[name, 'icon']} label="Icono" rules={[{ required: true, message: 'Icono requerido' }]}>
                                                        <Input placeholder="ej: event"/>
                                                    </Form.Item>
                                                     <Form.Item {...restField} name={[name, 'validity']} label="Validez/Fecha">
                                                        <Input placeholder="ej: Viernes"/>
                                                    </Form.Item>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, gap: '8px' }}>
                                                    <Form.Item {...restField} name={[name, 'title']} label="Título Evento" rules={[{ required: true, message: 'Título requerido' }]}>
                                                        <Input />
                                                    </Form.Item>
                                                    <Form.Item {...restField} name={[name, 'description']} label="Descripción Evento" rules={[{ required: true, message: 'Descripción requerida' }]}>
                                                        <TextArea rows={2} />
                                                    </Form.Item>
                                                </div>
                                                <Button type="link" danger onClick={() => remove(name)} icon={<DeleteOutlined />} style={{ alignSelf: 'center', marginLeft: '8px' }} aria-label="Eliminar evento"/>
                                            </Space>
                                        ))}
                                        <Form.Item>
                                            <Button type="dashed" onClick={() => add({icon: 'event', title: '', description: '', validity: ''})} block icon={<PlusOutlined />}>
                                                Añadir Evento
                                            </Button>
                                            <Form.ErrorList errors={errors} />
                                        </Form.Item>
                                    </>
                                )}
                            </Form.List>
                        </Form.Item>

                        {/* --- Acciones Personalizadas --- */}
                        <Form.Item label="Etiquetas de Acciones">
                            <Input.Group compact>
                                <Form.Item name={['actions', 'menu']} noStyle>
                                    <Input style={{ width: '50%' }} placeholder="Etiqueta Menú (ej: Catálogo)" />
                                </Form.Item>
                                <Form.Item name={['actions', 'reservas']} noStyle>
                                    <Input style={{ width: '50%' }} placeholder="Etiqueta Reservas" />
                                </Form.Item>
                            </Input.Group>
                        </Form.Item>
                    </>
                )}

                {/* --- Botones de Acción del Modal --- */}
                <Form.Item style={{ textAlign: 'right', marginTop: '20px', borderTop: '1px solid #f0f0f0', paddingTop: '15px', marginBottom: 0 }}>
                    {/* El marginBottom: 0 en Form.Item y el paddingTop compensan el espacio por defecto */}
                    <Button onClick={onClose} style={{ marginRight: 8 }}>
                        Cancelar
                    </Button>
                    <Button type="primary" htmlType="submit" loading={isSubmitting}>
                        {sitio ? 'Actualizar Sitio' : 'Crear Sitio'}
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
}

export default AddEditSitioModal;