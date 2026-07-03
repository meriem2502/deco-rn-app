/* js/clientes.js - Gestion du fichier cliente de la boutique (Historique, VIP, Réseaux Sociaux) */

import { db } from './database.js';
import { initUILayout } from './ui.js';

let allClients = [];
let filteredClients = [];

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialiser la structure globale de l'UI
    await initUILayout();

    // 2. Récupérer toutes les clientes
    await fetchAndRenderClients();

    // 3. Établir les écouteurs d'événements pour le filtrage et l'édition
    setupEventListeners();
});

async function fetchAndRenderClients() {
    allClients = await db.getAllClientes();
    applyFiltersAndSorting();
}

function setupEventListeners() {
    const searchInput = document.getElementById('clientes-search-input');
    const sortSelect = document.getElementById('sort-clientes-select');

    if (searchInput) searchInput.addEventListener('input', applyFiltersAndSorting);
    if (sortSelect) sortSelect.addEventListener('change', applyFiltersAndSorting);

    // Ouvrir modale d'ajout
    const addTrigger = document.getElementById('btn-add-client-trigger');
    const modal = document.getElementById('client-modal');
    const closeBtn = document.getElementById('btn-close-client-modal');
    const cancelBtn = document.getElementById('btn-cancel-client');

    if (addTrigger && modal) {
        addTrigger.addEventListener('click', () => {
            resetClientForm();
            document.getElementById('client-modal-title').textContent = "Enregistrer une nouvelle cliente";
            modal.style.display = 'flex';
        });
    }

    const closeModal = () => { if (modal) modal.style.display = 'none'; };
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    // Soumission du formulaire d'ajout / modification de cliente
    const form = document.getElementById('client-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = document.getElementById('edit-client-id').value;
            const nom = document.getElementById('client-nom').value.trim();
            const telephone = document.getElementById('client-telephone').value.trim();
            const facebook = document.getElementById('client-facebook').value.trim();
            const instagram = document.getElementById('client-instagram').value.trim();
            const adresse = document.getElementById('client-adresse').value.trim();
            const remarques = document.getElementById('client-remarques').value.trim();

            const clientObj = {
                nom,
                telephone,
                facebook,
                instagram,
                adresse,
                remarques
            };

            if (id) {
                // Modification de cliente existante
                const original = allClients.find(c => c.id === Number(id));
                clientObj.id = Number(id);
                clientObj.locationsCount = original ? (original.locationsCount || 0) : 0;
                clientObj.totalPaye = original ? (original.totalPaye || 0) : 0;
                
                await db.updateCliente(clientObj);
                alert("Fiche cliente mise à jour avec succès. 🌸");
            } else {
                // Création d'une nouvelle fiche
                clientObj.locationsCount = 0;
                clientObj.totalPaye = 0;

                // Validation unicité téléphone
                const isExistingTel = allClients.some(c => c.telephone === telephone);
                if (isExistingTel) {
                    alert("Une cliente avec ce numéro de téléphone existe déjà ! Veuillez modifier la fiche existante.");
                    return;
                }

                await db.addCliente(clientObj);
                alert("Nouvelle fiche cliente enregistrée avec succès. ✨");
            }

            closeModal();
            await fetchAndRenderClients();
        });
    }
}

function applyFiltersAndSorting() {
    const searchVal = (document.getElementById('clientes-search-input')?.value || '').toLowerCase().trim();
    const sortVal = document.getElementById('sort-clientes-select')?.value || 'name-asc';

    filteredClients = allClients.filter(c => {
        return c.nom.toLowerCase().includes(searchVal) || 
               c.telephone.includes(searchVal) || 
               (c.adresse || '').toLowerCase().includes(searchVal) ||
               (c.facebook || '').toLowerCase().includes(searchVal) ||
               (c.instagram || '').toLowerCase().includes(searchVal);
    });

    // Appliquer le tri
    filteredClients.sort((a, b) => {
        if (sortVal === 'name-asc') return a.nom.localeCompare(b.nom);
        if (sortVal === 'name-desc') return b.nom.localeCompare(a.nom);
        if (sortVal === 'locations-desc') return (b.locationsCount || 0) - (a.locationsCount || 0);
        if (sortVal === 'revenue-desc') return (b.totalPaye || 0) - (a.totalPaye || 0);
        return 0;
    });

    renderClientsTable();
}

function renderClientsTable() {
    const tbody = document.getElementById('clientes-tbody');
    if (!tbody) return;

    if (filteredClients.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">Aucune cliente enregistrée correspondant à vos critères de recherche.</td></tr>`;
        return;
    }

    tbody.innerHTML = filteredClients.map(c => {
        // Mettre en évidence les clientes fidèles (VIP)
        const isVIP = (c.locationsCount || 0) >= 3;

        return `
            <tr>
                <td>
                    <div class="client-cell">
                        <div class="client-avatar-mini" style="background: ${isVIP ? 'var(--primary-gold)' : 'var(--primary-rose)'}; color: ${isVIP ? 'var(--color-success)' : 'var(--primary-rose-dark)'};">
                            ${isVIP ? '<i class="fa-solid fa-crown" style="font-size:0.7rem;"></i>' : c.nom.charAt(0)}
                        </div>
                        <div class="client-info-cell">
                            <h5 style="font-weight: 600; display: flex; align-items: center; gap: 5px;">
                                ${c.nom}
                                ${isVIP ? `<span style="font-size: 0.65rem; background: rgba(212, 175, 55, 0.15); color: #B59410; padding: 2px 6px; border-radius: 50px;"><i class="fa-solid fa-gem"></i> VIP</span>` : ''}
                            </h5>
                            <p style="font-size: 0.72rem; color: var(--text-muted);"><i class="fa-solid fa-location-dot"></i> ${c.adresse || 'Adresse non renseignée'}</p>
                        </div>
                    </div>
                </td>
                <td style="font-weight: 600; font-size: 0.85rem;"><i class="fa-solid fa-phone" style="font-size: 0.75rem; color: var(--text-muted); margin-right: 5px;"></i>${c.telephone}</td>
                <td>
                    <div style="display: flex; gap: 8px; font-size: 0.8rem;">
                        ${c.facebook ? `<a href="https://facebook.com" target="_blank" style="color: #1877F2; background: rgba(24, 119, 242, 0.08); padding: 4px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-brands fa-facebook"></i> ${c.facebook}</a>` : ''}
                        ${c.instagram ? `<a href="https://instagram.com" target="_blank" style="color: #E1306C; background: rgba(225, 48, 108, 0.08); padding: 4px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-brands fa-instagram"></i> @${c.instagram}</a>` : ''}
                        ${!c.facebook && !c.instagram ? '<span style="color: var(--text-muted); font-size: 0.75rem;">Aucun compte lié</span>' : ''}
                    </div>
                </td>
                <td style="text-align: center; font-weight: 700; font-size: 0.95rem;">
                    <span style="background: rgba(173, 20, 87, 0.08); color: var(--primary-rose-dark); padding: 4px 10px; border-radius: 50px;">
                        ${c.locationsCount || 0}
                    </span>
                </td>
                <td style="font-weight: 700; color: var(--color-success); font-size: 0.85rem;">${(c.totalPaye || 0).toLocaleString()} DA</td>
                <td style="max-width: 250px; font-size: 0.78rem; color: var(--text-muted); line-height: 1.4;">${c.remarques || '<em>Aucune note enregistrée</em>'}</td>
                <td>
                    <div class="actions-cell">
                        <button class="action-btn edit edit-client-btn" data-id="${c.id}" title="Modifier la fiche"><i class="fa-solid fa-user-pen"></i></button>
                        <button class="action-btn delete delete-client-btn" data-id="${c.id}" title="Supprimer la cliente"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Connecter les boutons d'actions d'édition et de suppression
    document.querySelectorAll('.edit-client-btn').forEach(btn => btn.addEventListener('click', (e) => editClient(e.currentTarget.dataset.id)));
    document.querySelectorAll('.delete-client-btn').forEach(btn => btn.addEventListener('click', (e) => deleteClient(e.currentTarget.dataset.id)));
}

// Pré-remplir la modale pour l'édition de la cliente
async function editClient(id) {
    const client = await db.getCliente(id);
    if (!client) return;

    resetClientForm();

    document.getElementById('edit-client-id').value = client.id;
    document.getElementById('client-nom').value = client.nom;
    document.getElementById('client-telephone').value = client.telephone;
    document.getElementById('client-facebook').value = client.facebook || '';
    document.getElementById('client-instagram').value = client.instagram || '';
    document.getElementById('client-adresse').value = client.adresse || '';
    document.getElementById('client-remarques').value = client.remarques || '';

    document.getElementById('client-modal-title').textContent = "Modifier la fiche cliente";
    document.getElementById('client-modal').style.display = 'flex';
}

// Supprimer une cliente
async function deleteClient(id) {
    const confirmation = confirm("Êtes-vous sûre de vouloir supprimer définitivement cette cliente ? L'historique des locations de cette personne sera effacé.");
    if (confirmation) {
        await db.deleteCliente(id);
        await fetchAndRenderClients();
    }
}

// Remise à zéro complète du formulaire cliente
function resetClientForm() {
    document.getElementById('edit-client-id').value = '';
    document.getElementById('client-form').reset();
}
