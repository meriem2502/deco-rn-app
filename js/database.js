/* js/database.js - Classe d'abstraction IndexedDB pour DECO RN ADMIN */

class Database {
    constructor() {
        this.dbName = 'DecoRnAdminDB';
        this.version = 2; // Incremented version to ensure fresh migrations
        this.db = null;
    }

    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = (e) => {
                console.error("Erreur de chargement de la base de données", e);
                reject(e);
            };

            request.onsuccess = (e) => {
                this.db = e.target.result;
                console.log("IndexedDB initialisée avec succès 🌸");
                resolve(this.db);
            };

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                console.log("Migration de la base de données...");

                // 1. Table des Commandes (Reservations)
                if (!db.objectStoreNames.contains('commandes')) {
                    const store = db.createObjectStore('commandes', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('by_date', 'dateReservation', { unique: false });
                    store.createIndex('by_client', 'clientNom', { unique: false });
                }

                // 2. Table des Produits (Catalogue d'articles)
                if (!db.objectStoreNames.contains('produits')) {
                    const store = db.createObjectStore('produits', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('by_categorie', 'categorie', { unique: false });
                }

                // 3. Table des Clientes (Suivi de contact)
                if (!db.objectStoreNames.contains('clientes')) {
                    const store = db.createObjectStore('clientes', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('by_telephone', 'telephone', { unique: true });
                }

                // 4. Table de Configuration / Paramètres
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }

                // Initialiser les données de démo par défaut si c'est une nouvelle base
                const transaction = e.target.transaction;
                this.seedInitialData(db, transaction);
            };
        });
    }

    // Données fictives initiales de qualité professionnelle pour Nadjla
    seedInitialData(db, transaction) {
        console.log("Seeding des données par défaut...");
        
        // 1. Seed Produits
        const prodStore = transaction.objectStore('produits');
        const defaultProducts = [
            { id: 1, nom: "Box Fiançaille Royal", categorie: "Box Fiançaille", prix: 15000, caution: 5000, disponibilite: "Disponible", etat: "Excellent", description: "Magnifique coffret royal orné de velours et de bordures dorées.", locationsCount: 14, photo: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400&h=300&fit=crop" },
            { id: 2, nom: "Valise Mariée Rose Poudré", categorie: "Valises", prix: 8000, caution: 3000, disponibilite: "Disponible", etat: "Très Bon", description: "Valise capitonnée de luxe, couleur rose poudré avec détails dorés.", locationsCount: 8, photo: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&h=300&fit=crop" },
            { id: 3, nom: "Parure Accessoires Dorés", categorie: "Accessoires", prix: 4000, caution: 1500, disponibilite: "Disponible", etat: "Excellent", description: "Ensemble de bijoux et accessoires raffinés pour fiançailles.", locationsCount: 22, photo: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=300&fit=crop" },
            { id: 4, nom: "Trône Henné Traditionnel", categorie: "Mariage", prix: 35000, caution: 10000, disponibilite: "Disponible", etat: "Excellent", description: "Superbe trône sculpté à la main, idéal pour les cérémonies de henné.", locationsCount: 5, photo: "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop" }
        ];
        defaultProducts.forEach(p => prodStore.put(p));

        // 2. Seed Clientes
        const clientStore = transaction.objectStore('clientes');
        const defaultClients = [
            { id: 1, nom: "Amira Bendis", telephone: "0555123456", adresse: "Alger Centre", facebook: "Amira Bds", instagram: "@amira_bds", locationsCount: 3, totalPaye: 38000, remarques: "Excellente cliente, rend le matériel toujours propre." },
            { id: 2, nom: "Sarah Kerrouche", telephone: "0661987654", adresse: "Kouba, Alger", facebook: "Sarah K.", instagram: "@sarah_kerr", locationsCount: 1, totalPaye: 8000, remarques: "Retard fréquent sur les retours, appeler la veille." },
            { id: 3, nom: "Yasmine Belka", telephone: "0770456123", adresse: "Hydra, Alger", facebook: "Yasmine Belkacem", instagram: "@yas_belka", locationsCount: 2, totalPaye: 12000, remarques: "Demande souvent une réduction, mais très agréable." }
        ];
        defaultClients.forEach(c => clientStore.put(c));

        // 3. Seed Commandes (Reservations)
        const commStore = transaction.objectStore('commandes');
        
        // Obtenir des dates dynamiques autour de la date d'aujourd'hui
        const today = new Date();
        const dateStr = (offset) => {
            const d = new Date();
            d.setDate(today.getDate() + offset);
            return d.toISOString().split('T')[0];
        };

        const defaultCommandes = [
            {
                id: 1,
                clientNom: "Amira Bendis",
                clientTel: "0555123456",
                clientAdresse: "Alger Centre",
                produitId: 1,
                produitNom: "Box Fiançaille Royal",
                categorie: "Box Fiançaille",
                dateReservation: dateStr(-1),
                dateSortie: dateStr(0),
                dateRetour: dateStr(3),
                prix: 15000,
                montantPaye: 15000,
                reste: 0,
                caution: 5000,
                modePaiement: "Espèces",
                statut: "Sorti", // En cours d'utilisation
                remarques: "Livrée à midi en mains propres."
            },
            {
                id: 2,
                clientNom: "Sarah Kerrouche",
                clientTel: "0661987654",
                clientAdresse: "Kouba, Alger",
                produitId: 2,
                produitNom: "Valise Mariée Rose Poudré",
                categorie: "Valises",
                dateReservation: dateStr(-5),
                dateSortie: dateStr(-4),
                dateRetour: dateStr(-1), // Retard
                prix: 8000,
                montantPaye: 5500,
                reste: 2500,
                caution: 3000,
                modePaiement: "CCP",
                statut: "Retard",
                remarques: "N'a pas répondu au téléphone hier pour le retour."
            },
            {
                id: 3,
                clientNom: "Yasmine Belka",
                clientTel: "0770456123",
                clientAdresse: "Hydra, Alger",
                produitId: 3,
                produitNom: "Parure Accessoires Dorés",
                categorie: "Accessoires",
                dateReservation: dateStr(2),
                dateSortie: dateStr(5),
                dateRetour: dateStr(8),
                prix: 4000,
                montantPaye: 2000,
                reste: 2000,
                caution: 1500,
                modePaiement: "BaridiMob",
                statut: "Réservé",
                remarques: "Acompte payé par BaridiMob."
            }
        ];
        defaultCommandes.forEach(co => commStore.put(co));

        // 4. Seed Settings
        const settingsStore = transaction.objectStore('settings');
        settingsStore.put({ key: 'enterprise_name', value: 'DECO RN' });
        settingsStore.put({ key: 'admin_password', value: 'Nadjla2026' }); // Default password
        settingsStore.put({ key: 'phone', value: '0550 12 34 56' });
        settingsStore.put({ key: 'facebook', value: 'Deco RN' });
        settingsStore.put({ key: 'instagram', value: '@deco_rn_alger' });
        settingsStore.put({ key: 'tiktok', value: '@deco_rn_mariage' });
        settingsStore.put({ key: 'logo', value: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=120&h=120&fit=crop' });
    }

    // --- OPERATIONS SUR LES COMMANDES ---
    getAllCommandes() {
        return this.getAll('commandes');
    }

    getCommande(id) {
        return this.get('commandes', id);
    }

    addCommande(commande) {
        return this.add('commandes', commande);
    }

    updateCommande(commande) {
        return this.put('commandes', commande);
    }

    deleteCommande(id) {
        return this.delete('commandes', id);
    }

    // --- OPERATIONS SUR LES PRODUITS ---
    getAllProduits() {
        return this.getAll('produits');
    }

    getProduit(id) {
        return this.get('produits', id);
    }

    addProduit(produit) {
        return this.add('produits', produit);
    }

    updateProduit(produit) {
        return this.put('produits', produit);
    }

    deleteProduit(id) {
        return this.delete('produits', id);
    }

    // --- OPERATIONS SUR LES CLIENTES ---
    getAllClientes() {
        return this.getAll('clientes');
    }

    getCliente(id) {
        return this.get('clientes', id);
    }

    addCliente(cliente) {
        return this.add('clientes', cliente);
    }

    updateCliente(cliente) {
        return this.put('clientes', cliente);
    }

    deleteCliente(id) {
        return this.delete('clientes', id);
    }

    // --- OPERATIONS SUR LES PARAMETRES ---
    getSetting(key) {
        return new Promise((resolve) => {
            if (!this.db) {
                resolve(null);
                return;
            }
            const tx = this.db.transaction('settings', 'readonly');
            const store = tx.objectStore('settings');
            const req = store.get(key);
            req.onsuccess = () => resolve(req.result ? req.result.value : null);
            req.onerror = () => resolve(null);
        });
    }

    setSetting(key, value) {
        return this.put('settings', { key, value });
    }

    // --- HELPERS GENERIQUES ---
    get(storeName, id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const req = store.get(Number(id));
            req.onsuccess = () => resolve(req.result);
            req.onerror = (e) => reject(e);
        });
    }

    getAll(storeName) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = (e) => reject(e);
        });
    }

    add(storeName, item) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const req = store.add(item);
            req.onsuccess = () => resolve(req.result);
            req.onerror = (e) => reject(e);
        });
    }

    put(storeName, item) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const req = store.put(item);
            req.onsuccess = () => resolve(req.result);
            req.onerror = (e) => reject(e);
        });
    }

    delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const req = store.delete(Number(id));
            req.onsuccess = () => resolve(true);
            req.onerror = (e) => reject(e);
        });
    }

    // Importation d'une sauvegarde complète JSON
    async importBackup(data) {
        try {
            if (data.settings) {
                for (const key of Object.keys(data.settings)) {
                    await this.setSetting(key, data.settings[key]);
                }
            }
            if (data.produits) {
                const tx = this.db.transaction('produits', 'readwrite');
                const store = tx.objectStore('produits');
                await store.clear();
                for (const p of data.produits) {
                    await store.put(p);
                }
            }
            if (data.clientes) {
                const tx = this.db.transaction('clientes', 'readwrite');
                const store = tx.objectStore('clientes');
                await store.clear();
                for (const c of data.clientes) {
                    await store.put(c);
                }
            }
            if (data.commandes) {
                const tx = this.db.transaction('commandes', 'readwrite');
                const store = tx.objectStore('commandes');
                await store.clear();
                for (const co of data.commandes) {
                    await store.put(co);
                }
            }
            return true;
        } catch (error) {
            console.error("Erreur lors de l'importation de la sauvegarde", error);
            throw error;
        }
    }

    // Exportation complète au format JSON
    async exportBackup() {
        const payload = {
            exportDate: new Date().toISOString(),
            settings: {},
            produits: await this.getAll('produits'),
            clientes: await this.getAll('clientes'),
            commandes: await this.getAll('commandes')
        };

        const settingsKeys = ['enterprise_name', 'admin_password', 'phone', 'facebook', 'instagram', 'tiktok', 'logo'];
        for (const k of settingsKeys) {
            payload.settings[k] = await this.getSetting(k);
        }

        return JSON.stringify(payload, null, 2);
    }
}

// Singleton global de base de données
export const db = new Database();
export default Database;
