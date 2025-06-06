// src/pages/components/AddEditCategoryModal.jsx (COMPLETO Y CORREGIDO)
import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message, Alert, Space } from 'antd';
import { db } from '../../../firebase'; // Ajusta la ruta
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

function AddEditCategoryModal({ open, onClose, categoryData }) {
    const [form] = Form.useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const isEditing = !!categoryData;

    // Inicializar/Resetear formulario
    useEffect(() => {
        setSubmitError(null);
        if (open) {
            if (isEditing) {
                form.setFieldsValue({
                    name: categoryData.id,
                    iconPath: categoryData.iconPath || '',
                    bannerPaths: categoryData.bannerPaths?.map(url => ({ url })) || [], // Formato para Form.List
                });
            } else {
                form.resetFields();
                form.setFieldsValue({ bannerPaths: [{url: ''}] }); // Iniciar con un campo de banner vacío
            }
        }
    }, [open, categoryData, isEditing, form]);

    // Manejar envío
    const handleFinish = async (values) => {
        setIsSubmitting(true);
        setSubmitError(null);
        const categoryName = values.name?.trim();

        if (!categoryName || /[.#$[\]/]/.test(categoryName)) {
            setSubmitError("Nombre inválido o vacío. No uses '.', '#', '$', '[', ']', ni '/'.");
            setIsSubmitting(false); return;
        }

        const dataToSave = {
            name: categoryName, // Guardar nombre también como campo
            iconPath: values.iconPath?.trim() || '',
            bannerPaths: (values.bannerPaths || []).map(item => item?.url?.trim()).filter(Boolean),
        };

        try {
            const categoryDocRef = doc(db, 'site_categories', categoryName);
            if (!isEditing) {
                const docSnap = await getDoc(categoryDocRef);
                if (docSnap.exists()) throw new Error(`La categoría "${categoryName}" ya existe.`);
                await setDoc(categoryDocRef, dataToSave);
                message.success(`Categoría "${categoryName}" creada.`);
            } else {
                if (categoryName !== categoryData.id) throw new Error("No se puede cambiar el nombre (ID) al editar.");
                await setDoc(categoryDocRef, dataToSave, { merge: true }); // Usar merge para actualizar
                message.success(`Categoría "${categoryName}" actualizada.`);
            }
            onClose();
        } catch (error) {
            console.error("Error al guardar categoría:", error);
            setSubmitError(`Error al guardar: ${error.message || 'Error desconocido'}`);
            message.error(`Error al guardar: ${error.message || 'Error desconocido'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal title={isEditing ? `Editar Categoría: ${categoryData?.id}` : 'Añadir Nueva Categoría'} open={open} onCancel={onClose} destroyOnClose
            footer={[
                 <Button key="back" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>,
                 <Button key="submit" type="primary" loading={isSubmitting} onClick={() => form.submit()}>
                     {isEditing ? 'Actualizar' : 'Crear'} Categoría</Button>, ]}>
            <Form form={form} layout="vertical" onFinish={handleFinish}>
                {submitError && (<Alert message={submitError} type="error" showIcon style={{ marginBottom: 15 }} />)}
                <Form.Item name="name" label="Nombre Categoría (ID)" rules={[{ required: true, message: 'Obligatorio' }]} tooltip="No uses '.', '#', '$', '[', ']', '/'. No se podrá cambiar después.">
                    <Input placeholder="Ej: Bares" disabled={isEditing} />
                </Form.Item>
                <Form.Item name="iconPath" label="URL del Icono">
                    <Input placeholder="https://ejemplo.com/icono.png" />
                </Form.Item>
                <Form.Item label="URLs de Banners">
                    <Form.List name="bannerPaths">
                        {(fields, { add, remove }) => ( <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                        <Form.Item {...restField} name={[name, 'url']} style={{ flexGrow: 1, margin: 0 }} rules={[{ type: 'url', warningOnly: true, message: 'URL no válida' }]}>
                                            <Input placeholder="https://ejemplo.com/banner.jpg" />
                                        </Form.Item>
                                        <Button type="link" danger onClick={() => remove(name)} icon={<DeleteOutlined />} aria-label="Eliminar banner"/>
                                    </Space> ))}
                                <Form.Item>
                                    <Button type="dashed" onClick={() => add({ url: '' })} block icon={<PlusOutlined />}>Añadir URL de Banner</Button>
                                </Form.Item> </>)}
                    </Form.List>
                </Form.Item>
            </Form>
        </Modal>
    );
}
export default AddEditCategoryModal;