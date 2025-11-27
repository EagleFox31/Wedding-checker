import React from 'react';
import { X, Copy, QrCode } from 'lucide-react';

interface ShareQrModalProps {
  onClose: () => void;
}

const ShareQrModal: React.FC<ShareQrModalProps> = ({ onClose }) => {
  // Construct the URL with the special mode parameter
  const guestUrl = `${window.location.origin}${window.location.pathname}?mode=guest`;
  
  // Use a reliable public API for QR generation to avoid heavy dependencies
  // Using QR Server API or similar
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(guestUrl)}&color=002366&bgcolor=FFFFFF&margin=10`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(guestUrl);
    alert('Lien copié !');
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative">
        
        {/* Close Button */}
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors z-10"
        >
            <X size={20} className="text-slate-500" />
        </button>

        <div className="p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-800 rounded-full flex items-center justify-center mb-4 ring-8 ring-blue-50/50">
                <QrCode size={32} />
            </div>

            <h2 className="font-serif text-2xl font-bold text-slate-900 mb-2">
                Accès Invités
            </h2>
            <p className="text-sm text-slate-500 mb-6 px-4">
                Faites scanner ce code aux invités pour qu'ils accèdent directement à leur espace (Programme & Table) sans voir les accès administrateurs.
            </p>

            {/* QR Code Image */}
            <div className="bg-white p-2 rounded-xl shadow-lg border border-slate-100 mb-6">
                <img 
                    src={qrCodeUrl} 
                    alt="QR Code Accès Invité" 
                    className="w-48 h-48 object-contain rounded-lg"
                    loading="lazy"
                />
            </div>

            {/* URL Display & Copy */}
            <div className="w-full bg-slate-50 rounded-xl p-3 flex items-center justify-between border border-slate-100 mb-4">
                <span className="text-[10px] text-slate-400 truncate max-w-[200px] font-mono select-all">
                    {guestUrl}
                </span>
                <button 
                    onClick={copyToClipboard}
                    className="p-2 bg-white rounded-lg shadow-sm border border-slate-200 text-slate-600 hover:text-blue-600 active:scale-95 transition-all"
                >
                    <Copy size={14} />
                </button>
            </div>

            <button 
                onClick={onClose}
                className="text-sm font-bold text-slate-400 hover:text-slate-600"
            >
                Fermer
            </button>
        </div>
      </div>
    </div>
  );
};

export default ShareQrModal;