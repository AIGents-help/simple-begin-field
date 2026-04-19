import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { QR_DESIGNS, PRODUCT_FILTERS, ProductType, QrDesign } from './qrShopDesigns';
import { QrDesignPreview } from './QrDesignPreview';
import { OrderDesignModal } from './OrderDesignModal';

interface Props {
  emergencyUrl: string;
  onClose: () => void;
}

export const QrShopSheet: React.FC<Props> = ({ emergencyUrl, onClose }) => {
  const [filter, setFilter] = useState<'All' | ProductType>('All');
  const [orderDesign, setOrderDesign] = useState<QrDesign | null>(null);

  const visible = useMemo(
    () => filter === 'All' ? QR_DESIGNS : QR_DESIGNS.filter(d => d.availableProducts.includes(filter)),
    [filter]
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-stone-50 w-full sm:max-w-2xl h-[92vh] sm:h-[88vh] sm:rounded-2xl rounded-t-3xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 bg-white border-b border-stone-200">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-navy-muted">QR Card Shop</h2>
              <p className="text-xs text-stone-500 mt-0.5">Your emergency QR code, on something worth keeping.</p>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 shrink-0">
              <X size={18} className="text-stone-500" />
            </button>
          </div>

          {/* Filter pills */}
          <div className="flex gap-2 mt-4 overflow-x-auto -mx-5 px-5 pb-1 no-scrollbar">
            {PRODUCT_FILTERS.map((p) => (
              <button
                key={p}
                onClick={() => setFilter(p)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                  filter === p
                    ? 'bg-navy-muted text-white border-navy-muted'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-4">
            {visible.map((design) => (
              <div key={design.id} className="bg-white rounded-2xl border border-stone-200 p-3 flex flex-col gap-2">
                <div className="flex justify-center bg-stone-50 rounded-lg p-2 min-h-[120px] items-center overflow-hidden">
                  <div style={{ transform: 'scale(0.75)', transformOrigin: 'center' }}>
                    <QrDesignPreview design={design} emergencyUrl={emergencyUrl} />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-navy-muted leading-tight">{design.name}</p>
                  <span className="inline-block px-2 py-0.5 bg-stone-100 rounded-full text-[10px] font-bold uppercase tracking-wider text-stone-600">
                    {design.product}
                  </span>
                </div>
                <button
                  onClick={() => setOrderDesign(design)}
                  className="mt-1 w-full py-2 bg-navy-muted text-white rounded-lg text-xs font-bold hover:bg-navy-muted/90 transition-colors"
                >
                  Order this →
                </button>
              </div>
            ))}
          </div>
        </div>

        {orderDesign && (
          <OrderDesignModal
            design={orderDesign}
            emergencyUrl={emergencyUrl}
            onClose={() => setOrderDesign(null)}
          />
        )}
      </div>
    </div>
  );
};
