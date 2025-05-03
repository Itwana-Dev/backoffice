// src/pages/servicios/components/AddEditProfesionalModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Button, message, Alert, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { db } from '../../../firebase'; // Asegúrate que esta ruta es correcta
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';

const { TextArea } = Input;

function AddEditProfesionalModal({ open, onClose, profesionalData }) {
    const [form] = Form.useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    const isEditing = !!profesionalData; // Determina si estamos editando

    // Inicializar formulario cuando cambia profesionalData o se abre el modal
    useEffect(() => {
        setSubmitError(null); // Limpiar errores
        if (open) {
            if (isEditing) {
                // Modo Editar: establece los valores existentes
                const initialData = {
                    ...profesionalData,
                    // Asegura que los campos numéricos tengan un valor por defecto
                    rating: profesionalData.rating ?? 0,
                    whatsappTapCount: profesionalData.whatsappTapCount ?? 0,
                    yearsOfExperience: profesionalData.yearsOfExperience ?? 0,
                    // Convertir arrays a formatos compatibles con los inputs (ej: string para TextArea, o estructurar para Form.List si fuera necesario anidar objetos)
                    // Para arrays de strings simples, Form.List maneja arrays de strings directamente si el campo anidado no tiene nombre (solo restField)
                    // Pero si quieres usar un input por elemento, necesitas mapear a objetos con una clave (ej: { value: string })
                    // Vamos a asumir que Languages y Services se ingresan como listas separadas en el modal si es necesario.
                    // Para Form.List con Input simple, la estructura de datos esperada es un array de valores (ej: ['Español', 'Ingles'])
                    // La forma más sencilla para edición con Form.List es que cada item en la lista sea un objeto con una clave,
                    // por ejemplo: [{ text: 'Español' }, { text: 'Ingles' }].
                    // Si la data de Firestore es un array de strings ['Español', 'Ingles'], necesitamos transformarla.
                    // Vamos a usar un Input simple por ahora para languages y services, y Form.List para galleryImages como en Sitios.

                     // Convertir arrays a strings para TextAreas (si se usaran TextAreas para listas)
                    // languages: Array.isArray(profesionalData.languages) ? profesionalData.languages.join('\n') : '',
                    // services: Array.isArray(profesionalData.services) ? profesionalData.services.join('\n') : '',
                    // galleryImages: Array.isArray(profesionalData.galleryImages) ? profesionalData.galleryImages.join('\n') : '',

                    // Convertir array de strings a formato para Form.List con un campo 'url'
                    galleryImages: Array.isArray(profesionalData.galleryImages)
                        ? profesionalData.galleryImages.map(url => ({ url: url ?? '' }))
                        : [],
                    languages: Array.isArray(profesionalData.languages)
                         ? profesionalData.languages.map(lang => ({ text: lang ?? ''}))
                         : [],
                     services: Array.isArray(profesionalData.services)
                         ? profesionalData.services.map(service => ({ text: service ?? ''}))
                         : [],

                };
                form.setFieldsValue(initialData);
            } else {
                // Modo Añadir: resetea y establece valores por defecto
                form.resetFields();
                form.setFieldsValue({
                    categoryId: '',
                    description: '',
                    galleryImages: [], // Iniciar como array vacío para Form.List
                    imageUrl: '',
                    languages: [], // Iniciar como array vacío para Form.List
                    name: '',
                    phoneNumber: '',
                    rating: 0,
                    schedule: '',
                    services: [], // Iniciar como array vacío para Form.List
                    specialty: '',
                    videoUrl: '',
                    whatsappTapCount: 0,
                    yearsOfExperience: 0,
                });
            }
        }
    }, [open, profesionalData, isEditing, form]); // Dependencias para reinicializar el form

    // --- Manejador del envío ---
    const handleFinish = async (values) => {
        setIsSubmitting(true);
        setSubmitError(null);

        // Prepara los datos para Firestore
        const dataToSave = {
            ...values, // Incluye la mayoría de los valores directamente
            // Asegura tipos numéricos
            rating: Number(values.rating || 0),
            whatsappTapCount: Number(values.whatsappTapCount || 0),
            yearsOfExperience: Number(values.yearsOfExperience || 0),

             // Convertir los arrays de Form.List de nuevo a arrays de strings limpios
             galleryImages: (values.galleryImages ?? []).map(item => item?.url?.trim()).filter(Boolean), // Filtra URLs vacías
             languages: (values.languages ?? []).map(item => item?.text?.trim()).filter(Boolean), // Filtra textos vacíos
             services: (values.services ?? []).map(item => item?.text?.trim()).filter(Boolean), // Filtra textos vacíos

             // Limpiar campos de texto individuales
            categoryId: values.categoryId?.trim() || '',
            description: values.description?.trim() || '',
            imageUrl: values.imageUrl?.trim() || '',
            name: values.name?.trim() || '',
            phoneNumber: values.phoneNumber?.trim() || '',
            schedule: values.schedule?.trim() || '',
            specialty: values.specialty?.trim() || '',
            videoUrl: values.videoUrl?.trim() || '',

             // Opcional: Añadir/actualizar un timestamp
             // lastUpdated: serverTimestamp(),
        };

        try {
            const professionalsCollectionRef = collection(db, 'professionals');

            if (isEditing) {
                // Actualizar documento existente
                if (!profesionalData?.id) {
                     throw new Error("No se encontró el ID del profesional a editar.");
                }
                const profesionalDocRef = doc(db, 'professionals', profesionalData.id);
                 // Añadir timestamp si se usa: dataToSave.lastUpdated = serverTimestamp();
                await updateDoc(profesionalDocRef, dataToSave);
                message.success('Profesional actualizado correctamente');
            } else {
                // Añadir nuevo documento
                 // Añadir timestamps si se usan:
                // dataToSave.createdAt = serverTimestamp();
                // dataToSave.lastUpdated = serverTimestamp();
                await addDoc(professionalsCollectionRef, dataToSave);
                message.success('Profesional añadido correctamente');
            }
            onClose(); // Cierra el modal si todo fue bien
        } catch (error) {
            console.error("Error al guardar profesional:", error);
            const errorMsg = `Error al guardar: ${error.message || 'Error desconocido'}`;
            setSubmitError(errorMsg); // Mostrar error dentro del modal
            message.error(errorMsg); // Mostrar mensaje flotante
        } finally {
            setIsSubmitting(false); // Terminar estado de carga
        }
    };

    return (
        <Modal
            title={isEditing ? 'Editar Profesional' : 'Añadir Nuevo Profesional'}
            open={open}
            onCancel={onClose} // Permite cerrar con la 'X' o tecla Esc
            footer={[
                 <Button key="back" onClick={onClose} disabled={isSubmitting}>
                     Cancelar
                 </Button>,
                 <Button
                    key="submit"
                    type="primary"
                    loading={isSubmitting} // Muestra el spinner en el botón
                    onClick={() => form.submit()} // Dispara la validación y onFinish del Form
                 >
                     {isEditing ? 'Actualizar Profesional' : 'Crear Profesional'}
                 </Button>,
             ]}
            destroyOnClose={true} // Limpia el estado del formulario al cerrar
            width={600}
        >
            <Form
                form={form} // Conecta la instancia del form
                layout="vertical" // Estilo de layout
                onFinish={handleFinish} // Función a llamar tras validación exitosa
            >
                {/* Área para mostrar errores de envío */}
                {submitError && (
                    <Alert message={submitError} type="error" showIcon style={{ marginBottom: 15 }} />
                )}

                {/* Campos del Profesional */}
                 <Form.Item name="name" label="Nombre" rules={[{ required: true, message: 'El nombre es obligatorio' }]}>
                    <Input placeholder="Nombre completo del profesional"/>
                </Form.Item>

                 <Form.Item name="categoryId" label="Categoría (ID)" rules={[{ required: true, message: 'La categoría es obligatoria' }]}>
                    {/* TODO: Si tienes una colección de categorías de profesionales, cárgalas aquí en un Select */}
                     <Input placeholder="Ej: Abogados, Médicos"/>
                </Form.Item>

                 <Form.Item name="specialty" label="Especialidad">
                    <Input placeholder="Ej: Abogado litigador, Pediatra"/>
                </Form.Item>

                 <Form.Item name="description" label="Descripción">
                    <TextArea rows={3} placeholder="Descripción detallada de los servicios/experiencia"/>
                </Form.Item>

                 <Form.Item name="phoneNumber" label="Teléfono">
                    <Input placeholder="Número de teléfono de contacto"/>
                </Form.Item>

                 <Form.Item name="schedule" label="Horario">
                    <Input placeholder="Ej: Lunes a Viernes 9am-5pm, Por disponibilidad"/>
                </Form.Item>

                <Form.Item name="imageUrl" label="URL Imagen Principal">
                    <Input placeholder="https://..."/>
                </Form.Item>

                 <Form.Item name="videoUrl" label="URL Video (Opcional)">
                    <Input placeholder="https://..."/>
                </Form.Item>

                {/* Campos numéricos */}
                 <Form.Item name="rating" label="Rating (1-5)">
                    <InputNumber min={0} max={5} precision={1} style={{ width: '100%' }} placeholder="Ej: 4.5"/>
                </Form.Item>

                 <Form.Item name="yearsOfExperience" label="Años de Experiencia">
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="Ej: 10"/>
                </Form.Item>

                 <Form.Item name="whatsappTapCount" label="Contador Taps WhatsApp">
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="Ej: 0"/>
                </Form.Item>


                {/* Form.List para Idiomas */}
                 <Form.Item label="Idiomas">
                     <Form.List name="languages">
                         {(fields, { add, remove }) => (
                             <>
                                 {fields.map(({ key, name, ...restField }) => (
                                     <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                         <Form.Item
                                             {...restField}
                                             name={[name, 'text']} // Usar una clave como 'text' para el valor
                                             rules={[{ required: true, message: 'Idioma es obligatorio' }]}
                                             style={{ flexGrow: 1, margin: 0 }}
                                         >
                                             <Input placeholder="Ej: Español" />
                                         </Form.Item>
                                         <Button type="link" danger onClick={() => remove(name)} icon={<DeleteOutlined />} aria-label="Eliminar idioma"/>
                                     </Space>
                                 ))}
                                 <Form.Item>
                                     <Button type="dashed" onClick={() => add({ text: '' })} block icon={<PlusOutlined />}>
                                         Añadir Idioma
                                     </Button>
                                 </Form.Item>
                             </>
                         )}
                     </Form.List>
                 </Form.Item>

                 {/* Form.List para Servicios Adicionales */}
                 <Form.Item label="Servicios Adicionales">
                     <Form.List name="services">
                         {(fields, { add, remove }) => (
                             <>
                                 {fields.map(({ key, name, ...restField }) => (
                                     <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                         <Form.Item
                                             {...restField}
                                             name={[name, 'text']} // Usar una clave como 'text' para el valor
                                             rules={[{ required: true, message: 'Servicio es obligatorio' }]}
                                             style={{ flexGrow: 1, margin: 0 }}
                                         >
                                             <Input placeholder="Ej: Consulta online" />
                                         </Form.Item>
                                         <Button type="link" danger onClick={() => remove(name)} icon={<DeleteOutlined />} aria-label="Eliminar servicio"/>
                                     </Space>
                                 ))}
                                 <Form.Item>
                                     <Button type="dashed" onClick={() => add({ text: '' })} block icon={<PlusOutlined />}>
                                         Añadir Servicio
                                     </Button>
                                 </Form.Item>
                             </>
                         )}
                     </Form.List>
                 </Form.Item>


                {/* Form.List para Galería de Imágenes */}
                <Form.Item label="Galería de Imágenes (URLs)">
                     <Form.List name="galleryImages">
                         {(fields, { add, remove }) => (
                             <>
                                 {fields.map(({ key, name, ...restField }) => (
                                     <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                         <Form.Item
                                             {...restField}
                                             name={[name, 'url']} // Usar una clave como 'url' para la URL
                                             rules={[{ type: 'url', warningOnly: true, message: 'URL no válida' }]}
                                             style={{ flexGrow: 1, margin: 0 }}
                                         >
                                             <Input placeholder="https://ejemplo.com/imagen.jpg" />
                                         </Form.Item>
                                         <Button type="link" danger onClick={() => remove(name)} icon={<DeleteOutlined />} aria-label="Eliminar imagen de galería"/>
                                     </Space>
                                 ))}
                                 <Form.Item>
                                     <Button type="dashed" onClick={() => add({ url: '' })} block icon={<PlusOutlined />}>
                                         Añadir URL de Imagen
                                     </Button>
                                 </Form.Item>
                             </>
                         )}
                     </Form.List>
                 </Form.Item>


            </Form>
        </Modal>
    );
}

export default AddEditProfesionalModal;