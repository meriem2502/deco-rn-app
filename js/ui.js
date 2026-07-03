/* js/ui.js - Composants réutilisables d'interface (Barre de navigation, En-tête, Mobile) */

import { db } from './database.js';

// Injecter dynamiquement l'environnement Frosted Glass (Sidebar, Header, Ambient glows)
export async function initUILayout() {
    // Initialiser la base de données si ce n'est pas fait
    if (!db.db) {
        await db.init();
    }

    const currentFilename = window.location.pathname.split('/').pop() || 'index.html';

    // Ne pas injecter la navigation sur la page de connexion
    if (currentFilename === 'index.html' || currentFilename === '') {
        return;
    }

    // 1. Injecter les éléments d'ambiance décoratifs
    let ambient = document.getElementById('ambient-glow-layer');
    if (!ambient) {
        ambient = document.createElement('div');
        ambient.id = 'ambient-glow-layer';
        ambient.className = 'ambient-glow';
        document.body.appendChild(ambient);
    }

    // 2. Structurer le conteneur principal
    const appElement = document.getElementById('app');
    if (!appElement) return;

    // Récupérer le contenu actuel pour le remettre dans la zone centrale de contenu
    const pageContentHtml = appElement.innerHTML;
    appElement.innerHTML = '';
    appElement.className = 'app-container';

    // Récupérer le nom de l'entreprise
    const enterpriseName = await db.getSetting('enterprise_name') || 'DECO RN';

    // 3. Créer la Sidebar réutilisable
    const sidebar = document.createElement('aside');
    sidebar.id = 'app-sidebar';
    sidebar.className = 'sidebar';

    // Progression du stock (calcul dynamique de démo ou réel)
    const prods = await db.getAllProduits();
    const totalCount = prods.length || 10;
    const availableCount = prods.filter(p => p.disponibilite === 'Disponible').length || 8;
    const stockPct = Math.round((availableCount / totalCount) * 100);

    sidebar.innerHTML = `
        <div class="sidebar-logo">
            <div class="logo-icon">RN</div>
            <div class="logo-text">
                ${enterpriseName}
                <span>Admin Panel</span>
            </div>
        </div>
        <nav class="sidebar-nav">
            <a href="/dashboard.html" class="nav-item ${currentFilename === 'dashboard.html' ? 'active' : ''}">
                <i class="fa-solid fa-chart-pie"></i>
                <span>Tableau de bord</span>
            </a>
            <a href="/commandes.html" class="nav-item ${currentFilename === 'commandes.html' || currentFilename === 'nouvelle.html' || currentFilename === 'modifier.html' ? 'active' : ''}">
                <i class="fa-solid fa-receipt"></i>
                <span>Commandes</span>
            </a>
            <a href="/produits.html" class="nav-item ${currentFilename === 'produits.html' ? 'active' : ''}">
                <i class="fa-solid fa-boxes-stacked"></i>
                <span>Inventaire</span>
            </a>
            <a href="/clientes.html" class="nav-item ${currentFilename === 'clientes.html' ? 'active' : ''}">
                <i class="fa-solid fa-users"></i>
                <span>Clientes</span>
            </a>
            <a href="/calendrier.html" class="nav-item ${currentFilename === 'calendrier.html' ? 'active' : ''}">
                <i class="fa-solid fa-calendar-days"></i>
                <span>Calendrier</span>
            </a>
            <a href="/statistiques.html" class="nav-item ${currentFilename === 'statistiques.html' ? 'active' : ''}">
                <i class="fa-solid fa-chart-line"></i>
                <span>Statistiques</span>
            </a>
            <a href="/parametres.html" class="nav-item ${currentFilename === 'parametres.html' ? 'active' : ''}">
                <i class="fa-solid fa-gears"></i>
                <span>Paramètres</span>
            </a>
            <a href="#" id="sidebar-logout-btn" class="nav-item" style="margin-top: 20px; color: var(--color-danger);">
                <i class="fa-solid fa-power-off"></i>
                <span>Déconnexion</span>
            </a>
        </nav>
        <div class="sidebar-footer">
            <div class="stock-indicator">
                <p>Matériel Libre</p>
                <div class="percentage">${stockPct}%</div>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${stockPct}%"></div>
                </div>
            </div>
        </div>
    `;

    // 4. Créer le Main Content Area
    const mainArea = document.createElement('main');
    mainArea.className = 'main-content';

    // Générer l'en-tête (Header)
    const header = document.createElement('header');
    header.className = 'top-header';

    // Déterminer le titre de l'en-tête selon le fichier
    let headerTitle = "Bonjour Nadjla 🌸";
    let headerSub = "Voici l'activité de votre boutique aujourd'hui.";
    
    if (currentFilename === 'commandes.html') {
        headerTitle = "Gestion des Commandes 🧾";
        headerSub = "Enregistrez, modifiez et gérez toutes vos réservations.";
    } else if (currentFilename === 'nouvelle.html') {
        headerTitle = "Nouvelle Réservation ✨";
        headerSub = "Remplissez le formulaire de location ci-dessous.";
    } else if (currentFilename === 'modifier.html') {
        headerTitle = "Modifier la Réservation ✍️";
        headerSub = "Mettez à jour les détails de cette commande.";
    } else if (currentFilename === 'produits.html') {
        headerTitle = "Inventaire des Produits 📦";
        headerSub = "Suivez l'état, la disponibilité et les prix de vos articles.";
    } else if (currentFilename === 'clientes.html') {
        headerTitle = "Fichier des Clientes 👥";
        headerSub = "Suivez l'historique d'achats et contactez vos clientes.";
    } else if (currentFilename === 'calendrier.html') {
        headerTitle = "Calendrier d'occupation 📅";
        headerSub = "Visualisez le planning de réservation de vos box et valises.";
    } else if (currentFilename === 'statistiques.html') {
        headerTitle = "Analyse Statistique 📈";
        headerSub = "Découvrez vos revenus financiers et articles les plus populaires.";
    } else if (currentFilename === 'parametres.html') {
        headerTitle = "Configuration Générale ⚙️";
        headerSub = "Personnalisez l'application et effectuez vos sauvegardes.";
    }

    // Récupérer le nombre de commandes en retard pour le badge de notification
    const cmdList = await db.getAllCommandes();
    const lateCount = cmdList.filter(c => c.statut === 'Retard').length;

    header.innerHTML = `
        <div class="header-welcome">
            <h2>${headerTitle}</h2>
            <p>${headerSub}</p>
        </div>
        <div class="header-actions">
            <div class="notification-bell" id="header-notif-bell" title="Commandes en retard">
                <i class="fa-solid fa-bell"></i>
                ${lateCount > 0 ? `<span class="notification-badge">${lateCount}</span>` : ''}
            </div>
            <div class="user-profile" id="header-profile-menu">
                <div class="profile-details">
                    <p class="profile-name">Nadjla</p>
                    <p class="profile-role">Administratrice</p>
                </div>
                <div class="profile-avatar">N</div>
            </div>
        </div>
    `;

    // 5. Créer l'en-tête mobile (Menu burger)
    const mobileHeader = document.createElement('div');
    mobileHeader.className = 'mobile-header';
    mobileHeader.innerHTML = `
        <button class="burger-btn" id="mobile-burger-toggle">
            <i class="fa-solid fa-bars"></i>
        </button>
        <div class="logo-text" style="font-size: 1rem;">
            ${enterpriseName}
        </div>
        <div class="profile-avatar" style="width: 36px; height: 36px; font-size: 0.9rem;">N</div>
    `;

    // Assembler l'application
    appElement.appendChild(mobileHeader);
    appElement.appendChild(sidebar);
    
    // Conteneur de page interne
    const innerContent = document.createElement('div');
    innerContent.className = 'animate-fade-in';
    innerContent.style.padding = '30px';
    innerContent.style.flex = '1';
    innerContent.innerHTML = pageContentHtml;

    mainArea.appendChild(header);
    mainArea.appendChild(innerContent);
    appElement.appendChild(mainArea);

    // 6. Activer le menu burger mobile
    const burger = document.getElementById('mobile-burger-toggle');
    if (burger) {
        burger.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // Fermer la sidebar mobile en cliquant à l'extérieur
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 1024) {
            if (!sidebar.contains(e.target) && !burger.contains(e.target) && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        }
    });

    // Activer le bouton de déconnexion
    const logoutBtn = document.getElementById('sidebar-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('admin_session');
            window.location.href = '/index.html';
        });
    }

    // Activer l'action de la cloche de notification (redirection commandes)
    const notifBell = document.getElementById('header-notif-bell');
    if (notifBell) {
        notifBell.addEventListener('click', () => {
            window.location.href = '/commandes.html?filter=Retard';
        });
    }

    // 7. Injecter le chatbot IA de luxe flottant pour Nadjla
    injectLuxuryAIChatbot();
}

// Fonction d'injection dynamique et d'animation de la conseillère IA
function injectLuxuryAIChatbot() {
    let chatWrapper = document.getElementById('luxury-ai-chat-wrapper');
    if (chatWrapper) return; // Éviter les injections multiples

    // Injecter les styles spécifiques du Chatbot
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        .ai-chat-trigger {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #AD1457, #D4AF37);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            box-shadow: 0 8px 32px rgba(173, 20, 87, 0.3);
            cursor: pointer;
            z-index: 1000;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            border: 1px solid rgba(255,255,255,0.2);
        }
        .ai-chat-trigger:hover {
            transform: scale(1.1) rotate(15deg);
            box-shadow: 0 12px 40px rgba(173, 20, 87, 0.45);
        }
        .ai-chat-panel {
            position: fixed;
            bottom: 105px;
            right: 30px;
            width: 380px;
            height: 520px;
            border-radius: var(--radius-lg);
            background: rgba(255, 255, 255, 0.45);
            backdrop-filter: blur(25px);
            -webkit-backdrop-filter: blur(25px);
            border: 1px solid rgba(255, 255, 255, 0.5);
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            display: none;
            flex-direction: column;
            overflow: hidden;
            animation: slideUpFade 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
        }
        @media (max-width: 480px) {
            .ai-chat-panel {
                width: 90%;
                right: 5%;
                bottom: 100px;
                height: 480px;
            }
        }
        @keyframes slideUpFade {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .ai-chat-header {
            background: linear-gradient(135deg, rgba(173, 20, 87, 0.9), rgba(106, 27, 41, 0.9));
            color: white;
            padding: 15px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .ai-chat-header h4 {
            font-size: 0.9rem;
            font-weight: 700;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .ai-chat-header .close-chat {
            background: none;
            border: none;
            color: rgba(255,255,255,0.8);
            font-size: 1.1rem;
            cursor: pointer;
            transition: color 0.2s;
        }
        .ai-chat-header .close-chat:hover {
            color: white;
        }
        .ai-chat-body {
            flex: 1;
            padding: 15px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .chat-msg {
            max-width: 80%;
            padding: 12px 16px;
            border-radius: var(--radius-md);
            font-size: 0.8rem;
            line-height: 1.4;
            animation: fadeIn 0.25s ease-in-out;
        }
        .chat-msg.assistant {
            background: rgba(255, 255, 255, 0.6);
            align-self: flex-start;
            border-bottom-left-radius: 4px;
            color: var(--text-color);
            border: 1px solid rgba(255,255,255,0.4);
        }
        .chat-msg.user {
            background: #AD1457;
            color: white;
            align-self: flex-end;
            border-bottom-right-radius: 4px;
            box-shadow: 0 4px 12px rgba(173, 20, 87, 0.15);
        }
        .ai-chat-footer {
            padding: 12px;
            background: rgba(255,255,255,0.3);
            border-top: 1px solid rgba(255,255,255,0.3);
            display: flex;
            gap: 8px;
        }
        .ai-chat-footer input {
            flex: 1;
            background: rgba(255,255,255,0.6);
            border: 1px solid rgba(255,255,255,0.4);
            border-radius: 50px;
            padding: 10px 18px;
            font-size: 0.8rem;
            outline: none;
            color: var(--text-color);
            transition: border-color 0.2s;
        }
        .ai-chat-footer input:focus {
            border-color: #AD1457;
            background: white;
        }
        .ai-chat-footer button {
            background: #AD1457;
            color: white;
            border: none;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 0.9rem;
            transition: transform 0.2s;
        }
        .ai-chat-footer button:hover {
            transform: scale(1.08);
        }
    `;
    document.head.appendChild(styleEl);

    // Créer les éléments HTML
    chatWrapper = document.createElement('div');
    chatWrapper.id = 'luxury-ai-chat-wrapper';

    chatWrapper.innerHTML = `
        <!-- Floating trigger bubble -->
        <div class="ai-chat-trigger" id="ai-chat-trigger-btn" title="Conseillère IA de Nadjla">
            <i class="fa-solid fa-wand-magic-sparkles"></i>
        </div>

        <!-- Sliding chat drawer panel -->
        <div class="ai-chat-panel" id="ai-chat-panel-container">
            <div class="ai-chat-header">
                <h4><i class="fa-solid fa-sparkles" style="color: var(--primary-gold);"></i> Conseillère IA de Nadjla 🌸</h4>
                <button class="close-chat" id="ai-chat-close-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="ai-chat-body" id="ai-chat-messages-container">
                <div class="chat-msg assistant">
                    Bonjour Nadjla ! Je suis votre conseillère IA personnalisée. Posez-moi des questions sur vos locations de mariage, vos chiffres financiers, ou demandez-moi des idées créatives de décoration ! ✨
                </div>
            </div>
            <div class="ai-chat-footer">
                <input type="text" id="ai-chat-user-input" placeholder="Écrivez votre message ici...">
                <button id="ai-chat-send-btn"><i class="fa-solid fa-paper-plane"></i></button>
            </div>
        </div>
    `;

    document.body.appendChild(chatWrapper);

    const trigger = document.getElementById('ai-chat-trigger-btn');
    const panel = document.getElementById('ai-chat-panel-container');
    const closeBtn = document.getElementById('ai-chat-close-btn');
    const inputField = document.getElementById('ai-chat-user-input');
    const sendBtn = document.getElementById('ai-chat-send-btn');
    const msgContainer = document.getElementById('ai-chat-messages-container');

    // Toggle opening / closing
    trigger.addEventListener('click', () => {
        if (panel.style.display === 'flex') {
            panel.style.display = 'none';
        } else {
            panel.style.display = 'flex';
            inputField.focus();
            // Scroll to bottom
            msgContainer.scrollTop = msgContainer.scrollHeight;
        }
    });

    closeBtn.addEventListener('click', () => {
        panel.style.display = 'none';
    });

    // Envoyer le message
    const sendMessage = async () => {
        const text = inputField.value.trim();
        if (!text) return;

        // Effacer l'input
        inputField.value = '';

        // Ajouter le message utilisateur dans le flux
        const userBubble = document.createElement('div');
        userBubble.className = 'chat-msg user';
        userBubble.textContent = text;
        msgContainer.appendChild(userBubble);
        msgContainer.scrollTop = msgContainer.scrollHeight;

        // Ajouter une bulle de chargement pour l'assistant
        const loaderBubble = document.createElement('div');
        loaderBubble.className = 'chat-msg assistant';
        loaderBubble.innerHTML = `<i class="fa-solid fa-ellipsis fa-bounce"></i>`;
        msgContainer.appendChild(loaderBubble);
        msgContainer.scrollTop = msgContainer.scrollHeight;

        try {
            // Extraire en temps réel tout le contexte de la base locale IndexedDB
            const clients = await db.getAllClientes();
            const products = await db.getAllProduits();
            const orders = await db.getAllCommandes();

            let totalRevenue = 0;
            let totalReste = 0;
            orders.forEach(o => {
                totalRevenue += (o.montantPaye || 0);
                totalReste += (o.reste || 0);
            });

            const topProducts = [...products]
                .sort((a,b) => (b.locationsCount || 0) - (a.locationsCount || 0))
                .slice(0, 3)
                .map(p => ({ nom: p.nom, locations: p.locationsCount }));

            const lateOrdersCount = orders.filter(o => o.statut === 'Retard').length;

            const dbContext = {
                clientsCount: clients.length,
                productsCount: products.length,
                ordersCount: orders.length,
                totalRevenue,
                totalReste,
                topProducts,
                lateOrdersCount
            };

            // Appeler notre backend sécurisé Express
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, dbContext })
            });

            const result = await response.json();

            // Remplacer la bulle de chargement par la vraie réponse
            if (result.success && result.reply) {
                loaderBubble.textContent = result.reply;
            } else {
                loaderBubble.textContent = "Je rencontre de petites difficultés pour répondre à votre demande actuellement. Veuillez vérifier mon branchement. 🌸";
            }
        } catch (err) {
            console.error(err);
            loaderBubble.textContent = "Désolée Nadjla, une erreur de réseau est survenue. Veuillez vous assurer que le serveur de l'application est démarré. 🌸";
        } finally {
            msgContainer.scrollTop = msgContainer.scrollHeight;
        }
    };

    sendBtn.addEventListener('click', sendMessage);
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

