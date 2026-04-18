import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Mail, 
  Calendar, 
  CreditCard, 
  Package, 
  Users, 
  Activity,
  Shield,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye
} from 'lucide-react';
import { StatusPill } from './DashboardComponents';
import { AssignPlanModal } from './AssignPlanModal';
import { DownloadPacketButton } from '../download/DownloadPacketButton';
import { supabase } from '@/integrations/supabase/client';

interface DetailPanelProps {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({ title, children, onClose }) => {
  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
        <h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wider">{title}</h3>
        {onClose && (
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

interface CustomerDetailProps {
  customer: any;
  onClose: () => void;
  onViewPacket?: (packet: any) => void;
}

export const CustomerDetail: React.FC<CustomerDetailProps> = ({ customer, onClose, onViewPacket }) => {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [livePurchase, setLivePurchase] = useState<any>(customer.purchases?.[0] || null);
  const [loadingPacket, setLoadingPacket] = useState(false);

  const handlePlanAssigned = (next: { plan_key: string; plan_name: string; status: string }) => {
    // Update the billing summary inline without page refresh
    setLivePurchase({
      ...(livePurchase || {}),
      status: next.status,
      pricing_plans: { ...(livePurchase?.pricing_plans || {}), name: next.plan_name, plan_key: next.plan_key },
    });
  };

  const handleViewPacket = async () => {
    const packetStub = customer.packets?.[0];
    if (!packetStub) return;
    if (!onViewPacket) return;
    setLoadingPacket(true);
    try {
      // Fetch full packet record so PacketDetail can render
      const { data, error } = await supabase
        .from('packets')
        .select(`
          *,
          profiles ( full_name, email ),
          packet_members ( user_id, role )
        `)
        .eq('id', packetStub.id)
        .maybeSingle();
      if (error) throw error;
      if (data) onViewPacket(data);
    } catch (err) {
      console.error('Failed to load packet:', err);
    } finally {
      setLoadingPacket(false);
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={onClose} className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Customers
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <DetailPanel title="Account Overview">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 font-serif italic text-3xl">
                {customer.full_name?.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-serif italic text-stone-900">{customer.full_name}</h2>
                <p className="text-stone-500">{customer.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <StatusPill status="Active Account" type="success" />
                  <span className="text-xs text-stone-400">Joined {new Date(customer.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">User ID</p>
                <p className="text-sm font-mono text-stone-600">{customer.id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Role</p>
                <p className="text-sm text-stone-900 capitalize">{customer.role}</p>
              </div>
            </div>
          </DetailPanel>

          <DetailPanel title="Packet Summary">
            {customer.packets?.[0] ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg border border-stone-100">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-stone-400" />
                    <div>
                      <p className="text-sm font-medium text-stone-900">{customer.packets[0].title || 'The Survivor Packet'}</p>
                      <p className="text-xs text-stone-400 uppercase tracking-wider">{customer.packets[0].household_mode} Mode</p>
                    </div>
                  </div>
                  <button
                    onClick={handleViewPacket}
                    disabled={loadingPacket}
                    className="flex items-center gap-1.5 px-3 py-2 min-h-[36px] text-xs font-bold text-stone-900 hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {loadingPacket ? 'Loading...' : 'View Packet'}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 border border-stone-100 rounded-lg text-center">
                    <p className="text-lg font-semibold text-stone-900">45%</p>
                    <p className="text-[10px] text-stone-400 uppercase tracking-wider">Completion</p>
                  </div>
                  <div className="p-4 border border-stone-100 rounded-lg text-center">
                    <p className="text-lg font-semibold text-stone-900">12</p>
                    <p className="text-[10px] text-stone-400 uppercase tracking-wider">Documents</p>
                  </div>
                  <div className="p-4 border border-stone-100 rounded-lg text-center">
                    <p className="text-lg font-semibold text-stone-900">2</p>
                    <p className="text-[10px] text-stone-400 uppercase tracking-wider">Members</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-stone-400 italic text-sm">
                No packet created yet.
              </div>
            )}
          </DetailPanel>
        </div>

        <div className="space-y-6">
          <DetailPanel title="Billing Summary">
            {livePurchase ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-500">Current Plan</span>
                  <span className="text-sm font-medium text-stone-900">{livePurchase.pricing_plans?.name || 'Free'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-500">Status</span>
                  <StatusPill status={livePurchase.status || 'free'} type={livePurchase.status === 'canceled' ? 'error' : 'success'} />
                </div>
                <div className="pt-4 border-t border-stone-100 space-y-2">
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="w-full py-2 min-h-[40px] border border-stone-200 rounded-lg text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
                  >
                    Assign Plan Manually
                  </button>
                  <button className="w-full flex items-center justify-center gap-2 py-2 min-h-[40px] bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800 transition-colors">
                    <ExternalLink className="w-3 h-3" />
                    View in Stripe
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-stone-400 italic mb-4">No active subscription</p>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="w-full py-2 min-h-[40px] border border-stone-200 rounded-lg text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  Assign Plan Manually
                </button>
              </div>
            )}
          </DetailPanel>

          <DetailPanel title="Referral Info">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-500">Affiliate</span>
                <span className="text-sm font-medium text-stone-900">DAVE10</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-500">Discount Used</span>
                <span className="text-sm text-stone-900">10% Off</span>
              </div>
            </div>
          </DetailPanel>
        </div>
      </div>

      <AssignPlanModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        customer={{
          id: customer.id,
          full_name: customer.full_name,
          email: customer.email,
          role: customer.role,
          purchases: livePurchase ? [livePurchase] : [],
        }}
        onSuccess={handlePlanAssigned}
      />
    </div>
  );
};

export const PacketDetail: React.FC<{ packet: any; onClose: () => void }> = ({ packet, onClose }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={onClose} className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Packets
        </button>
        <DownloadPacketButton
          variant="settings"
          packetId={packet.id}
          label="Download Packet (Admin Copy)"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <DetailPanel title="Packet Details">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-serif italic text-stone-900">{packet.title}</h2>
                <p className="text-stone-500 text-sm">Created on {new Date(packet.created_at).toLocaleDateString()}</p>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Household Mode</p>
                  <div className="flex items-center gap-2">
                    <StatusPill status={packet.household_mode} type={packet.household_mode === 'couple' ? 'success' : 'info'} />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Owner</p>
                  <p className="text-sm text-stone-900">{packet.profiles?.full_name}</p>
                </div>
              </div>
            </div>
          </DetailPanel>

          <DetailPanel title="Section Completion">
            <div className="space-y-4">
              {['Identity', 'Financial', 'Legal', 'Medical', 'Digital', 'Final Wishes'].map((section) => (
                <div key={section} className="flex items-center gap-4">
                  <span className="text-sm text-stone-600 w-24">{section}</span>
                  <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div className="h-full bg-stone-900 rounded-full" style={{ width: `${Math.random() * 100}%` }} />
                  </div>
                  <span className="text-xs font-medium text-stone-900 w-8 text-right">45%</span>
                </div>
              ))}
            </div>
          </DetailPanel>
        </div>

        <div className="space-y-6">
          <DetailPanel title="Household Members">
            <div className="space-y-4">
              {packet.packet_members?.map((member: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 text-xs font-medium">
                      {member.role === 'owner' ? 'O' : 'P'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-stone-900">Member {i + 1}</p>
                      <p className="text-[10px] text-stone-400 uppercase tracking-wider">{member.role}</p>
                    </div>
                  </div>
                  <Shield className="w-4 h-4 text-stone-300" />
                </div>
              ))}
            </div>
          </DetailPanel>

          <DetailPanel title="Document Summary">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-500">Total Documents</span>
                <span className="font-medium text-stone-900">12</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-500">Private Items</span>
                <span className="font-medium text-stone-900">4</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-500">Storage Used</span>
                <span className="font-medium text-stone-900">2.4 MB</span>
              </div>
            </div>
          </DetailPanel>
        </div>
      </div>
    </div>
  );
};

export const AffiliateDetail: React.FC<{ affiliate: any; onClose: () => void }> = ({ affiliate, onClose }) => {
  return (
    <div className="space-y-6">
      <button onClick={onClose} className="flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Affiliates
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <DetailPanel title="Affiliate Profile">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 rounded-full bg-stone-900 flex items-center justify-center text-white font-serif italic text-3xl">
                {affiliate.affiliate_name?.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-serif italic text-stone-900">{affiliate.affiliate_name}</h2>
                <p className="text-stone-500">{affiliate.affiliate_email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <StatusPill status={affiliate.is_active ? 'Active' : 'Inactive'} type={affiliate.is_active ? 'success' : 'error'} />
                  <code className="px-2 py-0.5 bg-stone-100 rounded text-xs font-mono text-stone-600">{affiliate.affiliate_code}</code>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Payout Model</p>
                <p className="text-sm text-stone-900">
                  {affiliate.payout_type === 'percent' ? `${affiliate.payout_value}% per sale` : `$${affiliate.payout_value} flat fee`}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Customer Discount</p>
                <p className="text-sm text-stone-900">
                  {affiliate.customer_discount_type === 'percent' ? `${affiliate.customer_discount_value}% Off` : `$${affiliate.customer_discount_value} Off`}
                </p>
              </div>
            </div>
          </DetailPanel>

          <DetailPanel title="Conversions Timeline">
            <div className="space-y-4">
              {affiliate.affiliate_conversions?.length > 0 ? (
                affiliate.affiliate_conversions.map((conv: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-stone-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center">
                        <Activity className="w-4 h-4 text-stone-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-stone-900">Conversion: {conv.conversion_status}</p>
                        <p className="text-xs text-stone-400">{new Date(conv.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <StatusPill status={conv.conversion_status} type="success" />
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-stone-400 italic text-sm">
                  No conversions recorded yet.
                </div>
              )}
            </div>
          </DetailPanel>
        </div>

        <div className="space-y-6">
          <DetailPanel title="Performance Summary">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-500">Total Referrals</span>
                <span className="text-sm font-medium text-stone-900">{affiliate.affiliate_conversions?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-500">Total Earnings</span>
                <span className="text-sm font-medium text-stone-900">$0.00</span>
              </div>
              <div className="pt-4 border-t border-stone-100">
                <button className="w-full py-2 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800 transition-colors">
                  Generate Payout
                </button>
              </div>
            </div>
          </DetailPanel>

          <DetailPanel title="Referral Link">
            <div className="space-y-4">
              <p className="text-xs text-stone-500">Share this link with the affiliate:</p>
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-100 break-all">
                <code className="text-[10px] text-stone-600">
                  {window.location.origin}/signup?ref={affiliate.affiliate_code}
                </code>
              </div>
              <button className="w-full py-2 border border-stone-200 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-50 transition-colors">
                Copy Link
              </button>
            </div>
          </DetailPanel>
        </div>
      </div>
    </div>
  );
};
