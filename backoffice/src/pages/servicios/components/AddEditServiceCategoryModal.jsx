// src/pages/servicios/components/AddEditServiceCategoryModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message, Alert, Space } from 'antd';
import { db } from '../../../firebase'; // Ajusta la ruta
import { doc, setDoc, getDoc } from 'firebase/firestore'; // Asegúrate de importar getDoc
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

function AddEditServiceCategoryModal({ open, onClose, categoryData }) {
    const [form] = Form.useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const isEditing = !!categoryData;

    // Inicializar/Resetear formulario
    useEffect(() => {
        setSubmitError(null);
        if (open) {
            if (isEditing) {
                // Modo Edición: establecer valores existentes
                form.setFieldsValue({
                    name: categoryData.id, // El ID del documento es el nombre/valor de la categoría
                    iconPath: categoryData.iconPath || '',
                    // Convertir array de strings a formato para Form.List con un campo 'url'
                    bannerPaths: Array.isArray(categoryData.bannerPaths)
                        ? categoryData.bannerPaths.map(url => ({ url: url ?? '' }))
                        : [],
                });
            } else {
                // Modo Añadir: resetea y establece valores por defecto
                form.resetFields();
                form.setFieldsValue({
                    name: '',
                    iconPath: '',
                    bannerPaths: [], // Iniciar como array vacío
                });
            }
        }
    }, [open, categoryData, isEditing, form]);

    // Manejar envío
    const handleFinish = async (values) => {
        setIsSubmitting(true);
        setSubmitError(null);
        const categoryNameId = values.name?.trim(); // Usaremos el nombre como ID del documento

        if (!categoryNameId || /[.#$[\]/]/.test(categoryNameId)) {
            setSubmitError("Nombre/ID inválido o vacío. No uses '.', '#', '$', '[', ']', ni '/'.");
            setIsSubmitting(false); return;
        }

        // Prepara los datos para guardar
        const dataToSave = {
            name: categoryNameId, // Guardar el nombre también como campo dentro del documento
            iconPath: values.iconPath?.trim() || '',
            // Convertir el array de objetos de Form.List de vuelta a un array de strings
            bannerPaths: (values.bannerPaths || []).map(item => item?.url?.trim()).filter(Boolean),
        };

        try {
            const categoryDocRef = doc(db, 'serviceCategories', categoryNameId);

            if (!isEditing) {
                // Modo Añadir: Verificar si ya existe una categoría con ese ID
                const docSnap = await getDoc(categoryDocRef);
                if (docSnap.exists()) {
                    throw new Error(`La categoría "${categoryNameId}" ya existe.`);
                }
                 // Usar setDoc con el ID especificado
                await setDoc(categoryDocRef, dataToSave);
                message.success(`Categoría "${categoryNameId}" creada.`);
            } else {
                // Modo Editar: Actualizar documento existente. El ID no se cambia.
                 if (categoryNameId !== categoryData.id) {
                      throw new Error("No se puede cambiar el nombre (ID) de la categoría al editar.");
                 }
                 // Usar setDoc con merge: true para actualizar solo los campos proporcionados
                await setDoc(categoryDocRef, dataToSave, { merge: true });
                message.success(`Categoría "${categoryNameId}" actualizada.`);
            }
            onClose(); // Cerrar modal al éxito
        } catch (error) {
            console.error("Error al guardar categoría:", error);
            setSubmitError(`Error al guardar: ${error.message || 'Error desconocido'}`);
            message.error(`Error al guardar: ${error.message || 'Error desconocido'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            title={isEditing ? `Editar Categoría: ${categoryData?.id}` : 'Añadir Nueva Categoría de Servicio'}
            open={open}
            onCancel={onClose}
            destroyOnClose={true} // Asegura que el formulario se resetee
            footer={[
                 <Button key="back" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>,
                 <Button key="submit" type="primary" loading={isSubmitting} onClick={() => form.submit()}>
                     {isEditing ? 'Actualizar' : 'Crear'} Categoría</Button>,
             ]}
            width={600}
        >
            <Form form={form} layout="vertical" onFinish={handleFinish}>
                {submitError && (<Alert message={submitError} type="error" showIcon style={{ marginBottom: 15 }} />)}

                <Form.Item
                    name="name"
                    label="Nombre Categoría (ID)"
                    rules={[{ required: true, message: 'El nombre es obligatorio' }]}
                    tooltip="Este será el identificador único de la categoría. No uses caracteres especiales como .#$[]/."
                >
                    {/* Deshabilitar el campo de nombre si estamos editando para no cambiar el ID */}
                    <Input placeholder="Ej: Abogados" disabled={isEditing} />
                </Form.Item>

                <Form.Item name="iconPath" label="URL del Icono (Opcional)">
                    <Input placeholder="https://ejemplo.com/icono.png" />
                </Form.Item>

                <Form.Item label="URLs de Banners (Opcional)">
                    <Form.List name="bannerPaths">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'url']} // Usar una clave 'url' para el valor
                                            rules={[{ type: 'url', warningOnly: true, message: 'URL no válida' }]}
                                            style={{ flexGrow: 1, margin: 0 }}
                                        >
                                            <Input placeholder="https://ejemplo.com/banner.jpg" />
                                        </Form.Item>
                                        <Button type="link" danger onClick={() => remove(name)} icon={<DeleteOutlined />} aria-label="Eliminar banner"/>
                                    </Space>
                                ))}
                                <Form.Item>
                                    <Button type="dashed" onClick={() => add({ url: '' })} block icon={<PlusOutlined />}>
                                        Añadir URL de Banner
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

export default AddEditServiceCategoryModal;