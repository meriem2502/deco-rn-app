/* js/dashboard.js - Logique métier du tableau de bord (Calculs financiers, bento grid, etc.) */

import { db } from './database.js';
import { initUILayout } from './ui.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialiser la structure globale de l'UI (Sidebar, Header, etc.)
    await initUILayout();

    // 2. Extraire les données nécessaires d'IndexedDB
    const orders = await db.getAllCommandes();
    const products = await db.getAllProduits();
    const clients = await db.getAllClientes();

    // 3. Calculer les statistiques requises
    calculateMetrics(orders, products, clients);

    // 4. Injecter les commandes récentes dans la table
    renderRecentOrders(orders);

    // 5. Injecter l'agenda d'aujourd'hui
    renderTodayAgenda(orders);

    // 6. Injecter les alertes de retard
    renderAlertsAndLateReturns(orders);

    // 7. Dessiner le graphique financier miniature
    renderMiniChart(orders);
});

// Calcul de l'ensemble des métriques de synthèse financière et d'activité
function calculateMetrics(orders, products, clients) {
    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth(); // 0-11
    const currentYear = new Date().getFullYear();

    let revToday = 0;
    let revMonth = 0;
    let revYear = 0;

    orders.forEach(o => {
        const oDate = new Date(o.dateReservation);
        const isToday = o.dateReservation === todayStr;
        const isThisMonth = oDate.getMonth() === currentMonth && oDate.getFullYear() === currentYear;
        const isThisYear = oDate.getFullYear() === currentYear;

        // On comptabilise le montant réellement payé pour les revenus
        if (isToday) revToday += o.montantPaye;
        if (isThisMonth) revMonth += o.montantPaye;
        if (isThisYear) revYear += o.montantPaye;
    });

    // Statistiques des produits
    const totalProducts = products.length;
    const availableProducts = products.filter(p => p.disponibilite === 'Disponible').length;
    const rentedProducts = products.filter(p => p.disponibilite === 'Loué' || p.disponibilite === 'Indisponible').length;

    // Injecter dans les cartes de statistiques
    const statsContainer = document.getElementById('stats-cards-row');
    if (!statsContainer) return;

    const formatCurrency = (val) => Number(val).toLocaleString() + ' DA';

    statsContainer.innerHTML = `
        <!-- Commandes -->
        <div class="stat-card">
            <div class="stat-header">
                <span class="stat-title">Commandes</span>
                <div class="stat-icon"><i class="fa-solid fa-receipt"></i></div>
            </div>
            <div>
                <p class="stat-value">${orders.length}</p>
                <p class="stat-meta positive"><i class="fa-solid fa-arrow-trend-up"></i> Actives et passées</p>
            </div>
        </div>

        <!-- Clientes -->
        <div class="stat-card">
            <div class="stat-header">
                <span class="stat-title">Clientes</span>
                <div class="stat-icon"><i class="fa-solid fa-users"></i></div>
            </div>
            <div>
                <p class="stat-value">${clients.length}</p>
                <p class="stat-meta positive"><i class="fa-solid fa-user-check"></i> Fiches enregistrées</p>
            </div>
        </div>

        <!-- Produits -->
        <div class="stat-card">
            <div class="stat-header">
                <span class="stat-title">Stock Disponible</span>
                <div class="stat-icon"><i class="fa-solid fa-boxes-stacked"></i></div>
            </div>
            <div>
                <p class="stat-value">${availableProducts} <span class="text-xs text-slate-400">/ ${totalProducts}</span></p>
                <p class="stat-meta neutral">Loués actuellement: ${rentedProducts}</p>
            </div>
        </div>

        <!-- Revenu du Jour -->
        <div class="stat-card">
            <div class="stat-header">
                <span class="stat-title">Revenu Jour</span>
                <div class="stat-icon" style="color: var(--primary-gold);"><i class="fa-solid fa-coins"></i></div>
            </div>
            <div>
                <p class="stat-value" style="color: var(--primary-gold);">${formatCurrency(revToday)}</p>
                <p class="stat-meta positive">Aujourd'hui</p>
            </div>
        </div>

        <!-- Revenu du Mois -->
        <div class="stat-card">
            <div class="stat-header">
                <span class="stat-title">Revenu Mois</span>
                <div class="stat-icon" style="color: var(--primary-rose-dark);"><i class="fa-solid fa-calendar-check"></i></div>
            </div>
            <div>
                <p class="stat-value" style="color: var(--primary-rose-dark);">${formatCurrency(revMonth)}</p>
                <p class="stat-meta positive">Ce mois-ci</p>
            </div>
        </div>

        <!-- Revenu Annuel -->
        <div class="stat-card">
            <div class="stat-header">
                <span class="stat-title">Revenu Année</span>
                <div class="stat-icon"><i class="fa-solid fa-money-bill-trend-up"></i></div>
            </div>
            <div>
                <p class="stat-value">${formatCurrency(revYear)}</p>
                <p class="stat-meta positive">Année ${currentYear}</p>
            </div>
        </div>
    `;
}

// Rendu des 4 commandes les plus récentes
function renderRecentOrders(orders) {
    const tbody = document.getElementById('recent-orders-tbody');
    if (!tbody) return;

    // Trier les commandes par ID décroissant
    const recent = [...orders].sort((a, b) => b.id - a.id).slice(0, 4);

    if (recent.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 30px; color: var(--text-muted);">Aucune commande récente enregistrée.</td></tr>`;
        return;
    }

    tbody.innerHTML = recent.map(o => {
        let badgeClass = 'badge-success';
        if (o.statut === 'Retard') badgeClass = 'badge-danger';
        if (o.statut === 'Réservé') badgeClass = 'badge-warning';

        return `
            <tr>
                <td class="py-4">
                    <div class="client-cell">
                        <div class="client-avatar-mini">${o.clientNom.charAt(0)}</div>
                        <div class="client-info-cell">
                            <h5>${o.clientNom}</h5>
                            <p>${o.clientTel}</p>
                        </div>
                    </div>
                </td>
                <td class="py-4 text-gray-600">${o.produitNom}</td>
                <td class="py-4 text-gray-600">${new Date(o.dateRetour).toLocaleDateString('fr-FR')}</td>
                <td class="py-4">
                    <span class="badge ${badgeClass}">${o.statut}</span>
                </td>
                <td class="py-4 text-right font-bold" style="color: ${o.reste > 0 ? 'var(--primary-rose-dark)' : 'inherit'};">
                    ${o.reste.toLocaleString()} DA
                </td>
            </tr>
        `;
    }).join('');
}

// Rendu de l'agenda de la journée (les sorties et retours de la journée)
function renderTodayAgenda(orders) {
    const agendaList = document.getElementById('today-agenda-list');
    const todayLbl = document.getElementById('today-date-lbl');
    if (!agendaList) return;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (todayLbl) {
        todayLbl.textContent = today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    // Filtrer les sorties d'aujourd'hui et retours d'aujourd'hui
    const actionsToday = [];

    orders.forEach(o => {
        if (o.dateSortie === todayStr) {
            actionsToday.push({
                type: 'sortie',
                title: `Sortie : ${o.clientNom}`,
                desc: `${o.produitNom} (Caution: ${o.caution} DA)`,
                class: 'success'
            });
        }
        if (o.dateRetour === todayStr) {
            actionsToday.push({
                type: 'retour',
                title: `Retour : ${o.clientNom}`,
                desc: `${o.produitNom} (Reste: ${o.reste} DA)`,
                class: 'alert'
            });
        }
    });

    if (actionsToday.length === 0) {
        agendaList.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 0.8rem;">
                <i class="fa-solid fa-mug-hot" style="font-size: 1.5rem; margin-bottom: 10px; color: var(--primary-rose-dark); display: block;"></i>
                Rien de prévu aujourd'hui.
            </div>
        `;
        return;
    }

    agendaList.innerHTML = actionsToday.map(act => `
        <div class="agenda-item ${act.class}">
            <div class="agenda-time">${act.type === 'sortie' ? 'LIVR' : 'RET'}</div>
            <div class="agenda-info">
                <h5>${act.title}</h5>
                <p>${act.desc}</p>
            </div>
        </div>
    `).join('');
}

// Rendu des alertes de retards et anomalies de paiement
function renderAlertsAndLateReturns(orders) {
    const alertsContainer = document.getElementById('alerts-container');
    if (!alertsContainer) return;

    const lates = orders.filter(o => o.statut === 'Retard');

    if (lates.length === 0) {
        alertsContainer.innerHTML = `
            <div class="notification-item" style="border-left: 4px solid var(--color-success);">
                <i class="fa-solid fa-circle-check" style="color: var(--color-success);"></i>
                <div class="notification-text">
                    <h6>Aucun retard à signaler !</h6>
                    <p>Tout le matériel est restitué à temps.</p>
                </div>
            </div>
        `;
        return;
    }

    alertsContainer.innerHTML = lates.map(o => `
        <div class="notification-item" style="border-left: 4px solid var(--color-danger);">
            <i class="fa-solid fa-triangle-exclamation" style="color: var(--color-danger);"></i>
            <div class="notification-text">
                <h6 style="color: var(--color-danger); font-weight:700;">Retard : ${o.clientNom}</h6>
                <p>${o.produitNom} en retard de retour (Prévu le : ${new Date(o.dateRetour).toLocaleDateString('fr-FR')})</p>
                <p style="font-weight: 600; margin-top: 3px;">Tél: ${o.clientTel}</p>
            </div>
        </div>
    `).join('');
}

// Dessiner le graphique miniature avec Chart.js
function renderMiniChart(orders) {
    const canvas = document.getElementById('revenue-mini-chart');
    if (!canvas) return;

    // Calculer les revenus par mois de l'année en cours
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = Array(12).fill(0);

    orders.forEach(o => {
        const oDate = new Date(o.dateReservation);
        if (oDate.getFullYear() === currentYear) {
            const month = oDate.getMonth();
            monthlyRevenue[month] += o.montantPaye;
        }
    });

    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

    new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Revenus (DA)',
                data: monthlyRevenue,
                borderColor: '#AD1457',
                backgroundColor: 'rgba(173, 20, 87, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#D4AF37',
                pointBorderColor: '#fff',
                pointHoverRadius: 6,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.03)'
                    },
                    ticks: {
                        font: {
                            family: 'Poppins',
                            size: 10
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            family: 'Poppins',
                            size: 10
                        }
                    }
                }
            }
        }
    });
}
