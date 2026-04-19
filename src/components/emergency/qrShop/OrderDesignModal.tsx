import React, { useState } from 'react';
import { X, ExternalLink, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { QrDesign, ProductType, PRINTIFY_SHOP_URL } from './qrShopDesigns';
import { QrDesignPreview } from './QrDesignPreview';
import { downloadDesignPng } from './downloadDesign';

interface Props {
  design: QrDesign;
  emergencyUrl: string;
  onClose: () => void;
}

export const OrderDesignModal: React.FC<Props> = ({ design, emergencyUrl, onClose }) => {
  const [selected, setSelected] = useState<ProductType>(design.availableProducts[0]);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadDesignPng(design, emergencyUrl);
      toast.success('Design downloaded', { duration: 3000, position: 'bottom-center' });
    } catch (e: any) {
      toast.error(e.message || 'Failed to download', { duration: 5000, position: 'bottom-center' });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-stone-900">Order {design.name}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200">
            <X size={16} className="text-stone-500" />
          </button>
        </div>

        <div className="flex justify-center">
          <QrDesignPreview design={design} emergencyUrl={emergencyUrl} scale={1.1} />
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Product</p>
          <div className="flex flex-wrap gap-2">
            {design.availableProducts.map((p) => (
              <button
                key={p}
                onClick={() => setSelected(p)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                  selected === p
                    ? 'bg-navy-muted text-white border-navy-muted'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <a
          href={PRINTIFY_SHOP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 bg-navy-muted text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-navy-muted/90 transition-colors"
        >
          🛍️ Shop Now — Opens Printify <ExternalLink size={14} />
        </a>
        <p className="text-[11px] text-stone-500 text-center -mt-2">Orders fulfilled by Printify. Ships directly to you.</p>

        <button
          onClick={handleDownload}
          disabled={downloading}
          className="w-full text-xs font-bold text-stone-600 hover:text-navy-muted transition-colors flex items-center justify-center gap-1.5 py-1"
        >
          {downloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
          Download design instead →
        </button>
      </div>
    </div>
  );
};
