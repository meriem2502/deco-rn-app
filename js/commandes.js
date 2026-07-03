/* js/commandes.js - Gestion avancée des commandes de locations (Filtres, Duplication, Contrats d'Impression) */

import { db } from './database.js';
import { initUILayout } from './ui.js';

let allCommandes = [];
let filteredCommandes = [];
let currentPage = 1;
const itemsPerPage = 8;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialiser le Layout global
    await initUILayout();

    // 2. Récupérer toutes les commandes depuis la base
    await fetchAndRenderCommandes();

    // 3. Écouter les événements de recherche, filtrage et tri
    setupEventListeners();

    // 4. Détecter si un filtre de statut a été passé en paramètre d'URL (ex: depuis la cloche des retards)
    checkUrlParams();
});

// Récupération des commandes d'IndexedDB et affichage initial
async function fetchAndRenderCommandes() {
    allCommandes = await db.getAllCommandes();
    applyFiltersAndSorting();
}

// Configurer les écouteurs d'événements pour les contrôles interactifs
function setupEventListeners() {
    const searchInput = document.getElementById('commandes-search-input');
    const statusSelect = document.getElementById('filter-status-select');
    const catSelect = document.getElementById('filter-category-select');
    const sortSelect = document.getElementById('sort-by-select');

    if (searchInput) searchInput.addEventListener('input', () => { currentPage = 1; applyFiltersAndSorting(); });
    if (statusSelect) statusSelect.addEventListener('change', () => { currentPage = 1; applyFiltersAndSorting(); });
    if (catSelect) catSelect.addEventListener('change', () => { currentPage = 1; applyFiltersAndSorting(); });
    if (sortSelect) sortSelect.addEventListener('change', () => { applyFiltersAndSorting(); });

    // Pagination
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');

    if (prevBtn) prevBtn.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderTablePage(); } });
    if (nextBtn) nextBtn.addEventListener('click', () => { if (currentPage * itemsPerPage < filteredCommandes.length) { currentPage++; renderTablePage(); } });
}

// Gérer les redirections d'URL pré-filtrées
function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const filterStatus = params.get('filter');
    if (filterStatus) {
        const statusSelect = document.getElementById('filter-status-select');
        if (statusSelect) {
            statusSelect.value = filterStatus;
            applyFiltersAndSorting();
        }
    }
}

// Traiter la recherche, le filtrage de catégories et statuts, ainsi que le tri
function applyFiltersAndSorting() {
    const searchVal = (document.getElementById('commandes-search-input')?.value || '').toLowerCase().trim();
    const statusVal = document.getElementById('filter-status-select')?.value || 'Tous';
    const catVal = document.getElementById('filter-category-select')?.value || 'Tous';
    const sortVal = document.getElementById('sort-by-select')?.value || 'id-desc';

    filteredCommandes = allCommandes.filter(o => {
        // Recherche textuelle
        const matchesSearch = o.clientNom.toLowerCase().includes(searchVal) || 
                              o.clientTel.includes(searchVal) || 
                              o.produitNom.toLowerCase().includes(searchVal);
        
        // Filtre de statut
        const matchesStatus = statusVal === 'Tous' || o.statut === statusVal;

        // Filtre de catégorie
        const matchesCategory = catVal === 'Tous' || o.categorie === catVal;

        return matchesSearch && matchesStatus && matchesCategory;
    });

    // Appliquer le tri
    filteredCommandes.sort((a, b) => {
        if (sortVal === 'id-desc') return b.id - a.id;
        if (sortVal === 'id-asc') return a.id - b.id;
        if (sortVal === 'date-desc') return new Date(b.dateReservation) - new Date(a.dateReservation);
        if (sortVal === 'prix-desc') return b.prix - a.prix;
        if (sortVal === 'reste-desc') return b.reste - a.reste;
        return 0;
    });

    currentPage = 1;
    renderTablePage();
}

// Affichage paginé des lignes du tableau de commandes
function renderTablePage() {
    const tbody = document.getElementById('commandes-tbody');
    if (!tbody) return;

    const total = filteredCommandes.length;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, total);

    const paginatedItems = filteredCommandes.slice(startIndex, endIndex);

    // Mettre à jour l'indicateur de pagination
    const infoLbl = document.getElementById('pagination-info');
    if (infoLbl) {
        infoLbl.textContent = total > 0 
            ? `Affichage de ${startIndex + 1}-${endIndex} sur ${total} commande(s)`
            : `Aucune commande trouvée`;
    }

    // Activer/Désactiver les boutons de pagination
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = endIndex >= total;

    if (paginatedItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 40px; color: var(--text-muted);">Aucune commande enregistrée correspondant à vos filtres.</td></tr>`;
        return;
    }

    tbody.innerHTML = paginatedItems.map(o => {
        let badgeClass = 'badge-success';
        if (o.statut === 'Retard') badgeClass = 'badge-danger';
        if (o.statut === 'Réservé') badgeClass = 'badge-warning';
        if (o.statut === 'Sorti') badgeClass = 'badge-success'; // Vert d'activité
        if (o.statut === 'Retourné') badgeClass = 'badge-success'; // Vert complété

        const isLate = o.statut === 'Retard';

        return `
            <tr>
                <td style="font-weight: 700; color: var(--primary-rose-dark);">#${o.id}</td>
                <td>
                    <div class="client-cell">
                        <div class="client-avatar-mini" style="background: ${isLate ? 'var(--color-danger-bg)' : 'var(--primary-rose)'}; color: ${isLate ? 'var(--color-danger)' : 'var(--primary-rose-dark)'};">${o.clientNom.charAt(0)}</div>
                        <div class="client-info-cell">
                            <h5 style="font-weight: 600;">${o.clientNom}</h5>
                            <p><i class="fa-solid fa-phone" style="font-size: 0.65rem; color: var(--text-muted);"></i> ${o.clientTel}</p>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="client-info-cell">
                        <h5 style="font-weight: 500; font-size: 0.82rem;">${o.produitNom}</h5>
                        <p class="product-category" style="font-size: 0.65rem;">${o.categorie}</p>
                    </div>
                </td>
                <td>
                    <div class="client-info-cell" style="font-size: 0.78rem;">
                        <p style="color: var(--text-color);"><strong>Rés :</strong> ${formatDateStr(o.dateReservation)}</p>
                        <p style="color: ${isLate ? 'var(--color-danger)' : 'var(--text-muted)'};"><strong>Ret :</strong> ${formatDateStr(o.dateRetour)}</p>
                    </div>
                </td>
                <td>
                    <div class="client-info-cell" style="font-size: 0.78rem;">
                        <p><strong>Prix :</strong> ${o.prix.toLocaleString()} DA</p>
                        <p style="color: var(--primary-gold); font-weight: 600;"><strong>Caut :</strong> ${o.caution.toLocaleString()} DA</p>
                    </div>
                </td>
                <td>
                    <div class="client-info-cell" style="font-size: 0.78rem;">
                        <p style="color: var(--color-success); font-weight: 600;"><strong>Payé :</strong> ${o.montantPaye.toLocaleString()} DA</p>
                        <p style="color: ${o.reste > 0 ? 'var(--primary-rose-dark)' : 'var(--color-success)'}; font-weight: 700;">
                            <strong>Reste :</strong> ${o.reste.toLocaleString()} DA
                        </p>
                    </div>
                </td>
                <td>
                    <span class="badge ${badgeClass}">${o.statut}</span>
                </td>
                <td>
                    <div class="actions-cell">
                        <button class="action-btn view print-btn" data-id="${o.id}" title="Imprimer le contrat / Facture"><i class="fa-solid fa-print"></i></button>
                        <a href="/modifier.html?id=${o.id}" class="action-btn edit" title="Modifier la réservation"><i class="fa-solid fa-pen-to-square"></i></a>
                        <button class="action-btn duplicate duplicate-btn" data-id="${o.id}" title="Dupliquer la commande"><i class="fa-solid fa-copy"></i></button>
                        <button class="action-btn delete delete-btn" data-id="${o.id}" title="Supprimer définitivement"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Brancher les boutons d'actions dynamiquement
    document.querySelectorAll('.print-btn').forEach(btn => btn.addEventListener('click', (e) => printInvoice(e.currentTarget.dataset.id)));
    document.querySelectorAll('.duplicate-btn').forEach(btn => btn.addEventListener('click', (e) => duplicateCommande(e.currentTarget.dataset.id)));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => deleteCommande(e.currentTarget.dataset.id)));
}

// Fonction de formatage d'affichage de date
function formatDateStr(isoStr) {
    if (!isoStr) return '';
    return new Date(isoStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// 1. SUPPRIMER UNE COMMANDE
async function deleteCommande(id) {
    const confirmation = confirm("Êtes-vous sûre de vouloir supprimer définitivement cette réservation de location ?");
    if (confirmation) {
        await db.deleteCommande(id);
        await fetchAndRenderCommandes();
    }
}

// 2. DUPLIQUER UNE COMMANDE
async function duplicateCommande(id) {
    const cmdToCopy = await db.getCommande(id);
    if (!cmdToCopy) return;

    // Créer une copie avec des dates réinitialisées à aujourd'hui
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 3);

    const duplicate = {
        ...cmdToCopy,
        dateReservation: today.toISOString().split('T')[0],
        dateSortie: today.toISOString().split('T')[0],
        dateRetour: futureDate.toISOString().split('T')[0],
        statut: 'Réservé',
        montantPaye: 0, // Remise à zéro pour le nouveau contrat
        reste: cmdToCopy.prix
    };

    delete duplicate.id; //IndexedDB générera un nouvel ID automatique

    await db.addCommande(duplicate);
    alert(`La commande de ${cmdToCopy.clientNom} a été dupliquée avec succès avec des dates de location par défaut. 🌸`);
    await fetchAndRenderCommandes();
}

// 3. IMPRIMER LE CONTRAT DE LOCATION LUXUEUX
async function printInvoice(id) {
    const cmd = await db.getCommande(id);
    const enterpriseName = await db.getSetting('enterprise_name') || 'DECO RN';
    const enterprisePhone = await db.getSetting('phone') || '0550 12 34 56';
    const enterpriseLogo = await db.getSetting('logo') || '';

    if (!cmd) return;

    const modal = document.getElementById('print-invoice-modal');
    const container = document.getElementById('invoice-print-section');
    if (!modal || !container) return;

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--primary-rose-dark); padding-bottom: 20px; margin-bottom: 30px;">
            <div>
                <h1 style="color: var(--primary-rose-dark); font-size: 2rem; font-weight: 800; margin: 0;">${enterpriseName}</h1>
                <p style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 2px; color: var(--text-muted); margin: 5px 0 0 0;">CONTRAT DE LOCATION DE LUXE</p>
            </div>
            <div style="text-align: right;">
                <p style="margin: 0; font-weight: 700;">CONTRAT N° RN-${cmd.id}</p>
                <p style="margin: 3px 0 0 0; font-size: 0.82rem; color: var(--text-muted);">Date : ${formatDateStr(cmd.dateReservation)}</p>
                <p style="margin: 3px 0 0 0; font-size: 0.82rem; color: var(--text-muted);">Tél : ${enterprisePhone}</p>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
            <div style="background: var(--primary-rose-light); padding: 20px; border-radius: var(--radius-md); border: 1px dashed var(--primary-rose);">
                <h3 style="color: var(--primary-rose-dark); font-size: 0.9rem; text-transform: uppercase; margin-bottom: 10px;">PROPRIÉTAIRE</h3>
                <p style="margin: 0; font-weight: 700;">Boutique ${enterpriseName}</p>
                <p style="margin: 5px 0 0 0; font-size: 0.85rem; color: var(--text-color);">Responsable: Nadjla</p>
                <p style="margin: 5px 0 0 0; font-size: 0.85rem; color: var(--text-color);">Alarme Retards / Suivi actif de location</p>
            </div>
            <div style="background: var(--primary-rose-light); padding: 20px; border-radius: var(--radius-md); border: 1px dashed var(--primary-rose);">
                <h3 style="color: var(--primary-rose-dark); font-size: 0.9rem; text-transform: uppercase; margin-bottom: 10px;">LOCATAIRE (CLIENTE)</h3>
                <p style="margin: 0; font-weight: 700;">${cmd.clientNom}</p>
                <p style="margin: 5px 0 0 0; font-size: 0.85rem; color: var(--text-color);"><strong>Tél:</strong> ${cmd.clientTel}</p>
                <p style="margin: 5px 0 0 0; font-size: 0.85rem; color: var(--text-color);"><strong>Adresse:</strong> ${cmd.clientAdresse || 'Non renseignée'}</p>
            </div>
        </div>

        <h3 style="color: var(--primary-rose-dark); font-size: 1rem; text-transform: uppercase; margin-bottom: 15px; border-bottom: 1px solid var(--primary-rose); padding-bottom: 5px;">DÉTAILS DU MATÉRIEL LOUÉ</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 35px;">
            <thead>
                <tr style="background: #FFF5F7; text-align: left;">
                    <th style="padding: 12px; font-size: 0.85rem; text-transform: uppercase;">Description de l'article</th>
                    <th style="padding: 12px; font-size: 0.85rem; text-transform: uppercase;">Catégorie</th>
                    <th style="padding: 12px; font-size: 0.85rem; text-transform: uppercase; text-align: right;">Prix Location</th>
                </tr>
            </thead>
            <tbody>
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 15px 12px; font-weight: 700;">${cmd.produitNom}</td>
                    <td style="padding: 15px 12px; color: var(--text-muted);">${cmd.categorie}</td>
                    <td style="padding: 15px 12px; font-weight: 700; text-align: right;">${cmd.prix.toLocaleString()} DA</td>
                </tr>
            </tbody>
        </table>

        <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 30px; margin-bottom: 40px;">
            <div style="font-size: 0.8rem; line-height: 1.5; color: var(--text-muted);">
                <h4 style="color: var(--text-color); margin-bottom: 8px;">CONDITIONS GÉNÉRALES DE LOCATION</h4>
                <p style="margin: 0 0 5px 0;">1. Le matériel loué reste la propriété exclusive de ${enterpriseName}.</p>
                <p style="margin: 0 0 5px 0;">2. Une caution obligatoire de <strong>${cmd.caution.toLocaleString()} DA</strong> a été déposée et sera restituée après inspection de l'état des articles.</p>
                <p style="margin: 0 0 5px 0;">3. En cas de retard de restitution au-delà du <strong>${formatDateStr(cmd.dateRetour)}</strong>, des pénalités quotidiennes s'appliqueront.</p>
                <p style="margin: 0;">4. Toute détérioration du matériel entraînera la perte partielle ou totale de la caution.</p>
            </div>
            <div>
                <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px 0; color: var(--text-muted);">Prix total :</td>
                        <td style="padding: 10px 0; font-weight: 700; text-align: right;">${cmd.prix.toLocaleString()} DA</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px 0; color: var(--color-success); font-weight: 600;">Montant payé :</td>
                        <td style="padding: 10px 0; font-weight: 700; text-align: right; color: var(--color-success);">${cmd.montantPaye.toLocaleString()} DA</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px 0; color: var(--primary-gold); font-weight: 600;">Caution déposée :</td>
                        <td style="padding: 10px 0; font-weight: 700; text-align: right; color: var(--primary-gold);">${cmd.caution.toLocaleString()} DA</td>
                    </tr>
                    <tr style="font-size: 1.1rem; border-bottom: 2px solid var(--primary-rose-dark);">
                        <td style="padding: 12px 0; color: var(--primary-rose-dark); font-weight: 800;">Reste à payer :</td>
                        <td style="padding: 12px 0; font-weight: 800; text-align: right; color: var(--primary-rose-dark);">${cmd.reste.toLocaleString()} DA</td>
                    </tr>
                </table>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; text-align: center; margin-top: 50px; padding-top: 30px; border-top: 1px dashed var(--primary-rose);">
            <div>
                <p style="font-size: 0.85rem; font-weight: 700; text-decoration: underline; margin-bottom: 60px;">Signature de la cliente</p>
                <p style="font-size: 0.85rem; color: var(--text-muted);">${cmd.clientNom}</p>
            </div>
            <div>
                <p style="font-size: 0.85rem; font-weight: 700; text-decoration: underline; margin-bottom: 60px;">Pour la boutique ${enterpriseName}</p>
                <p style="font-size: 0.85rem; color: var(--text-muted);">Administratrice Nadjla 🌸</p>
            </div>
        </div>

        <div style="display: flex; justify-content: center; gap: 15px; margin-top: 50px;" class="no-print">
            <button class="btn btn-primary" id="btn-trigger-print"><i class="fa-solid fa-print"></i> Lancer l'Impression</button>
            <button class="btn btn-secondary" id="btn-close-print-modal">Retour</button>
        </div>
    `;

    // Ouvrir la modale
    modal.style.display = 'flex';

    // Bouton de fermeture
    document.getElementById('btn-close-print-modal').addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Lancer l'impression système native
    document.getElementById('btn-trigger-print').addEventListener('click', () => {
        window.print();
    });
}
