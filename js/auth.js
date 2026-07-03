/* js/auth.js - Gestion de session et de sécurité pour Nadjla */

import { db } from './database.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Initialiser la base de données
    try {
        await db.init();
    } catch (err) {
        console.error("Impossible de charger la base de données dans auth.js", err);
    }

    const currentFilename = window.location.pathname.split('/').pop() || 'index.html';
    const isLoginPage = currentFilename === 'index.html' || currentFilename === '';

    // Mettre à jour dynamiquement le titre de l'entreprise sur la page de login
    if (isLoginPage) {
        const enterpriseName = await db.getSetting('enterprise_name');
        if (enterpriseName) {
            const entTitle = document.getElementById('enterprise-title');
            if (entTitle) entTitle.textContent = enterpriseName;
        }
    }

    // 1. Gérer les verrous de redirection de session
    const session = sessionStorage.getItem('admin_session');

    if (session === 'active') {
        // Déjà connectée : redirection vers le dashboard si sur login
        if (isLoginPage) {
            window.location.href = '/dashboard.html';
            return;
        }
    } else {
        // Non connectée : redirection vers login si sur une page admin
        if (!isLoginPage) {
            window.location.href = '/index.html';
            return;
        }
    }

    // 2. Traitement du formulaire de connexion
    if (isLoginPage) {
        const form = document.getElementById('login-form');
        const passwordInput = document.getElementById('admin-password-input');
        const passwordToggle = document.getElementById('password-toggle-btn');
        const errorMsg = document.getElementById('login-error-msg');

        // Toggling visibilité du mot de passe
        if (passwordToggle && passwordInput) {
            passwordToggle.addEventListener('click', () => {
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    passwordToggle.classList.remove('fa-eye');
                    passwordToggle.classList.add('fa-eye-slash');
                } else {
                    passwordInput.type = 'password';
                    passwordToggle.classList.remove('fa-eye-slash');
                    passwordToggle.classList.add('fa-eye');
                }
            });
        }

        // Soumission du formulaire de connexion
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                errorMsg.style.display = 'none';

                const enteredPassword = passwordInput.value;
                const dbPassword = await db.getSetting('admin_password') || 'Nadjla2026';

                if (enteredPassword === dbPassword) {
                    // Connexion réussie !
                    sessionStorage.setItem('admin_session', 'active');
                    window.location.href = '/dashboard.html';
                } else {
                    // Erreur de mot de passe
                    errorMsg.style.display = 'block';
                    passwordInput.value = '';
                    passwordInput.focus();
                }
            });
        }
    }
});
