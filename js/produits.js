/* js/produits.js - Gestion du catalogue d'inventaire de luxe avec Générateur d'illustrations IA Gemini */

import { db } from './database.js';
import { initUILayout } from './ui.js';

let allProducts = [];
let filteredProducts = [];
let base64Photo = '';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialiser le Layout global
    await initUILayout();

    // 2. Récupérer les produits
    await fetchAndRenderProducts();

    // 3. Écouter les contrôles de filtrage
    setupEventListeners();

    // 4. Écouter la sélection d'image locale
    setupLocalPhotoUpload();

    // 5. Écouter la génération d'images IA
    setupAIImageGenerator();
});

async function fetchAndRenderProducts() {
    allProducts = await db.getAllProduits();
    applyFilters();
}

function setupEventListeners() {
    const searchInput = document.getElementById('produits-search-input');
    const categorySelect = document.getElementById('filter-prod-category');
    const statusSelect = document.getElementById('filter-prod-status');

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (categorySelect) categorySelect.addEventListener('change', applyFilters);
    if (statusSelect) statusSelect.addEventListener('change', applyFilters);

    // Ouvrir modale d'ajout
    const addTrigger = document.getElementById('btn-add-product-trigger');
    const modal = document.getElementById('product-modal');
    const closeBtn = document.getElementById('btn-close-prod-modal');
    const cancelBtn = document.getElementById('btn-cancel-prod');

    if (addTrigger && modal) {
        addTrigger.addEventListener('click', () => {
            resetProductForm();
            document.getElementById('product-modal-title').textContent = "Ajouter un nouveau produit";
            modal.style.display = 'flex';
        });
    }

    const closeModal = () => { if (modal) modal.style.display = 'none'; };
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    // Soumission du formulaire d'ajout / édition
    const form = document.getElementById('product-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const prodId = document.getElementById('edit-prod-id').value;
            const nom = document.getElementById('prod-nom').value.trim();
            const categorie = document.getElementById('prod-categorie').value;
            const prix = Number(document.getElementById('prod-prix').value);
            const caution = Number(document.getElementById('prod-caution').value);
            const disponibilite = document.getElementById('prod-disponibilite').value;
            const etat = document.getElementById('prod-etat').value;
            const description = document.getElementById('prod-description').value.trim();

            const productObj = {
                nom,
                categorie,
                prix,
                caution,
                disponibilite,
                etat,
                description,
                photo: base64Photo || null
            };

            if (prodId) {
                // Modification d'un produit existant
                const existing = allProducts.find(p => p.id === Number(prodId));
                productObj.id = Number(prodId);
                productObj.locationsCount = existing ? (existing.locationsCount || 0) : 0;
                await db.updateProduit(productObj);
                alert("Produit mis à jour dans l'inventaire. 🌸");
            } else {
                // Nouvel ajout
                productObj.locationsCount = 0;
                await db.addProduit(productObj);
                alert("Nouveau produit ajouté avec succès au catalogue. ✨");
            }

            closeModal();
            await fetchAndRenderProducts();
        });
    }
}

// Appliquer les filtres instantanés de recherche
function applyFilters() {
    const searchVal = (document.getElementById('produits-search-input')?.value || '').toLowerCase().trim();
    const catVal = document.getElementById('filter-prod-category')?.value || 'Tous';
    const statusVal = document.getElementById('filter-prod-status')?.value || 'Tous';

    filteredProducts = allProducts.filter(p => {
        const matchesSearch = p.nom.toLowerCase().includes(searchVal) || p.description.toLowerCase().includes(searchVal);
        const matchesCategory = catVal === 'Tous' || p.categorie === catVal;
        const matchesStatus = statusVal === 'Tous' || p.disponibilite === statusVal;

        return matchesSearch && matchesCategory && matchesStatus;
    });

    renderProductCards();
}

// Générer le code HTML de chaque carte produit
function renderProductCards() {
    const grid = document.getElementById('produits-cards-grid');
    if (!grid) return;

    if (filteredProducts.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px; color: var(--text-muted);">
                <i class="fa-solid fa-boxes-packing" style="font-size: 3rem; margin-bottom: 15px; color: var(--primary-rose-dark); display: block;"></i>
                Aucun produit ne correspond à vos filtres. Ajoutez-en un nouveau !
            </div>
        `;
        return;
    }

    grid.innerHTML = filteredProducts.map(p => {
        let badgeClass = 'badge-success';
        if (p.disponibilite === 'Loué') badgeClass = 'badge-danger';
        if (p.disponibilite === 'Indisponible') badgeClass = 'badge-warning';

        return `
            <div class="product-card">
                <div class="product-img-wrapper">
                    ${p.photo 
                        ? `<img src="${p.photo}" class="product-img" alt="${p.nom}">`
                        : `<div class="product-no-img">
                                <i class="fa-solid fa-image"></i>
                                <span>Aucun aperçu</span>
                           </div>`
                    }
                    <span class="product-tag badge ${badgeClass}">${p.disponibilite}</span>
                </div>
                <div class="product-content">
                    <span class="product-category">${p.categorie}</span>
                    <h4 class="product-title">${p.nom}</h4>
                    <p class="product-desc">${p.description || 'Aucune description fournie.'}</p>
                    
                    <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; justify-content: space-between; margin-top: 5px;">
                        <span>État : <strong>${p.etat}</strong></span>
                        <span>Caution : <strong>${p.caution.toLocaleString()} DA</strong></span>
                    </div>

                    <div class="product-meta-row">
                        <span class="product-price">${p.prix.toLocaleString()} <span>DA / Location</span></span>
                        <span class="product-stats-badge">
                            <i class="fa-solid fa-heart"></i> ${p.locationsCount || 0} locs
                        </span>
                    </div>

                    <div style="display: flex; gap: 8px; margin-top: 15px; padding-top: 10px; border-top: 1px solid rgba(0,0,0,0.03);">
                        <button class="btn btn-secondary edit-product-btn" data-id="${p.id}" style="flex: 1; padding: 8px 12px; font-size: 0.75rem;"><i class="fa-solid fa-pen-to-square"></i> Modifier</button>
                        <button class="btn btn-secondary delete-product-btn" data-id="${p.id}" style="color: var(--color-danger); border-color: rgba(194, 24, 91, 0.1); padding: 8px 12px; font-size: 0.75rem;" title="Supprimer de l'inventaire"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Brancher les boutons d'édition et de suppression
    document.querySelectorAll('.edit-product-btn').forEach(btn => btn.addEventListener('click', (e) => editProduct(e.currentTarget.dataset.id)));
    document.querySelectorAll('.delete-product-btn').forEach(btn => btn.addEventListener('click', (e) => deleteProduct(e.currentTarget.dataset.id)));
}

// Pré-remplir la modale avec un produit existant pour édition
async function editProduct(id) {
    const prod = await db.getProduit(id);
    if (!prod) return;

    resetProductForm();
    
    document.getElementById('edit-prod-id').value = prod.id;
    document.getElementById('prod-nom').value = prod.nom;
    document.getElementById('prod-categorie').value = prod.categorie;
    document.getElementById('prod-prix').value = prod.prix;
    document.getElementById('prod-caution').value = prod.caution;
    document.getElementById('prod-disponibilite').value = prod.disponibilite;
    document.getElementById('prod-etat').value = prod.etat;
    document.getElementById('prod-description').value = prod.description || '';

    // Gérer l'aperçu de l'image
    if (prod.photo) {
        base64Photo = prod.photo;
        const previewImg = document.getElementById('prod-preview-img');
        previewImg.src = prod.photo;
        document.getElementById('prod-upload-box').style.display = 'none';
        document.getElementById('prod-preview-box').style.display = 'block';
    }

    document.getElementById('product-modal-title').textContent = "Modifier le produit";
    document.getElementById('product-modal').style.display = 'flex';
}

// Supprimer un produit de la base
async function deleteProduct(id) {
    const confirmation = confirm("Êtes-vous sûre de vouloir supprimer définitivement cet article de l'inventaire ? Les commandes associées ne seront pas affectées.");
    if (confirmation) {
        await db.deleteProduit(id);
        await fetchAndRenderProducts();
    }
}

// Remise à zéro complète de la modale de produit
function resetProductForm() {
    document.getElementById('edit-prod-id').value = '';
    document.getElementById('product-form').reset();
    base64Photo = '';
    document.getElementById('prod-upload-box').style.display = 'flex';
    document.getElementById('prod-preview-box').style.display = 'none';
    document.getElementById('prod-preview-img').src = '';
    document.getElementById('ai-image-prompt').value = '';
    document.getElementById('ai-generation-loader').style.display = 'none';
}

// Gérer l'upload d'images locales
function setupLocalPhotoUpload() {
    const box = document.getElementById('prod-upload-box');
    const fileInput = document.getElementById('prod-file-input');
    const previewBox = document.getElementById('prod-preview-box');
    const previewImg = document.getElementById('prod-preview-img');
    const removeBtn = document.getElementById('btn-prod-remove-preview');

    box.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleImageFile(file);
    });

    removeBtn.addEventListener('click', () => {
        base64Photo = '';
        previewBox.style.display = 'none';
        box.style.display = 'flex';
        fileInput.value = '';
    });

    function handleImageFile(file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            base64Photo = event.target.result;
            previewImg.src = base64Photo;
            box.style.display = 'none';
            previewBox.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

// Gérer la génération d'illustrations IA premium avec Gemini
function setupAIImageGenerator() {
    const generateBtn = document.getElementById('btn-generate-ai-img');
    const promptInput = document.getElementById('ai-image-prompt');
    const sizeSelect = document.getElementById('ai-image-size');
    const loader = document.getElementById('ai-generation-loader');

    const previewBox = document.getElementById('prod-preview-box');
    const previewImg = document.getElementById('prod-preview-img');
    const uploadBox = document.getElementById('prod-upload-box');

    if (!generateBtn) return;

    generateBtn.addEventListener('click', async () => {
        const prompt = promptInput.value.trim();
        const size = sizeSelect.value;

        if (!prompt) {
            alert("Veuillez saisir une description de l'image à générer.");
            promptInput.focus();
            return;
        }

        // Afficher le chargeur et bloquer le bouton
        loader.style.display = 'block';
        generateBtn.disabled = true;

        try {
            // Appeler notre serveur local pour la génération d'image
            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, size })
            });

            const result = await response.json();

            if (result.success && result.base64Image) {
                // Succès ! On encode au format base64 complet de type data:image/png;base64
                base64Photo = `data:image/png;base64,${result.base64Image}`;
                previewImg.src = base64Photo;
                uploadBox.style.display = 'none';
                previewBox.style.display = 'block';
                alert("L'illustration de luxe a été générée avec succès et associée au produit ! 🌸");
            } else {
                alert("Erreur de génération d'image : " + (result.error || "Réponse invalide du serveur."));
            }
        } catch (err) {
            console.error("Échec de l'appel API Image", err);
            alert("Impossible de contacter le service de génération d'images. Assurez-vous que le serveur tourne.");
        } finally {
            loader.style.display = 'none';
            generateBtn.disabled = false;
        }
    });
}
