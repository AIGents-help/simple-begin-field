import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { UserScope } from '../../config/types';

export const ScopeToggle = () => {
  const { activeScope, setScope, userMode, personA, personB } = useAppContext();

  if (userMode === 'single') return null;

  const scopes: { id: UserScope; label: string }[] = [
    { id: 'personA', label: personA.charAt(0) },
    { id: 'personB', label: personB.charAt(0) },
    { id: 'shared', label: 'Shared' },
  ];

  return (
    <div className="flex bg-stone-200/50 p-1 rounded-full w-fit mx-auto mb-6 sticky top-[76px] z-20 backdrop-blur-sm">
      {scopes.map((s) => (
        <button
          key={s.id}
          onClick={() => setScope(s.id)}
          className={`scope-pill ${activeScope === s.id ? 'scope-pill-active' : 'text-stone-500'}`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
};
