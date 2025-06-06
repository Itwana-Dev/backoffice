// src/pages/components/AddEditMenuItemModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Button, message, Alert } from 'antd';
import { db } from '../../../firebase'; // <-- Asegúrate que esta ruta sea correcta
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';

const { TextArea } = Input;

function AddEditMenuItemModal({ open, onClose, sitioId, menuItemData }) {
    const [form] = Form.useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    const isEditing = !!menuItemData; // Determina si estamos editando

    // Inicializar formulario cuando cambia menuItemData o se abre el modal
    useEffect(() => {
        setSubmitError(null); // Limpiar errores
        if (open) {
            if (isEditing) {
                // Modo Editar: establece los valores existentes
                form.setFieldsValue({
                    ...menuItemData,
                    // Asegúrate de que los números se manejen correctamente si vienen de Firestore
                    price: menuItemData.price ?? 0,
                    likes: menuItemData.likes ?? 0,
                    orderCount: menuItemData.orderCount ?? 0, // Asegura valor inicial si no existe
                });
            } else {
                // Modo Añadir: resetea y establece valores por defecto
                form.resetFields();
                form.setFieldsValue({
                    name: '',
                    description: '',
                    image: '',
                    price: 0,
                    likes: 0,
                    orderCount: 0, // O un valor por defecto como 99 si quieres que aparezcan al final
                });
            }
        }
    }, [open, menuItemData, isEditing, form]); // Dependencias para reinicializar el form

    // --- Manejador del envío ---
    const handleFinish = async (values) => {
        setIsSubmitting(true);
        setSubmitError(null);

        if (!sitioId) {
            setSubmitError("Error: No se proporcionó ID del sitio padre.");
            setIsSubmitting(false);
            message.error("Error interno: Falta ID del sitio."); // Mensaje al usuario
            return;
        }

        // Prepara los datos asegurando tipos correctos
        const dataToSave = {
            name: values.name?.trim() || '', // Quitar espacios y asegurar string
            description: values.description?.trim() || '',
            image: values.image?.trim() || '', // Guardar string vacío si no hay URL o está vacía
            price: Number(values.price || 0), // Asegurar tipo número
            likes: Number(values.likes || 0), // Asegurar tipo número
            orderCount: Number(values.orderCount || 0), // Asegurar tipo número
            // Opcional: Añadir/actualizar un timestamp
            // lastUpdated: serverTimestamp(),
        };

        try {
            // Referencia a la subcolección específica de este sitio
            const menuItemsSubcollectionRef = collection(db, 'sites', sitioId, 'menuItems');

            if (isEditing) {
                // Actualizar documento existente
                // Necesitamos el ID del menuItem que estamos editando
                if (!menuItemData?.id) {
                     throw new Error("No se encontró el ID del producto a editar.");
                }
                const itemDocRef = doc(menuItemsSubcollectionRef, menuItemData.id);
                // Añadir timestamp si se usa: dataToSave.lastUpdated = serverTimestamp();
                await updateDoc(itemDocRef, dataToSave);
                message.success('Producto actualizado correctamente');
            } else {
                // Añadir nuevo documento
                // Añadir timestamps si se usan:
                // dataToSave.createdAt = serverTimestamp();
                // dataToSave.lastUpdated = serverTimestamp();
                await addDoc(menuItemsSubcollectionRef, dataToSave);
                message.success('Producto añadido correctamente');
            }
            onClose(); // Cierra el modal si todo fue bien
        } catch (error) {
            console.error("Error al guardar producto:", error);
            const errorMsg = `Error al guardar: ${error.message || 'Error desconocido'}`;
            setSubmitError(errorMsg); // Mostrar error dentro del modal
            message.error(errorMsg); // Mostrar mensaje flotante
        } finally {
            setIsSubmitting(false); // Terminar estado de carga
        }
    };

    return (
        <Modal
            title={isEditing ? 'Editar Producto del Menú' : 'Añadir Nuevo Producto al Menú'}
            open={open}
            onCancel={onClose} // Permite cerrar con la 'X' o tecla Esc
            // Usamos un footer personalizado para tener control total y usar form.submit()
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
                     {isEditing ? 'Actualizar Producto' : 'Crear Producto'}
                 </Button>,
             ]}
            // destroyOnClose es útil para asegurar que el estado del formulario se limpie
            // completamente al cerrar, aunque nuestro useEffect ya lo maneja bien.
            destroyOnClose={true}
            // maskClosable={false} // Opcional: Evita cerrar el modal haciendo clic fuera
        >
            <Form
                form={form} // Conecta la instancia del form
                layout="vertical" // Estilo de layout
                onFinish={handleFinish} // Función a llamar tras validación exitosa
                // No usar initialValues aquí si se maneja con form.setFieldsValue en useEffect
            >
                {/* Área para mostrar errores de envío */}
                {submitError && (
                    <Alert message={submitError} type="error" showIcon style={{ marginBottom: 15 }} />
                )}

                {/* Campo Nombre */}
                <Form.Item
                    name="name"
                    label="Nombre del Producto"
                    rules={[{ required: true, message: 'El nombre es obligatorio' }]}
                >
                    <Input placeholder="Ej: Café Latte Grande"/>
                </Form.Item>

                {/* Campo Descripción */}
                <Form.Item
                    name="description"
                    label="Descripción Corta"
                    // Puedes añadir reglas si es necesario (ej: maxLength)
                >
                    <TextArea rows={2} placeholder="Ej: Delicioso café con leche espumada"/>
                </Form.Item>

                {/* Campo Precio */}
                <Form.Item
                    name="price"
                    label="Precio"
                    rules={[
                        { required: true, message: 'El precio es obligatorio' },
                        // Opcional: Validar que sea un número positivo
                        // { type: 'number', min: 0, message: 'El precio no puede ser negativo' }
                    ]}
                >
                    {/* InputNumber es ideal para valores numéricos */}
                    <InputNumber
                        min={0} // Precio mínimo
                        style={{ width: '100%' }}
                        // Formateador para mostrar como moneda local (ej: Colombia)
                        formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        // Parser para quitar el formato al editar
                        parser={(value) => value?.replace(/\$\s?|(,*)/g, '') ?? ''}
                        // step={100} // Opcional: Define el incremento/decremento con las flechas
                    />
                </Form.Item>

                {/* Campo URL Imagen */}
                <Form.Item
                    name="image"
                    label="URL de la Imagen"
                    // Opcional: Añadir regla para validar que sea una URL
                    // rules={[{ type: 'url', warningOnly: true, message: 'Por favor ingresa una URL válida' }]}
                >
                    <Input placeholder="https://ejemplo.com/imagen.jpg" />
                </Form.Item>

                {/* Campo Likes */}
                <Form.Item
                    name="likes"
                    label="Likes Iniciales"
                    rules={[
                       // { type: 'number', min: 0, message: 'Los likes no pueden ser negativos' }
                    ]}
                >
                    <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>

                {/* Campo Opcional: Orden */}
                 {/* Descomenta si necesitas un campo para ordenar los productos */}
                 {/* <Form.Item
                    name="orderCount"
                    label="Orden de Visualización"
                    tooltip="Número menor aparece primero"
                    rules={[
                       // { type: 'number', min: 0, message: 'El orden no puede ser negativo' }
                    ]}
                 >
                    <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item> */}

            </Form>
        </Modal>
    );
}

export default AddEditMenuItemModal;