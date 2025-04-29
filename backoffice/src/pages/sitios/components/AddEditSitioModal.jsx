// src/components/AddEditSitioModal.jsx (Con Form.List para Promos y Eventos añadido cuidadosamente)
import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Switch, Select, InputNumber, Button, message, Space, Upload } from 'antd';
import { UploadOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'; // Importa iconos AntD
// import { db } from '../../../firebase'; // <<--- REVISA ESTA RUTA!!! Debe ser probablemente '../firebase' o '../../firebase'
import { db } from '../../../firebase'; // Asumiendo que está en src/components y firebase en src/
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
// Importa funciones de Firebase Storage si vas a manejar subida de imágenes
// import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const { TextArea } = Input;
// const storage = getStorage(); // Inicializa storage si lo usas

// Opciones de ejemplo para Categoría (idealmente vendrían de Firestore)
const categoryOptions = [
    { value: 'Bares', label: 'Bares' },
    { value: 'Restaurantes', label: 'Restaurantes' },
    { value: 'Cafes', label: 'Cafés' },
    { value: 'Tiendas', label: 'Tiendas' },
    // ...otras categorías
];

function AddEditSitioModal({ open, onClose, sitio }) {
    const [form] = Form.useForm(); // Hook de AntD para controlar el formulario
    const [isPremium, setIsPremium] = useState(false); // Estado local para controlar campos premium
    const [isSubmitting, setIsSubmitting] = useState(false); // Estado para el botón de carga

    // Observa el valor del campo 'isPremium' del formulario en tiempo real
    const premiumValue = Form.useWatch('isPremium', form);

    // Actualiza el estado local cuando el valor del formulario cambie
    useEffect(() => {
        // Asegúrate de que premiumValue no sea undefined antes de actualizar
        if (premiumValue !== undefined) {
           setIsPremium(premiumValue);
        }
    }, [premiumValue]);

    // Efecto para rellenar el formulario cuando 'sitio' (para editar) cambia o al abrir
    useEffect(() => {
        if (open) { // Solo actualiza si el modal está abierto
            if (sitio) {
                // Modo Edición: Rellena con datos existentes
                 // Asegúrate que los arrays existen en 'sitio' antes de pasarlos
                 const initialData = {
                    ...sitio,
                    aboutSections: sitio.aboutSections ?? [],
                    promos: sitio.promos ?? [],
                    events: sitio.events ?? [],
                    galleryImages: sitio.galleryImages ?? [], // Asume que es un array de URLs por ahora
                    actions: sitio.actions ?? {},
                 };
                form.setFieldsValue(initialData);
                setIsPremium(sitio.isPremium ?? false);
            } else {
                 // Modo Añadir: Resetea a valores iniciales definidos en <Form>
                 form.resetFields();
                 // Forzar el valor inicial de isPremium en el formulario y estado
                 form.setFieldsValue({ isPremium: false });
                 setIsPremium(false);
            }
        }
    }, [sitio, open, form]); // Depende de sitio, open y form


    // --- Lógica para manejar el envío del formulario ---
    const handleFinish = async (values) => {
        setIsSubmitting(true);

        // Prepara los datos para Firestore
        const siteData = {
            ...values,
            // Toma el valor directamente del formulario para asegurar consistencia
            isPremium: values.isPremium ?? false,
            likes: values.likes ?? 0,
            // Asegura que los arrays/maps estén inicializados si no existen o filtra nulos
            galleryImages: (values.galleryImages ?? []).filter(img => img), // Asumiendo que es un array de URLs simple por ahora
            aboutSections: (values.aboutSections ?? []).filter(section => section),
            promos: (values.promos ?? []).filter(promo => promo),
            events: (values.events ?? []).filter(event => event),
            actions: values.actions ?? {},
        };

        // Lógica de subida de imágenes iría aquí...

        try {
            if (sitio) {
                // --- Modo Edición ---
                const siteDocRef = doc(db, 'sites', sitio.id);
                await updateDoc(siteDocRef, siteData);
                message.success('Sitio actualizado correctamente');
            } else {
                // --- Modo Añadir ---
                const sitesCollectionRef = collection(db, 'sites');
                await addDoc(sitesCollectionRef, siteData);
                message.success('Sitio añadido correctamente');
            }
            // No resetear aquí si onClose ya lo hace con destroyOnClose
            onClose(); // Cierra el modal
        } catch (error) {
            console.error("Error al guardar sitio:", error);
            message.error(`Error al guardar: ${error.message || 'Ocurrió un error desconocido'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            title={sitio ? 'Editar Sitio' : 'Añadir Nuevo Sitio'}
            open={open}
            onCancel={onClose}
            footer={null}
            width={800}
            // destroyOnClose // -> Causa que el form se resetee CADA vez que se cierra.
                            // Lo quitamos para que mantenga valores si sólo se cancela,
                            // y lo reseteamos manualmente en useEffect o handleFinish.
            // Forzar re-renderizado cuando cambia el sitio a editar
            key={sitio ? sitio.id : 'new'}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                // Los initialValues aquí pueden causar problemas con la edición,
                // es mejor usar form.setFieldsValue en useEffect.
                // initialValues={{...}}
            >
                {/* --- Campos Básicos (Sin cambios) --- */}
                <Form.Item name="title" label="Título" rules={[{ required: true, message: 'Por favor ingresa el título' }]}><Input /></Form.Item>
                <Form.Item name="subtitle" label="Subtítulo"><Input /></Form.Item>
                <Form.Item name="category" label="Categoría" rules={[{ required: true, message: 'Por favor selecciona una categoría' }]}>
                    <Select options={categoryOptions} placeholder="Selecciona categoría" />
                </Form.Item>
                <Form.Item name="location" label="Ubicación (Zona/Barrio)"><Input /></Form.Item>
                <Form.Item name="description" label="Descripción Detallada"><TextArea rows={4} /></Form.Item>
                <Form.Item name="imageUrl" label="URL Imagen Principal"><Input placeholder="https://..." /></Form.Item>
                <Form.Item name="verificationCode" label="Código Verificación"><Input /></Form.Item>
                <Form.Item name="likes" label="Likes Iniciales"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
                <Form.Item name="isPremium" label="¿Es Sitio Premium?" valuePropName="checked">
                    {/* Ya no necesitamos el onChange aquí si usamos Form.useWatch */}
                    <Switch />
                </Form.Item>

                {/* --- Campos Premium (Condicionales) --- */}
                {/* Usamos el estado local `isPremium` que se actualiza con Form.useWatch */}
                {isPremium && (
                    <>
                        <hr style={{ margin: '20px 0', borderColor: '#eee' }} />
                        <h3>Campos Premium</h3>

                        {/* Otros campos premium (Sin Cambios) */}
                        <Form.Item name="logoImageUrl" label="URL Logo"><Input placeholder="https://..." /></Form.Item>
                        <Form.Item name="phone" label="Teléfono"><Input /></Form.Item>
                        <Form.Item name="address" label="Dirección Completa"><Input /></Form.Item>
                        <Form.Item name="schedule" label="Horario"><Input /></Form.Item>
                        <Form.Item name="videoUrl" label="URL Video Principal"><Input placeholder="https://..." /></Form.Item>
                        <Form.Item name="videoThumbnail" label="URL Miniatura Video"><Input placeholder="https://..." /></Form.Item>
                        <Form.Item name="mapImageUrl" label="URL Imagen Mapa"><Input placeholder="https://..." /></Form.Item>
                        <Form.Item name="galleryImages" label="Galería de Imágenes (URLs)"><Input.TextArea rows={3} placeholder="Añade URLs separadas por comas o saltos de línea" /></Form.Item>
                        <Form.Item label="Secciones 'Acerca de'"><Form.List name="aboutSections">{(fields, { add, remove }) => (<>{fields.map(({ key, name, ...restField }) => (<Space key={key} style={{ display: 'flex', marginBottom: 8, border: '1px dashed #ccc', padding: '10px' }} align="baseline"><Form.Item {...restField} name={[name, 'icon']} rules={[{ required: true, message: 'Icono?' }]}><Input placeholder="Icono" style={{width: '100px'}}/></Form.Item><Form.Item {...restField} name={[name, 'title']} rules={[{ required: true, message: 'Falta título' }]} style={{flexGrow: 1}}><Input placeholder="Título Sección" /></Form.Item><Form.Item {...restField} name={[name, 'content']} rules={[{ required: true, message: 'Falta contenido' }]} style={{flexGrow: 2}}><TextArea rows={2} placeholder="Contenido Sección" /></Form.Item><Button type="link" danger onClick={() => remove(name)} icon={<DeleteOutlined />} /></Space>))}<Form.Item><Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Añadir Sección Acerca de</Button></Form.Item></>)}</Form.List></Form.Item>


                        {/* ============================================= */}
                        {/* SECCIÓN DE PROMOCIONES AÑADIDA       */}
                        {/* ============================================= */}
                        <Form.Item label="Promociones">
                            <Form.List name="promos">
                                {(fields, { add, remove }) => (
                                    <>
                                        {fields.map(({ key, name, ...restField }) => (
                                            <Space key={key} style={{ display: 'flex', marginBottom: 8, border: '1px dashed #ccc', padding: '10px', borderRadius: '4px' }} align="start">
                                                {/* Columna 1: Icono y Validez */}
                                                <div style={{ display: 'flex', flexDirection: 'column', width: '150px', gap: '8px' }}>
                                                    <Form.Item {...restField} name={[name, 'icon']} label="Icono" rules={[{ required: true, message: 'Icono?' }]}>
                                                        <Input placeholder="ej: local_offer" />
                                                    </Form.Item>
                                                    <Form.Item {...restField} name={[name, 'validity']} label="Validez">
                                                        <Input placeholder="ej: Jueves" />
                                                    </Form.Item>
                                                </div>
                                                {/* Columna 2: Título y Descripción */}
                                                <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, gap: '8px' }}>
                                                    <Form.Item {...restField} name={[name, 'title']} label="Título Promo" rules={[{ required: true, message: 'Falta título' }]}>
                                                        <Input />
                                                    </Form.Item>
                                                    <Form.Item {...restField} name={[name, 'description']} label="Descripción Promo" rules={[{ required: true, message: 'Falta desc.' }]}>
                                                        <TextArea rows={2} />
                                                    </Form.Item>
                                                </div>
                                                {/* Botón Eliminar */}
                                                <Button type="link" danger onClick={() => remove(name)} icon={<DeleteOutlined />} style={{ alignSelf: 'center', marginLeft: '8px' }} />
                                            </Space>
                                        ))}
                                        <Form.Item>
                                            {/* Añade valores por defecto al agregar */}
                                            <Button type="dashed" onClick={() => add({ icon: 'local_offer', title: '', description: '', validity: '' })} block icon={<PlusOutlined />}>
                                                Añadir Promoción
                                            </Button>
                                        </Form.Item>
                                    </>
                                )}
                            </Form.List>
                        </Form.Item>

                        {/* ============================================= */}
                        {/* SECCIÓN DE EVENTOS AÑADIDA         */}
                        {/* ============================================= */}
                         <Form.Item label="Eventos">
                            <Form.List name="events">
                                {(fields, { add, remove }) => (
                                    <>
                                        {fields.map(({ key, name, ...restField }) => (
                                             <Space key={key} style={{ display: 'flex', marginBottom: 8, border: '1px dashed #ccc', padding: '10px', borderRadius: '4px' }} align="start">
                                                {/* Columna 1: Icono y Validez */}
                                                <div style={{ display: 'flex', flexDirection: 'column', width: '150px', gap: '8px' }}>
                                                    <Form.Item {...restField} name={[name, 'icon']} label="Icono" rules={[{ required: true, message: 'Icono?' }]}>
                                                        <Input placeholder="ej: event"/>
                                                    </Form.Item>
                                                     <Form.Item {...restField} name={[name, 'validity']} label="Validez/Fecha">
                                                        <Input placeholder="ej: Viernes"/>
                                                     </Form.Item>
                                                </div>
                                                {/* Columna 2: Título y Descripción */}
                                                <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, gap: '8px' }}>
                                                    <Form.Item {...restField} name={[name, 'title']} label="Título Evento" rules={[{ required: true, message: 'Falta título' }]}>
                                                        <Input />
                                                    </Form.Item>
                                                    <Form.Item {...restField} name={[name, 'description']} label="Descripción Evento" rules={[{ required: true, message: 'Falta desc.' }]}>
                                                        <TextArea rows={2} />
                                                    </Form.Item>
                                                </div>
                                                {/* Botón Eliminar */}
                                                <Button type="link" danger onClick={() => remove(name)} icon={<DeleteOutlined />} style={{ alignSelf: 'center', marginLeft: '8px' }} />
                                            </Space>
                                        ))}
                                        <Form.Item>
                                             {/* Añade valores por defecto al agregar */}
                                            <Button type="dashed" onClick={() => add({icon: 'event', title: '', description: '', validity: ''})} block icon={<PlusOutlined />}>
                                                Añadir Evento
                                            </Button>
                                        </Form.Item>
                                    </>
                                )}
                            </Form.List>
                         </Form.Item>

                        {/* Acciones Personalizadas (Sin Cambios) */}
                        <Form.Item label="Etiquetas de Acciones"><Input.Group compact><Form.Item name={['actions', 'menu']} noStyle><Input style={{ width: '50%' }} placeholder="Etiqueta Menú (ej: Catálogo)" /></Form.Item><Form.Item name={['actions', 'reservas']} noStyle><Input style={{ width: '50%' }} placeholder="Etiqueta Reservas" /></Form.Item></Input.Group></Form.Item>
                    </>
                )}

                {/* --- Botones de Acción del Modal --- */}
                <Form.Item style={{ textAlign: 'right', marginTop: '20px' }}>
                    <Button onClick={onClose} style={{ marginRight: 8 }}>Cancelar</Button>
                    <Button type="primary" htmlType="submit" loading={isSubmitting}>
                        {sitio ? 'Actualizar Sitio' : 'Crear Sitio'}
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
}

export default AddEditSitioModal;