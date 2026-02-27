# Foodbook Setup

## 🚀 Erste Schritte

### 1. Alte Datenbank löschen
Da sich das Datenbankschema geändert hat, muss die alte Datenbank gelöscht werden:

```bash
# Im server-Verzeichnis
cd server
rm foodbook.db  # oder manuell löschen
```

### 2. Dependencies installieren

```bash
# Root-Verzeichnis
npm install

# Oder separat:
cd client && npm install
cd ../server && npm install
```

### 3. Seed-Daten laden

```bash
cd server
npm run seed
```

Dies erstellt:
- **12 Speisen** (Suppen, Hauptgerichte, Desserts)
- **5 Menüs** (Klassisch, Fisch, Vegan, Italienisch, Premium)
- **5 Test-Benutzer** + Admin-User
- Alle verfügbar für heute, morgen und übermorgen

### 4. Anwendung starten

```bash
# Im Root-Verzeichnis
npm run dev
```

Dies startet:
- **Server** auf http://localhost:3001
- **Client** auf http://localhost:5173

## 👤 Login-Daten

**Admin-Zugang:**
- Username: `admin`
- Password: `admin`

## 📋 Menü-System

### Für Admins/Manager:

1. **Speisen verwalten** (Tab "Speisen"):
   - Einzelne Speisen erstellen
   - Name, Beschreibung, Preis
   - Verfügbare Daten auswählen

2. **Menüs erstellen** (Tab "Menüs"):
   - Menü-Name und Beschreibung
   - 3 Speisen auswählen (Speise 1, 2, 3)
   - Gesamtpreis festlegen
   - Verfügbare Daten auswählen

### Für Kunden:

1. **Menüs ansehen**:
   - Datum auswählen
   - Verfügbare Menüs werden angezeigt
   - Jedes Menü zeigt alle 3 Speisen

2. **Bestellen**:
   - Anmelden erforderlich
   - Menü in Warenkorb legen
   - Mehrere Menüs möglich
   - Bestellung aufgeben

## 🎨 Features

- ✅ Material-UI Design
- ✅ Responsive (Mobile & Desktop)
- ✅ QR-Code Login
- ✅ Benutzerverwaltung
- ✅ Bestellübersicht
- ✅ Menü-System (3 Speisen pro Menü)
- ✅ Keine Kategorien mehr

## 🛠 Technologie-Stack

**Frontend:**
- React + TypeScript
- Material-UI (MUI)
- Vite

**Backend:**
- Bun Runtime
- SQLite
- REST API

## 🚂 Railway Deployment

### Volume für persistente Datenbank einrichten

1. **Volume erstellen:**
   - Öffne dein Railway-Projekt
   - Drücke `⌘K` (Command Palette) oder Rechtsklick auf Canvas
   - Wähle "Create Volume"
   - Wähle deinen Service aus
   - Mount Path: `/data`

2. **Umgebungsvariable setzen:**
   - Gehe zu deinem Service → Variables
   - Füge hinzu: `DATABASE_PATH=/data/foodbook.db`

3. **Automatische Variablen:**
   Railway stellt automatisch bereit:
   - `RAILWAY_VOLUME_NAME` - Name des Volumes
   - `RAILWAY_VOLUME_MOUNT_PATH` - Mount-Pfad (z.B. `/data`)

### Wichtig:
- Das Volume wird beim Container-Start gemountet (nicht beim Build)
- Daten im Volume bleiben bei Deployments erhalten
- Das Seed-Script ist idempotent - existierende Daten werden nicht überschrieben
- Admin/Test-User werden bei Bedarf automatisch angelegt

## 📝 Hinweise

- Speisen können in mehreren Menüs verwendet werden
- Menüs bestehen immer aus genau 3 Speisen
- Beim Bestellen werden die 3 Speisen automatisch aufgelöst
- Kategorien gibt es nicht mehr - Speisen sind generisch
