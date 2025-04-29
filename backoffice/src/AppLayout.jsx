// src/AppLayout.jsx (Nuevo componente para manejar layout y autenticación)
import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from './firebase';
import Sidebar from './components/Sidebar';
import AppRoutes from './AppRoutes'; // Importa el componente de rutas
import './App.css'; // Mantenemos los estilos del layout aquí

function AppLayout() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Observador de estado de autenticación
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
            console.log("Auth State Changed:", currentUser ? currentUser.uid : 'No User'); // Log para depuración
        });
        // Limpia la suscripción al desmontar el componente
        return () => {
            console.log("Cleaning up Auth Listener"); // Log para depuración
            unsubscribe();
        }
    }, []); // El array vacío asegura que se ejecute solo una vez al montar

    const handleLogout = async () => {
        try {
            await signOut(auth);
            console.log('Sesión cerrada exitosamente');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    // Muestra un mensaje de carga mientras se verifica el estado de auth
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: 'var(--bg-color-page)', // Usa variable de fondo
                color: 'var(--text-color-secondary)'
            }}>
                Cargando...
            </div>
        );
    }

    // Una vez cargado, decide qué mostrar basado en si hay usuario
    return (
        <> {/* Usamos Fragment <>...</> ya que BrowserRouter está fuera */}
            {user ? (
                // --- Layout del Backoffice Autenticado ---
                <div className="app-layout">
                    <Sidebar handleLogout={handleLogout} />
                    <main className="main-content">
                        {/* AppRoutes decide qué PÁGINA mostrar basado en la URL */}
                        <AppRoutes user={user} />
                    </main>
                </div>
            ) : (
                // --- Si no hay usuario, AppRoutes mostrará LoginPage ---
                // AppRoutes decide qué PÁGINA mostrar (será LoginPage en este caso)
                <AppRoutes user={user} />
            )}
        </>
    );
}

export default AppLayout;