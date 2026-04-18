import React from 'react';
import { Shield } from 'lucide-react';
import { MedicalCardShell, MedicalSection, daysUntil, expiryTone } from './MedicalCardShell';
import { medicalService, MedicalRecord } from '@/services/medicalService';

const INS_TYPES = ['Health','Dental','Vision','Mental Health','Supplemental','Medicare','Medicaid','Other'];

interface Props {
  record: MedicalRecord;
  packetId: string;
  scope: string;
  expanded: boolean;
  onToggle: () => void;
  onSaved: (saved: MedicalRecord, prevDraftId?: string) => void;
  onDeleted: (id: string) => void;
  onCancelDraft: (id: string) => void;
  onFindPro: (query: string) => void;
}

export const HealthInsuranceCard: React.FC<Props> = ({
  record, packetId, scope, expanded, onToggle, onSaved, onDeleted, onCancelDraft, onFindPro,
}) => {
  const sections: MedicalSection[] = [
    {
      id: 'basic',
      label: 'Plan Details',
      fields: [
        { name: 'insurance_type', label: 'Insurance type', type: 'select', options: INS_TYPES },
        { name: 'insurance_provider', label: 'Provider name', type: 'text', topLevel: true },
        { name: 'plan_name', label: 'Plan name' },
        { name: 'insurance_member_id', label: 'Member ID', type: 'masked', topLevel: true },
        { name: 'insurance_group_number', label: 'Group number', topLevel: true },
        { name: 'primary_insured_name', label: 'Primary insured' },
        { name: 'dependents_covered', label: 'Dependents covered', type: 'textarea', rows: 2 },
      ],
    },
    {
      id: 'costs',
      label: 'Costs & Coverage',
      fields: [
        { name: 'deductible_individual', label: 'Deductible — individual', type: 'number' },
        { name: 'deductible_family', label: 'Deductible — family', type: 'number' },
        { name: 'oop_max', label: 'Out-of-pocket max', type: 'number' },
        { name: 'copay_primary', label: 'Copay — primary' },
        { name: 'copay_specialist', label: 'Copay — specialist' },
        { name: 'copay_urgent_care', label: 'Copay — urgent care' },
        { name: 'copay_er', label: 'Copay — ER' },
      ],
    },
    {
      id: 'contacts',
      label: 'Contact Numbers & Portal',
      fields: [
        { name: 'preauth_phone', label: 'Pre-authorization phone', type: 'tel' },
        { name: 'claims_phone', label: 'Claims phone', type: 'tel' },
        { name: 'insurance_phone', label: 'Member services phone', type: 'tel', topLevel: true },
        { name: 'portal_url', label: 'Online portal URL' },
        { name: 'portal_username_hint', label: 'Username hint' },
      ],
    },
    {
      id: 'dates',
      label: 'Dates',
      fields: [
        { name: 'effective_date', label: 'Effective date', type: 'date' },
        { name: 'expiry_date', label: 'Renewal / open enrollment', type: 'date', topLevel: true },
        { name: 'notes', label: 'Notes', type: 'textarea', topLevel: true },
      ],
    },
  ];

  return (
    <MedicalCardShell
      record={record}
      packetId={packetId}
      scope={scope}
      expanded={expanded}
      onToggle={onToggle}
      title={record.insurance_provider || (record.details as any)?.insurance_type ? `${(record.details as any)?.insurance_type || 'Insurance'} — ${record.insurance_provider || ''}`.trim().replace(/—\s*$/, '') : 'New Health Insurance'}
      icon={<Shield size={18} />}
      documentCategory="health-insurance"
      sections={sections}
      findProCta={{ label: 'Need health insurance? Find a Health Insurance Broker', onClick: () => onFindPro('Health Insurance Broker') }}
      buildSummary={(d: MedicalRecord) => {
        const out: { label: string; tone?: string }[] = [];
        if ((d.details as any)?.insurance_type) out.push({ label: (d.details as any).insurance_type });
        if (d.insurance_member_id) out.push({ label: `••${String(d.insurance_member_id).slice(-4)}` });
        const days = daysUntil(d.expiry_date);
        if (days !== null) {
          out.push({ label: `Renews ${d.expiry_date}`, tone: expiryTone(days) });
        }
        return out;
      }}
      onSave={(data) => medicalService.upsert({ ...data, record_type: 'insurance', insurance_renewal_date: data.expiry_date || data.insurance_renewal_date || null })}
      onDelete={(id) => medicalService.remove(id)}
      onSaved={onSaved}
      onDeleted={onDeleted}
      onCancelDraft={onCancelDraft}
    />
  );
};
