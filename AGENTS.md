# Instructions de développement pour DECO RN ADMIN

## Objectif
Maintenir et faire évoluer l'application web de gestion de location de coffrets de mariage/fiançailles "DECO RN ADMIN" pour Nadjla.

## Directives Techniques Principales
1. **Architecture Locale & Hors-ligne (PWA)** :
   - Toutes les données métier (clients, produits, contrats de location, statistiques, configurations) doivent être stockées localement dans **IndexedDB** via la classe `Database` de `/js/database.js`.
   - L'application doit fonctionner de manière fluide hors-ligne (géré par le Service Worker `/service-worker.js`).
   - Ne jamais introduire de base de données distante SQL/NoSQL externe sans l'accord de l'administratrice.

2. **Design Thématique (Frosted Glass)** :
   - Conserver l'élégance "Frosted Glass" (effets de flou d'arrière-plan, bordures semi-transparentes blanches, ombres douces et dégradés raffinés or, or blanc et rose poudré).
   - Utiliser des icônes de la librairie Font Awesome (déjà intégrée).

3. **Intégration de l'IA (Gemini)** :
   - Les appels IA (Chatbot d'administration et Générateur d'images de produits) doivent obligatoirement être passés de façon sécurisée par le serveur Express (`/server.ts`).
   - Le chatbot de la barre d'interface extrait en temps réel les données d'IndexedDB pour fournir des insights financiers et opérationnels pertinents à Nadjla.
