// src/pages/eventos/components/AddEditEventoModal.jsx (Versión CORREGIDA para DatePicker con Day.js)
import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message, Alert, DatePicker } from 'antd';
import { db } from '../../../firebase'; // Asegúrate que esta ruta es correcta
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import dayjs from 'dayjs'; // Importar dayjs

const { TextArea } = Input;

function AddEditEventoModal({ open, onClose, eventoData }) {
    const [form] = Form.useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    const isEditing = !!eventoData; // Determina si estamos editando

    // Inicializar formulario cuando cambia eventoData o se abre el modal
    useEffect(() => {
        console.log("Modal abierto:", open, "Modo edición:", isEditing, "Datos recibidos (eventoData):", eventoData);
        setSubmitError(null); // Limpiar errores
        if (open) {
            if (isEditing) {
                // Modo Editar: establece los valores existentes
                const initialData = {
                    ...eventoData,
                    // Convertir Timestamps de Firestore a objetos Day.js para DatePicker
                    // Usamos nullish coalescing (??) para manejar casos donde la fecha podría ser undefined/null
                    startDate: eventoData.startDate?.toDate ? dayjs(eventoData.startDate.toDate()) : null, // Convertir a Day.js
                    endDate: eventoData.endDate?.toDate ? dayjs(eventoData.endDate.toDate()) : null, // Convertir a Day.js
                };
                console.log("Datos iniciales preparados para setFieldsValue:", initialData);
                form.setFieldsValue(initialData);
            } else {
                // Modo Añadir: resetea y establece valores por defecto
                console.log("Modo añadir, reseteando formulario.");
                form.resetFields();
                form.setFieldsValue({
                    title: '',
                    description: '',
                    imageUrl: '',
                    location: '',
                    organizer: '',
                    phone: '',
                    responsible: '',
                    startDate: null,
                    endDate: null,
                });
            }
        }
    }, [open, eventoData, isEditing, form]); // Dependencias para reinicializar el form

    // --- Manejador del envío ---
    const handleFinish = async (values) => {
        setIsSubmitting(true);
        setSubmitError(null);

        // Prepara los datos para Firestore
        const dataToSave = {
            title: values.title?.trim() || '',
            description: values.description?.trim() || '',
            imageUrl: values.imageUrl?.trim() || '',
            location: values.location?.trim() || '',
            organizer: values.organizer?.trim() || '',
            phone: values.phone?.trim() || '',
            responsible: values.responsible?.trim() || '',
            // DatePicker con Day.js devuelve objetos Day.js. Firestore necesita Date objects o Timestamps.
            // Day.js objects tienen un método .toDate() para obtener el objeto Date nativo.
            startDate: values.startDate ? values.startDate.toDate() : null, // Convertir de Day.js a Date
            endDate: values.endDate ? values.endDate.toDate() : null, // Convertir de Day.js a Date
             // Opcional: Añadir/actualizar un timestamp de modificación
             // lastUpdated: serverTimestamp(),
        };

        console.log("Datos a guardar en Firestore:", dataToSave);

        try {
            const eventsCollectionRef = collection(db, 'events');

            if (isEditing) {
                // Actualizar documento existente
                if (!eventoData?.id) {
                     throw new Error("No se encontró el ID del evento a editar.");
                }
                const eventoDocRef = doc(db, 'events', eventoData.id);
                 // Añadir timestamp si se usa: dataToSave.lastUpdated = serverTimestamp();
                await updateDoc(eventoDocRef, dataToSave);
                message.success('Evento actualizado correctamente');
            } else {
                // Añadir nuevo documento
                 // Añadir timestamps si se usan:
                // dataToSave.createdAt = serverTimestamp();
                // dataToSave.lastUpdated = serverTimestamp();
                await addDoc(eventsCollectionRef, dataToSave);
                message.success('Evento añadido correctamente');
            }
            onClose(); // Cierra el modal si todo fue bien
        } catch (error) {
            console.error("Error al guardar evento:", error);
            const errorMsg = `Error al guardar: ${error.message || 'Error desconocido'}`;
            setSubmitError(errorMsg); // Mostrar error dentro del modal
            message.error(errorMsg); // Mostrar mensaje flotante
        } finally {
            setIsSubmitting(false); // Terminar estado de carga
        }
    };

    return (
        <Modal
            title={isEditing ? 'Editar Evento' : 'Añadir Nuevo Evento'}
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
                     {isEditing ? 'Actualizar Evento' : 'Crear Evento'}
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

                {/* Campos del Evento */}
                 <Form.Item name="title" label="Título" rules={[{ required: true, message: 'El título es obligatorio' }]}>
                    <Input placeholder="Título del evento"/>
                </Form.Item>

                 <Form.Item name="description" label="Descripción">
                    <TextArea rows={3} placeholder="Descripción del evento"/>
                </Form.Item>

                 <Form.Item name="imageUrl" label="URL Imagen Principal">
                    <Input placeholder="https://..."/>
                </Form.Item>

                 <Form.Item name="location" label="Ubicación">
                    <Input placeholder="Lugar del evento"/>
                </Form.Item>

                 <Form.Item name="organizer" label="Organizador">
                    <Input placeholder="Nombre del organizador"/>
                </Form.Item>

                 <Form.Item name="phone" label="Teléfono de Contacto">
                    <Input placeholder="Teléfono"/>
                </Form.Item>

                 <Form.Item name="responsible" label="Responsable">
                    <Input placeholder="Nombre del responsable"/>
                </Form.Item>

                {/* Selectores de Fecha y Hora */}
                <Form.Item
                     name="startDate"
                     label="Fecha y Hora de Inicio"
                     rules={[{ required: true, message: 'Selecciona la fecha de inicio' }]}
                 >
                     {/* Configurar DatePicker para usar Day.js */}
                     <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} placeholder="Selecciona fecha y hora de inicio"/>
                 </Form.Item>

                <Form.Item
                     name="endDate"
                     label="Fecha y Hora de Fin"
                      rules={[{ required: true, message: 'Selecciona la fecha de fin' }]}
                 >
                     {/* Configurar DatePicker para usar Day.js */}
                    <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} placeholder="Selecciona fecha y hora de fin"/>
                 </Form.Item>


            </Form>
        </Modal>
    );
}

export default AddEditEventoModal;