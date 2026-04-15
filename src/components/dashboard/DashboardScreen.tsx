import React, { useEffect, useState } from 'react';
import { PacketCompletionScore } from './PacketCompletionScore';
import { CheckInBanner } from '../checkin/CheckInBanner';
import { 
  CheckCircle2, 
  Clock, 
  Plus, 
  Lock,
  Loader2,
  ChevronRight,
  FileText,
  Download,
  ShieldCheck
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { SECTIONS_CONFIG } from '../../config/sectionsConfig';
import { sectionService } from '../../services/sectionService';
import { DownloadPacketButton } from '../download/DownloadPacketButton';

export const DashboardScreen = () => {
  const { setView, setTab, currentPacket, userDisplayName, view } = useAppContext();
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentPacket && view === 'dashboard') {
      fetchStats();
    }
  }, [currentPacket, view]);

  const fetchStats = async () => {
    if (!currentPacket) return;
    setLoading(true);
    try {
      const { data } = await sectionService.getCompletionStats(currentPacket.id);
      setStats(data || []);
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const getSectionStat = (sectionId: string) => {
    const sectionStats = stats.filter(s => s.section_key === sectionId);
    if (sectionStats.length === 0) return { status: 'empty', count: 0, percentage: 0 };

    const totalRecords = sectionStats.reduce((acc, s) => acc + (s.record_count || 0), 0);
    
    const completeCount = sectionStats.filter(s => s.status === 'complete' || s.status === 'not_applicable').length;
    const allComplete = completeCount === sectionStats.length && sectionStats.length > 0;
    const anyInProgress = sectionStats.some(s => s.status === 'in_progress');
    const anyComplete = sectionStats.some(s => s.status === 'complete');

    let status = 'empty';
    if (allComplete) status = 'complete';
    else if (anyInProgress || anyComplete || totalRecords > 0) status = 'in_progress';

    const percentage = sectionStats.length > 0 
      ? Math.round((completeCount / sectionStats.length) * 100) 
      : 0;

    return { status, count: totalRecords, percentage };
  };

  const overallProgress = stats.length > 0 
    ? Math.round((stats.filter(s => s.status === 'complete' || s.status === 'not_applicable').length / stats.length) * 100) 
    : 0;

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'complete':
        return (
          <span className="px-2 py-0.5 bg-emerald-100/50 text-emerald-700 text-[9px] font-bold uppercase tracking-wider rounded border border-emerald-200/50">
            Complete
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2 py-0.5 bg-amber-100/50 text-amber-700 text-[9px] font-bold uppercase tracking-wider rounded border border-amber-200/50">
            In Progress
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 bg-stone-200/50 text-stone-500 text-[9px] font-bold uppercase tracking-wider rounded border border-stone-300/50">
            Empty
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-navy-muted mb-4" size={32} />
        <p className="text-stone-500 text-sm">Securing your vault...</p>
      </div>
    );
  }

  return (
    <div className="p-6 pb-32 space-y-8 max-w-6xl mx-auto">
      {/* Check-In Banner */}
      <CheckInBanner />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-serif font-bold text-navy-muted">Your Survivor Packet</h1>
            <span className="px-2 py-1 bg-navy-muted/5 text-navy-muted text-[10px] font-bold uppercase tracking-widest rounded-full border border-navy-muted/10">
              {overallProgress}% Complete
            </span>
          </div>
          <p className="text-stone-500 text-sm">Hello, {userDisplayName.split(' ')[0]}. Welcome to your secure document hub.</p>
        </div>
        <button 
          onClick={() => setView('sections')}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-navy-muted text-white rounded-xl font-bold shadow-lg shadow-navy-muted/20 hover:bg-navy-muted/90 active:scale-95 transition-all"
        >
          <Plus size={18} />
          Add Document
        </button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-navy-muted transition-all duration-1000 ease-out" 
            style={{ width: `${overallProgress}%` }} 
          />
        </div>
      </div>

      {/* Packet Completion Score */}
      {currentPacket && <PacketCompletionScore packetId={currentPacket.id} />}

      {/* Section Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
        {SECTIONS_CONFIG.map((section) => {
          const { status, count, percentage } = getSectionStat(section.id);
          const Icon = section.icon;
          const isPrivate = section.id === 'private';
          const isComplete = status === 'complete';
          const isInProgress = status === 'in_progress';
          const isEmpty = status === 'empty';

          // Tab styling based on completion
          let tabStyle = "bg-[#E6D590] text-stone-600"; // Default manila-dark
          if (isComplete) {
            tabStyle = "bg-[#d1e7dd] text-emerald-700"; // Subtle green tint
          } else if (isInProgress) {
            tabStyle = "bg-[#fff3cd] text-amber-700"; // Subtle amber tint
          } else if (isEmpty) {
            tabStyle = "bg-stone-200 text-stone-500"; // Muted gray
          }

          return (
            <div key={section.id} className="relative pt-8 group">
              {/* Folder Tab */}
              <div 
                className={`absolute top-0 left-0 h-8 w-[45%] rounded-t-lg border-t border-x border-folder-edge flex items-center px-3 justify-between transition-colors duration-200 z-0 ${tabStyle}`}
              >
                <span className="text-[9px] font-bold uppercase tracking-wider truncate mr-1">
                  {section.label}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  {isPrivate ? (
                    <Lock size={10} />
                  ) : (
                    <span className="text-[9px] font-bold">{percentage}%</span>
                  )}
                  {isComplete && <CheckCircle2 size={10} />}
                </div>
              </div>

              {/* Folder Body */}
              <button
                onClick={() => { setView('sections'); setTab(section.id); }}
                className={`relative w-full text-left bg-[#F5F0E8] p-6 rounded-tr-2xl rounded-bl-2xl rounded-br-2xl border border-folder-edge shadow-sm group-hover:shadow-md group-hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between h-44 z-10`}
              >
                <div className="flex justify-between items-start">
                  <div className={`p-3 rounded-xl bg-white/60 text-navy-muted border border-folder-edge/20 shadow-inner`}>
                    <Icon size={24} />
                  </div>
                  <StatusBadge status={status} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif font-bold text-lg text-navy-muted">{section.label}</h3>
                    <ChevronRight size={18} className="text-stone-400 group-hover:text-navy-muted transition-colors" />
                  </div>
                  <div className="flex items-center gap-1.5 text-stone-500 text-xs font-medium">
                    <FileText size={14} />
                    <span>{count} {count === 1 ? 'record' : 'records'}</span>
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Download My Packet Banner */}
      <div className="bg-gradient-to-br from-teal-50 to-emerald-50/60 border border-teal-200/60 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <ShieldCheck size={24} className="text-teal-700" />
        </div>
        <div className="flex-1 space-y-1">
          <h3 className="text-base font-serif font-bold text-navy-muted">Your Data, Always Yours</h3>
          <p className="text-sm text-stone-500 leading-relaxed">
            Download a complete copy of your Survivor Packet anytime &mdash; all your information and documents in one ZIP file.
          </p>
        </div>
        <DownloadPacketButton />
      </div>

      {/* Footer / Connection Status */}
      <div className="pt-8 flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-stone-400">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <Clock size={14} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Connected to Supabase Secure Vault</span>
        </div>
      </div>
    </div>
  );
};
