import React, { useState } from 'react';
import { TemplateGallery } from './TemplateGallery';
import { TemplateEditor } from './TemplateEditor';

export const TemplatesScreen: React.FC = () => {
  const [active, setActive] = useState<{ type: string; draftId?: string } | null>(null);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {active ? (
        <TemplateEditor
          templateType={active.type}
          draftId={active.draftId}
          onBack={() => setActive(null)}
        />
      ) : (
        <TemplateGallery onOpenTemplate={(type, draftId) => setActive({ type, draftId })} />
      )}
    </div>
  );
};
