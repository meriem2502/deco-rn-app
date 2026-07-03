/* js/stats.js - Algorithmes d'analyses financières et graphiques Chart.js */

import { db } from './database.js';
import { initUILayout } from './ui.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialiser le Layout global
    await initUILayout();

    // 2. Extraire toutes les collections de la base IndexedDB
    const orders = await db.getAllCommandes();
    const products = await db.getAllProduits();
    const clients = await db.getAllClientes();

    // 3. Calculer et injecter les métriques financières globales
    renderFinancialOverview(orders);

    // 4. Remplir le classement du matériel le plus loué
    renderTopProductsTable(products);

    // 5. Remplir le tableau des clientes VIP d'honneur
    renderVIPCustomersTable(clients);

    // 6. Dessiner le graphique détaillé des revenus par mois
    renderDetailedRevenueChart(orders);

    // 7. Dessiner le graphique circulaire de popularité des catégories
    renderCategoryPopularityChart(orders);
});

// Calcul des cumuls financiers
function renderFinancialOverview(orders) {
    let totalCA = 0;
    let totalReste = 0;

    orders.forEach(o => {
        totalCA += (o.montantPaye || 0);
        totalReste += (o.reste || 0);
    });

    const caEl = document.getElementById('stats-total-ca');
    const resteEl = document.getElementById('stats-total-reste');
    const countEl = document.getElementById('stats-total-orders');

    if (caEl) caEl.textContent = totalCA.toLocaleString() + ' DA';
    if (resteEl) resteEl.textContent = totalReste.toLocaleString() + ' DA';
    if (countEl) countEl.textContent = orders.length;
}

// Rendu du matériel le plus loué (Tri par locationsCount décroissant)
function renderTopProductsTable(products) {
    const tbody = document.getElementById('stats-items-tbody');
    if (!tbody) return;

    const topProducts = [...products].sort((a, b) => (b.locationsCount || 0) - (a.locationsCount || 0)).slice(0, 5);

    if (topProducts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 20px;">Aucun produit loué.</td></tr>`;
        return;
    }

    tbody.innerHTML = topProducts.map(p => `
        <tr style="border-bottom: 1px solid rgba(0,0,0,0.02);">
            <td style="font-weight: 600; font-size: 0.8rem; padding: 12px 10px;">${p.nom}</td>
            <td style="color: var(--text-muted); font-size: 0.75rem;">${p.categorie}</td>
            <td style="text-align: center; font-weight: 700; font-size: 0.85rem;"><span style="background: rgba(173, 20, 87, 0.08); color: var(--primary-rose-dark); padding: 3px 8px; border-radius: 50px;">${p.locationsCount || 0} locs</span></td>
            <td style="text-align: right; font-weight: 700; font-size: 0.82rem;">${p.prix.toLocaleString()} DA</td>
        </tr>
    `).join('');
}

// Rendu des clientes les plus dépensières
function renderVIPCustomersTable(clients) {
    const tbody = document.getElementById('stats-clients-tbody');
    if (!tbody) return;

    const topClients = [...clients].sort((a, b) => (b.totalPaye || 0) - (a.totalPaye || 0)).slice(0, 5);

    if (topClients.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 20px;">Aucune cliente.</td></tr>`;
        return;
    }

    tbody.innerHTML = topClients.map(c => `
        <tr style="border-bottom: 1px solid rgba(0,0,0,0.02);">
            <td style="font-weight: 600; font-size: 0.8rem; padding: 12px 10px;">${c.nom}</td>
            <td style="color: var(--text-muted); font-size: 0.75rem;">${c.telephone}</td>
            <td style="text-align: center; font-weight: 700; font-size: 0.85rem;"><span style="background: rgba(212, 175, 55, 0.1); color: #B59410; padding: 3px 8px; border-radius: 50px;">${c.locationsCount || 0} fois</span></td>
            <td style="text-align: right; font-weight: 700; color: var(--color-success); font-size: 0.82rem;">${(c.totalPaye || 0).toLocaleString()} DA</td>
        </tr>
    `).join('');
}

// Graphique d'analyse mensuelle du Chiffre d'Affaire
function renderDetailedRevenueChart(orders) {
    const canvas = document.getElementById('revenue-detailed-chart');
    if (!canvas) return;

    const currentYear = new Date().getFullYear();
    const monthlyRevenue = Array(12).fill(0);

    orders.forEach(o => {
        const oDate = new Date(o.dateReservation);
        if (oDate.getFullYear() === currentYear) {
            const month = oDate.getMonth();
            monthlyRevenue[month] += (o.montantPaye || 0);
        }
    });

    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

    new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: 'Revenus Réels (DA)',
                data: monthlyRevenue,
                backgroundColor: 'rgba(173, 20, 87, 0.7)',
                borderColor: '#AD1457',
                borderWidth: 1.5,
                borderRadius: 6,
                barThickness: 18
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: { family: 'Poppins', size: 11 }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.03)' },
                    ticks: {
                        font: { family: 'Poppins', size: 10 }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { family: 'Poppins', size: 10 }
                    }
                }
            }
        }
    });
}

// Graphique circulaire de popularité des catégories par rapport au volume de commandes
function renderCategoryPopularityChart(orders) {
    const canvas = document.getElementById('category-popularity-chart');
    if (!canvas) return;

    // Compter la répartition par catégorie
    const catCounts = {
        'Box Fiançaille': 0,
        'Valises': 0,
        'Accessoires': 0,
        'Mariage': 0
    };

    orders.forEach(o => {
        if (catCounts.hasOwnProperty(o.categorie)) {
            catCounts[o.categorie]++;
        }
    });

    const labels = Object.keys(catCounts);
    const data = Object.values(catCounts);

    new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#AD1457', // Rose profond
                    '#D4AF37', // Or
                    '#6A1B29', // Bordeaux de luxe
                    '#C2185B'  // Rose vif
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { family: 'Poppins', size: 11 },
                        boxWidth: 12
                    }
                }
            },
            cutout: '65%'
        }
    });
}
