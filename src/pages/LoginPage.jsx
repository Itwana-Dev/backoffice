// src/pages/LoginPage.jsx (Ajustado para logo y texto)
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
// Para iconos reales, descomenta la siguiente línea después de instalar react-icons
// import { FaUser, FaLock } from 'react-icons/fa';
import './LoginPage.css'; // Usaremos el CSS rediseñado (Dark Mode)

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            console.log('Inicio de sesión exitoso!');
        } catch (err) {
            console.error("Error al iniciar sesión:", err.code);
             if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('Usuario o contraseña incorrectos.');
            } else if (err.code === 'auth/invalid-email') {
                setError('El formato del email no es válido.');
            } else {
                setError('Ocurrió un error al intentar iniciar sesión.');
            }
        }
    };

    return (
        <div className="login-page-dark">
            <div className="login-container-dark">
                <div className="background-graphic"></div>

                {/* Área del Formulario (Izquierda) */}
                <div className="form-area">
                    {/* Puedes añadir un logo pequeño aquí también si quieres */}
                    <form onSubmit={handleLogin}>
                        <div className="input-group-dark">
                            {/* <FaUser className="input-icon" /> */}
                            <input
                                type="email"
                                id="username"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                // Texto actualizado
                                placeholder="Ingresa tu correo"
                            />
                        </div>
                        <div className="input-group-dark">
                            {/* <FaLock className="input-icon" /> */}
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                // Texto actualizado
                                placeholder="Contraseña"
                            />
                        </div>
                         <div className="form-options-dark">
                           {/* Links opcionales */}
                        </div>
                        {error && <p className="error-message-dark">{error}</p>}
                        <button type="submit" className="login-button-dark">
                            {/* Texto actualizado */}
                            Iniciar Sesión
                        </button>
                    </form>
                </div>

                {/* Área de Bienvenida (Derecha) */}
                <div className="welcome-area">
                    {/* Espacio para el logo */}
                    <img
                        src="/logo.png" // Asume que logo.png está en la carpeta 'public'
                        alt="Itwana Plus Logo"
                        className="login-logo" // Clase para darle estilo
                    />
                    {/* Texto actualizado */}
                    <h2>Bienvenido</h2>
                    <p>Este es el panel administrativo de Itwana Plus</p>
                </div>

            </div>
        </div>
    );
}

export default LoginPage;