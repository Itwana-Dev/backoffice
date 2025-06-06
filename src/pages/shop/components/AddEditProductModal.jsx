// src/pages/shop/components/AddEditProductModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Button, message, Alert, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { db } from '../../../firebase'; // Asegúrate que esta ruta es correcta
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';

const { TextArea } = Input;

function AddEditProductModal({ open, onClose, productData }) {
    const [form] = Form.useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    const isEditing = !!productData; // Determina si estamos editando

    // Inicializar formulario cuando cambia productData o se abre el modal
    useEffect(() => {
        setSubmitError(null); // Limpiar errores
        if (open) {
            if (isEditing) {
                // Modo Editar: establece los valores existentes
                const initialData = {
                    ...productData,
                    // Asegura que los campos numéricos tengan un valor por defecto y tipo correcto
                    coins: productData.coins ?? 0,
                    price: productData.price ?? 0,
                    // Convertir array de URLs de strings a formato para Form.List con un campo 'url'
                    galleryImages: Array.isArray(productData.galleryImages)
                        ? productData.galleryImages.map(url => ({ url: url ?? '' }))
                        : [],
                };
                form.setFieldsValue(initialData);
            } else {
                // Modo Añadir: resetea y establece valores por defecto
                form.resetFields();
                form.setFieldsValue({
                    name: '',
                    description: '',
                    imageUrl: '',
                    coins: 0,
                    price: 0,
                    galleryImages: [], // Iniciar como array vacío para Form.List
                });
            }
        }
    }, [open, productData, isEditing, form]); // Dependencias para reinicializar el form

    // --- Manejador del envío ---
    const handleFinish = async (values) => {
        setIsSubmitting(true);
        setSubmitError(null);

        // Prepara los datos para Firestore
        const dataToSave = {
            ...values, // Incluye la mayoría de los valores directamente
            // Asegura tipos numéricos
            coins: Number(values.coins || 0),
            price: Number(values.price || 0),

             // Convertir el array de objetos de Form.List (galleryImages) de vuelta a un array de strings limpios
             galleryImages: (values.galleryImages ?? []).map(item => item?.url?.trim()).filter(Boolean), // Filtra URLs vacías

             // Limpiar campos de texto individuales
            name: values.name?.trim() || '',
            description: values.description?.trim() || '',
            imageUrl: values.imageUrl?.trim() || '',

             // Opcional: Añadir/actualizar un timestamp
             // lastUpdated: serverTimestamp(),
        };

        try {
            const productsCollectionRef = collection(db, 'products');

            if (isEditing) {
                // Actualizar documento existente
                if (!productData?.id) {
                     throw new Error("No se encontró el ID del producto a editar.");
                }
                const productDocRef = doc(db, 'products', productData.id);
                 // Añadir timestamp si se usa: dataToSave.lastUpdated = serverTimestamp();
                await updateDoc(productDocRef, dataToSave);
                message.success('Producto actualizado correctamente');
            } else {
                // Añadir nuevo documento
                 // Añadir timestamps si se usan:
                // dataToSave.createdAt = serverTimestamp();
                // dataToSave.lastUpdated = serverTimestamp();
                await addDoc(productsCollectionRef, dataToSave);
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
            title={isEditing ? 'Editar Producto' : 'Añadir Nuevo Producto'}
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
                     {isEditing ? 'Actualizar Producto' : 'Crear Producto'}
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

                {/* Campos del Producto */}
                 <Form.Item name="name" label="Nombre" rules={[{ required: true, message: 'El nombre es obligatorio' }]}>
                    <Input placeholder="Nombre del producto"/>
                </Form.Item>

                 <Form.Item name="description" label="Descripción">
                    <TextArea rows={3} placeholder="Descripción detallada del producto"/>
                </Form.Item>

                 <Form.Item name="imageUrl" label="URL Imagen Principal">
                    <Input placeholder="https://..."/>
                </Form.Item>

                {/* Campos numéricos */}
                 <Form.Item name="price" label="Precio" rules={[{ required: true, message: 'El precio es obligatorio' }]}>
                    <InputNumber
                         min={0}
                         style={{ width: '100%' }}
                         // Formato de moneda (Colombia)
                         formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                         parser={(value) => value?.replace(/\$\s?|(,*)/g, '') ?? ''}
                         placeholder="Precio del producto"
                     />
                </Form.Item>

                 <Form.Item name="coins" label="Coins">
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="Cantidad de coins"/>
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
                                             name={[name, 'url']} // Usar una clave 'url' para la URL
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

export default AddEditProductModal;