// src/pages/usuarios/components/AddEditUserModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Button, message, Alert, Switch, Select } from 'antd';
import { db } from '../../../firebase'; // Asegúrate que esta ruta sea correcta
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';

const { TextArea } = Input;
const { Option } = Select; // Importar Option para el Select de Sexo

function AddEditUserModal({ open, onClose, userData }) {
    const [form] = Form.useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    const isEditing = !!userData; // Determina si estamos editando

    // Inicializar formulario cuando cambia userData o se abre el modal
    useEffect(() => {
        setSubmitError(null); // Limpiar errores
        if (open) {
            if (isEditing) {
                // Modo Editar: establece los valores existentes
                form.setFieldsValue({
                    ...userData,
                    // Asegura que los números se manejen correctamente si vienen de Firestore
                    age: userData.age ?? undefined, // Usar undefined para placeholder si es null/0
                    itwanaCoins: userData.itwanaCoins ?? 0,
                    // Asegura booleano para el switch isAdmin
                    isAdmin: userData.isAdmin ?? false,
                });
            } else {
                // Modo Añadir: resetea y establece valores por defecto
                form.resetFields();
                form.setFieldsValue({
                    name: '',
                    surname: '',
                    email: '',
                    age: undefined,
                    sex: undefined,
                    phoneNumber: '',
                    itwanaCoins: 0,
                    profileImage: '',
                    socialMediaPreference: undefined,
                    isAdmin: false, // Por defecto, no es admin al crear
                });
            }
        }
    }, [open, userData, isEditing, form]); // Dependencias para reinicializar el form

    // --- Manejador del envío ---
    const handleFinish = async (values) => {
        setIsSubmitting(true);
        setSubmitError(null);

        // Prepara los datos asegurando tipos correctos y limpiando strings
        const dataToSave = {
            name: values.name?.trim() || '',
            surname: values.surname?.trim() || '',
            email: values.email?.trim() || '',
            age: values.age ?? null, // Guarda null si no se ingresa edad
            sex: values.sex || '',
            phoneNumber: values.phoneNumber?.trim() || '',
            itwanaCoins: Number(values.itwanaCoins || 0),
            profileImage: values.profileImage?.trim() || '',
            socialMediaPreference: values.socialMediaPreference || '',
            isAdmin: values.isAdmin ?? false, // Asegura valor booleano
             // No incluimos el 'uid' aquí al guardar, ya que es el ID del documento en la colección 'users'
             // Si necesitaras guardar el uid en un campo dentro del documento, tendrías que manejarlo
             // especialmente al añadir un usuario (el UID se obtiene de Firebase Auth tras la creación de la cuenta)
        };

        // TODO: Lógica para crear cuenta de Authentication si se está añadiendo un nuevo usuario
        // NOTA: La creación de usuarios de Authentication con contraseña y email idealmente debería
        // hacerse del lado del servidor por seguridad, o al menos manejar errores y validaciones.
        // Si solo estás gestionando perfiles de usuarios ya existentes en Auth, puedes ignorar este TODO por ahora.

        try {
            const usersCollectionRef = collection(db, 'users');

            if (isEditing) {
                // Actualizar documento existente
                if (!userData?.id) {
                     throw new Error("No se encontró el ID del usuario a editar.");
                }
                const userDocRef = doc(db, 'users', userData.id); // Usar userData.id (que es el UID del Auth)
                await updateDoc(userDocRef, dataToSave);
                message.success('Usuario actualizado correctamente');
            } else {
                // Añadir nuevo documento
                 // Si estás creando la cuenta de Authentication al mismo tiempo,
                 // necesitarías obtener el UID de la cuenta creada y usarlo como ID del documento aquí.
                 // Por ahora, si no creas cuenta Auth desde aquí, addDoc generará un ID automático,
                 // lo cual puede NO ser lo que quieres si el ID del documento 'users' DEBE SER el UID de Auth.
                 // Si el ID del documento debe ser el UID de Auth, la creación debe ser:
                 // await setDoc(doc(db, 'users', authUID_del_nuevo_usuario), dataToSave);
                 // Donde authUID_del_nuevo_usuario es el UID obtenido de la creación en Authentication.
                await addDoc(usersCollectionRef, dataToSave); // Esto añadirá un documento con ID automático
                message.success('Usuario añadido correctamente');
            }
            onClose(); // Cierra el modal si todo fue bien
        } catch (error) {
            console.error("Error al guardar usuario:", error);
            const errorMsg = `Error al guardar: ${error.message || 'Error desconocido'}`;
            setSubmitError(errorMsg); // Mostrar error dentro del modal
            message.error(errorMsg); // Mostrar mensaje flotante
        } finally {
            setIsSubmitting(false); // Terminar estado de carga
        }
    };

    return (
        <Modal
            title={isEditing ? 'Editar Usuario' : 'Añadir Nuevo Usuario'}
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
                     {isEditing ? 'Actualizar Usuario' : 'Crear Usuario'}
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

                {/* Campos del Usuario */}
                {/* Nota: El UID no se edita desde aquí, es el ID del documento */}

                 <Form.Item name="name" label="Nombre" rules={[{ required: true, message: 'El nombre es obligatorio' }]}>
                    <Input placeholder="Nombre del usuario"/>
                </Form.Item>

                 <Form.Item name="surname" label="Apellido" rules={[{ required: true, message: 'El apellido es obligatorio' }]}>
                    <Input placeholder="Apellido del usuario"/>
                </Form.Item>

                 <Form.Item name="email" label="Email" rules={[{ required: true, message: 'El email es obligatorio' }, { type: 'email', message: 'Ingresa un email válido' }]}>
                    <Input placeholder="email@ejemplo.com"/>
                </Form.Item>

                <Form.Item name="age" label="Edad">
                    <InputNumber min={0} max={120} style={{ width: '100%' }} placeholder="Edad"/>
                </Form.Item>

                 <Form.Item name="sex" label="Sexo">
                    <Select placeholder="Selecciona el sexo">
                         <Option value="Masculino">Masculino</Option>
                         <Option value="Femenino">Femenino</Option>
                         <Option value="Otro">Otro</Option>
                    </Select>
                </Form.Item>

                <Form.Item name="phoneNumber" label="Teléfono">
                    <Input placeholder="Número de teléfono"/>
                </Form.Item>

                 <Form.Item name="itwanaCoins" label="Itwana Coins">
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="Cantidad de coins"/>
                </Form.Item>

                <Form.Item name="profileImage" label="URL Imagen de Perfil">
                    <Input placeholder="https://..."/>
                </Form.Item>

                 <Form.Item name="socialMediaPreference" label="Preferencia Red Social">
                    <Select placeholder="Selecciona preferencia">
                         <Option value="WhatsApp">WhatsApp</Option>
                         <Option value="Telegram">Telegram</Option>
                         <Option value="Otro">Otro</Option>
                    </Select>
                </Form.Item>

                {/* Campo para isAdmin (solo visible si el usuario actual tiene permisos para editar admins) */}
                {/* Implementar lógica para verificar permisos si es necesario */}
                 <Form.Item name="isAdmin" label="¿Es Administrador?" valuePropName="checked" tooltip="Activa si este usuario debe tener permisos de administrador.">
                     <Switch />
                 </Form.Item>


            </Form>
        </Modal>
    );
}

export default AddEditUserModal;