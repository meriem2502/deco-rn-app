/* js/calendar.js - Moteur de rendu du calendrier d'occupation des boxes et valises */

import { db } from './database.js';
import { initUILayout } from './ui.js';

let currentDate = new Date();
let selectedDate = new Date();
let allCommandes = [];

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialiser le Layout global
    await initUILayout();

    // 2. Récupérer toutes les commandes de locations
    allCommandes = await db.getAllCommandes();

    // 3. Dessiner le calendrier pour le mois actuel
    renderCalendar();

    // 4. Écouter les switchers de mois
    setupNavigation();

    // 5. Sélectionner par défaut le jour d'aujourd'hui et charger ses tâches
    selectDay(new Date());
});

function setupNavigation() {
    const prevBtn = document.getElementById('btn-prev-month');
    const nextBtn = document.getElementById('btn-next-month');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }
}

// Fonction principale pour calculer et afficher le calendrier
function renderCalendar() {
    const daysGrid = document.getElementById('calendar-days-grid');
    const label = document.getElementById('current-month-year-label');
    if (!daysGrid || !label) return;

    daysGrid.innerHTML = '';

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Définir le libellé du mois en cours
    const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    label.textContent = `${monthNames[month]} ${year}`;

    // Trouver le premier jour du mois (0 = Dimanche, 1 = Lundi, etc.)
    const firstDayIndex = new Date(year, month, 1).getDay();
    // Ajuster l'index pour que Lundi soit 0, Dimanche soit 6
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    // Trouver le nombre total de jours dans le mois
    const totalDays = new Date(year, month + 1, 0).getDate();

    // 1. Générer les cellules vides d'espacement de début
    for (let i = 0; i < adjustedFirstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        daysGrid.appendChild(emptyCell);
    }

    // 2. Générer les cellules de chaque jour du mois
    for (let day = 1; day <= totalDays; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        
        const dateObj = new Date(year, month, day);
        const dateStr = dateObj.toISOString().split('T')[0];

        // Ajouter le numéro du jour
        dayCell.innerHTML = `<span class="day-num">${day}</span>`;

        // Compter les locations actives pour cette journée
        const activeRentals = getRentalsForDate(dateObj);

        if (activeRentals.length > 0) {
            // Ajouter un indicateur visuel (pastille d'activité)
            const dot = document.createElement('span');
            dot.className = 'day-indicator';
            
            // Si l'un des retards est présent ce jour-là, colorer en rouge de retard
            const hasLate = activeRentals.some(r => r.statut === 'Retard');
            if (hasLate) {
                dot.style.background = 'var(--color-danger)';
            } else {
                dot.style.background = 'var(--primary-rose-dark)';
            }
            dayCell.appendChild(dot);
        }

        // Mettre en évidence la date du jour système réel
        const today = new Date();
        if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayCell.classList.add('today');
        }

        // Mettre en évidence le jour sélectionné par l'utilisateur
        if (day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear()) {
            dayCell.classList.add('selected');
        }

        // Événement clic
        dayCell.addEventListener('click', () => {
            // Retirer l'ancienne sélection graphique
            document.querySelectorAll('.calendar-day.selected').forEach(c => c.classList.remove('selected'));
            dayCell.classList.add('selected');
            
            selectedDate = dateObj;
            selectDay(dateObj);
        });

        daysGrid.appendChild(dayCell);
    }
}

// Récupérer les commandes qui chevauchent ou coïncident avec la date donnée
function getRentalsForDate(date) {
    const checkDateStr = date.toISOString().split('T')[0];

    return allCommandes.filter(cmd => {
        // La location est active si la date se situe entre dateSortie et dateRetour inclusivement
        return checkDateStr >= cmd.dateSortie && checkDateStr <= cmd.dateRetour;
    });
}

// Mettre à jour le panneau de droite en fonction du jour cliqué
function selectDay(date) {
    const title = document.getElementById('selected-date-title');
    const list = document.getElementById('selected-day-events-list');
    if (!title || !list) return;

    const formatted = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    title.textContent = formatted;

    const rentals = getRentalsForDate(date);

    if (rentals.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 50px 20px; color: var(--text-muted);">
                <i class="fa-solid fa-calendar-minus" style="font-size: 2.2rem; margin-bottom: 12px; opacity: 0.5; color: var(--primary-rose-dark); display: block;"></i>
                Aucun article loué ou réservé pour cette journée.
            </div>
        `;
        return;
    }

    list.innerHTML = rentals.map(r => {
        const isSortie = r.dateSortie === date.toISOString().split('T')[0];
        const isRetour = r.dateRetour === date.toISOString().split('T')[0];

        let typeLabel = "En cours de location";
        let typeClass = "ongoing";
        
        if (isSortie) {
            typeLabel = "Début de location (Sortie)";
            typeClass = "start-rent";
        } else if (isRetour) {
            typeLabel = "Fin de location (Retour)";
            typeClass = "end-rent";
        }

        return `
            <div class="schedule-event-card ${typeClass}">
                <div class="event-meta">
                    <span class="event-type-pill">${typeLabel}</span>
                    <span class="event-status">${r.statut}</span>
                </div>
                <h5 class="event-title">${r.clientNom}</h5>
                <p class="event-desc">
                    <i class="fa-solid fa-box-open" style="margin-right: 5px;"></i> ${r.produitNom} (${r.categorie})
                </p>
                <div class="event-time-row">
                    <span><i class="fa-solid fa-phone"></i> ${r.clientTel}</span>
                    <span>Reste: <strong style="${r.reste > 0 ? 'color: var(--primary-rose-dark);' : ''}">${r.reste.toLocaleString()} DA</strong></span>
                </div>
            </div>
        `;
    }).join('');
}
