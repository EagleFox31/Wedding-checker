import React, { useState } from 'react';
import { Upload, AlertCircle, CheckCircle, Database, Copy, ChevronDown, ChevronUp, FileSpreadsheet, Download, RefreshCw, CalendarRange } from 'lucide-react';
import { Guest } from '../types';
import * as guestService from '../services/guestService';
import * as planningService from '../services/planningService';
// @ts-ignore
import * as XLSX from 'xlsx';

interface AdminPanelProps {
  onClose: () => void;
  guests: Guest[];
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, guests: currentGuests }) => {
  const [inputText, setInputText] = useState('');
  const [parsedGuests, setParsedGuests] = useState<Guest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isResettingPlanning, setIsResettingPlanning] = useState(false);

  // Stats pour le rapport
  const total = currentGuests.length;
  const arrived = currentGuests.filter(g => g.hasArrived).length;
  const absent = currentGuests.filter(g => g.isAbsent).length;
  const pending = total - arrived - absent;

  // Parser intelligent pour le format spécifique:
  // Colonnes: Table | Nom | Prénom | Mention
  const parseData = () => {
    try {
      const lines = inputText.trim().split('\n');
      
      // Détection automatique du séparateur (Tab pour Excel, ou Point-virgule/Virgule)
      let separator = '\t'; // Par défaut copier-coller Excel
      if (lines[0].includes(';')) separator = ';';
      else if (lines[0].includes(',') && !lines[0].includes('\t')) separator = ',';

      const guests: Guest[] = lines.map((line, index) => {
        const parts = line.split(separator).map(p => p.trim());
        
        // Ignorer les lignes vides
        if (parts.length < 2 || !parts[0]) return null; 

        // Ignorer la ligne d'en-tête si présente
        if (index === 0 && (parts[0].toLowerCase().includes('table') || parts[1].toLowerCase().includes('nom'))) {
            return null;
        }

        // MAPPING DES COLONNES
        // Index 0: Table (ex: "1:BENEDICTION") -> Table "1", Nom "BENEDICTION"
        // Index 1: Nom (ex: "BAYEMI")
        // Index 2: Prénom (ex: "Christiane")
        // Index 3: Mention (ex: "Invité par...") -> inviter

        let rawTable = parts[0];
        const lastName = parts[1] || 'Inconnu';
        const firstName = parts[2] || '';
        const mention = parts[3] || '';

        // Logique spéciale pour extraire le nom de la table du numéro
        // ex: "1:BENEDICTION" -> Table: "1", Name: "BENEDICTION"
        let tableNumber = rawTable;
        let tableName = '';

        if (rawTable.includes(':')) {
            const split = rawTable.split(':');
            tableNumber = split[0].trim();
            tableName = split[1].trim();
        } else if (rawTable.includes('-')) {
             // Au cas où le format soit 1-BENEDICTION
            const split = rawTable.split('-');
            // Vérifier si la première partie est un chiffre
            if (!isNaN(Number(split[0].trim()))) {
                tableNumber = split[0].trim();
                tableName = split[1].trim();
            }
        }

        return {
          id: `g_${Date.now()}_${index}`,
          firstName: firstName,
          lastName: lastName,
          tableNumber: tableNumber,
          tableName: tableName, // Nouveau champ pour le nom de la table
          inviter: mention || 'Serge & Christiane',
          description: '', // On laisse la description vide pour des notes manuelles futures
          hasArrived: false,
          isAbsent: false,
          plusOne: false
        };
      }).filter(g => g !== null) as Guest[];

      if (guests.length === 0) {
        setError("Aucun invité détecté. Vérifiez que vous avez bien copié les données.");
      } else {
        setParsedGuests(guests);
        setError(null);
      }
    } catch (e) {
      setError("Erreur de format. Vérifiez vos données.");
    }
  };

  const handleUpload = async () => {
    setIsUploading(true);
    try {
      await guestService.uploadGuestList(parsedGuests);
      alert('Liste importée avec succès !');
      onClose();
      window.location.reload();
    } catch (e) {
      setError("Erreur lors de l'upload vers Firebase.");
      console.error(e);
    } finally {
      setIsUploading(false);
    }
  };

  const handleResetPlanning = async () => {
      if (!window.confirm("Ceci va écraser tout le planning actuel avec le programme officiel de Christiane & Serge. Continuer ?")) {
          return;
      }
      setIsResettingPlanning(true);
      try {
          await planningService.overwritePlanningWithDefaults();
          alert("Planning mis à jour avec succès !");
          window.location.reload();
      } catch (e) {
          alert("Erreur lors de la mise à jour");
          console.error(e);
      } finally {
          setIsResettingPlanning(false);
      }
  };

  const downloadExcel = () => {
    // 1. Préparer les données
    const data = currentGuests.map(g => ({
        "Nom": g.lastName,
        "Prénom": g.firstName,
        "Table (N°)": g.tableNumber,
        "Table (Nom)": g.tableName || '',
        "Statut": g.hasArrived ? 'Présent' : g.isAbsent ? 'Absent' : 'Non venu',
        "Heure d'arrivée": g.arrivedAt ? new Date(g.arrivedAt).toLocaleTimeString('fr-FR') : '-',
        "Invité par": g.inviter,
        "Note": g.description || ''
    }));

    // 2. Créer une feuille de calcul (Worksheet)
    const worksheet = XLSX.utils.json_to_sheet(data);

    // 3. Ajuster la largeur des colonnes
    const wscols = [
        {wch: 20}, // Nom
        {wch: 20}, // Prénom
        {wch: 10}, // Table N
        {wch: 20}, // Table Nom
        {wch: 15}, // Statut
        {wch: 15}, // Heure
        {wch: 15}, // Invité par
        {wch: 30}  // Note
    ];
    worksheet['!cols'] = wscols;

    // 4. Créer le classeur (Workbook)
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Mariage");

    // 5. Générer le fichier et déclencher le téléchargement
    XLSX.writeFile(workbook, `Rapport_Serge_Christiane_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const copySummary = () => {
      const summary = `*Rapport Mariage Serge & Christiane*\n\nTotal Invités : ${total}\n✅ Présents : ${arrived}\n❌ Absents : ${absent}\n⏳ En attente : ${pending}\n\nLien App: ${window.location.origin}`;
      navigator.clipboard.writeText(summary);
      alert('Résumé copié dans le presse-papier !');
  };

  return (
    <div className="absolute inset-0 bg-slate-50 z-50 flex flex-col animate-in slide-in-from-bottom-10 duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-slate-200">
        <h2 className="font-serif text-xl font-bold text-slate-800">Administration</h2>
        <button onClick={onClose} className="text-slate-500 font-medium text-sm">Fermer</button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pb-20">

        {/* SECTION CONFIGURATION */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-8 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <CalendarRange size={20} className="text-blue-600" />
                Configuration du Programme
            </h3>
            <p className="text-xs text-slate-500 mb-4">
                Si les étapes du mariage ne s'affichent pas correctement ou ont changé.
            </p>
             <button 
                onClick={handleResetPlanning}
                disabled={isResettingPlanning}
                className="w-full flex items-center justify-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-colors text-blue-700 font-bold text-xs"
            >
                {isResettingPlanning ? <RefreshCw className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                Recharger le Programme Officiel (Christiane & Serge)
            </button>
        </div>

        {/* SECTION RAPPORT (FIN EVENT) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-8 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <FileSpreadsheet size={20} className="text-emerald-600" />
                Rapports & Clôture
            </h3>
            <p className="text-xs text-slate-500 mb-4">
                Exportez les données finales de l'événement pour analyser les présences et les heures d'arrivée.
            </p>

            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={downloadExcel}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-emerald-50 border border-emerald-100 rounded-xl hover:bg-emerald-100 transition-colors"
                >
                    <Download size={24} className="text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-800">Télécharger Excel</span>
                </button>
                <button 
                    onClick={copySummary}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors"
                >
                    <Copy size={24} className="text-slate-600" />
                    <span className="text-xs font-bold text-slate-800">Copier Résumé</span>
                </button>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-xs text-slate-400">
                <span>Présents: <b>{arrived}</b></span>
                <span>Absents: <b>{absent}</b></span>
                <span>Total: <b>{total}</b></span>
            </div>
        </div>
        
        <hr className="border-slate-200 mb-8" />

        {/* SECTION IMPORTATION */}
        <div className="opacity-80 hover:opacity-100 transition-opacity">
            <div className="mb-2">
            <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                <Upload size={18} />
                Importer une nouvelle liste
            </h3>
            <p className="text-xs text-slate-500 mb-3">
                Format: <b>N°Table:NomTable</b>, Nom, Prénom, Mention.
                <br/>
                Ex: <code>1:BENEDICTION</code>
            </p>
            
            <textarea
                className="w-full h-32 p-3 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none mb-3 whitespace-pre"
                placeholder={`1:BENEDICTION\tBAYEMI\tChristiane\tChristiane\n2\tDUPONT\tJean\tSerge`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
            />

            <button
                onClick={parseData}
                className="w-full py-2 bg-slate-800 text-white rounded-lg font-medium text-sm hover:bg-slate-700 transition-colors mb-4"
            >
                Prévisualiser les données
            </button>
            </div>

            {/* Step 3: Preview & Confirm */}
            {error && (
            <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm flex items-center gap-2 mb-4">
                <AlertCircle size={16} />
                {error}
            </div>
            )}

            {parsedGuests.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-20">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase">{parsedGuests.length} Invités détectés</span>
                </div>
                <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 sticky top-0 shadow-sm">
                    <tr>
                        <th className="px-3 py-2 bg-slate-50">Nom Prénom</th>
                        <th className="px-3 py-2 bg-slate-50">Table</th>
                        <th className="px-3 py-2 bg-slate-50">Mention</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {parsedGuests.map((g, i) => (
                        <tr key={i}>
                        <td className="px-3 py-2">
                            <span className="font-bold">{g.lastName}</span> {g.firstName}
                        </td>
                        <td className="px-3 py-2">
                            <span className="font-mono bg-slate-100 px-1 rounded">{g.tableNumber}</span>
                            {g.tableName && <div className="text-[9px] text-slate-400 font-bold">{g.tableName}</div>}
                        </td>
                        <td className="px-3 py-2 text-slate-400 truncate max-w-[100px]">{g.inviter}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
                
                <div className="p-4 border-t border-slate-100 bg-slate-50">
                <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-600 active:scale-95 transition-all flex justify-center items-center gap-2"
                >
                    {isUploading ? (
                    <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></span>
                    ) : (
                    <>
                        <CheckCircle size={20} />
                        Valider et Enregistrer
                    </>
                    )}
                </button>
                <p className="text-[10px] text-center text-slate-400 mt-2">
                    Ceci remplacera la liste actuelle.
                </p>
                </div>
            </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;