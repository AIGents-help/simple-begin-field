import React, { useState, useEffect, useRef } from 'react';
import { Video, Upload, Download, Trash2, AlertCircle, Loader2, FileVideo } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

interface HomeInventoryVideoProps {
  packetId: string;
  propertyRecordId: string;
  scope: string;
}

interface VideoDoc {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  created_at: string;
}

const MAX_SIZE = 500 * 1024 * 1024;

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const HomeInventoryVideo: React.FC<HomeInventoryVideoProps> = ({ packetId, propertyRecordId, scope }) => {
  const [videos, setVideos] = useState<VideoDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchVideos = async () => {
    const { data, error: fetchErr } = await supabase
      .from('documents')
      .select('id, file_name, file_path, file_size, created_at')
      .eq('packet_id', packetId)
      .eq('related_table', 'real_estate_records')
      .eq('related_record_id', propertyRecordId)
      .eq('category', 'home_inventory_video');

    if (fetchErr) {
      console.error('Error fetching videos:', fetchErr);
    } else {
      setVideos(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVideos();
  }, [packetId, propertyRecordId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_SIZE) {
      setError('Video must be under 500MB');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setError(null);
    setUploading(true);
    setUploadProgress(10);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required');

      const safeFileName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${packetId}/real_estate/${propertyRecordId}/videos/${Date.now()}_${safeFileName}`;

      setUploadProgress(25);

      const { error: uploadErr } = await supabase.storage
        .from('packet-documents')
        .upload(storagePath, selectedFile, { cacheControl: '3600', upsert: true });

      if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`);

      setUploadProgress(70);

      const { error: dbErr } = await supabase
        .from('documents')
        .insert({
          packet_id: packetId,
          related_table: 'real_estate_records',
          related_record_id: propertyRecordId,
          scope,
          section_key: 'real_estate',
          category: 'home_inventory_video',
          file_name: selectedFile.name,
          file_path: storagePath,
          mime_type: selectedFile.type,
          file_size: selectedFile.size,
          uploaded_by: user.id,
          is_private: true,
        });

      if (dbErr) throw new Error(`Database insert failed: ${dbErr.message}`);

      setUploadProgress(100);
      toast.success('Video uploaded successfully', { duration: 3000, position: 'bottom-center' });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchVideos();
    } catch (err: any) {
      toast.error(err.message || 'Upload failed', { duration: 5000, position: 'bottom-center' });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = async (video: VideoDoc) => {
    const { data, error: urlErr } = await supabase.storage
      .from('packet-documents')
      .createSignedUrl(video.file_path, 3600);

    if (urlErr || !data?.signedUrl) {
      toast.error(`Download failed: ${urlErr?.message || 'Could not generate URL'}`, { duration: 5000, position: 'bottom-center' });
      return;
    }
    window.open(data.signedUrl, '_blank');
  };

  const handleDelete = async (video: VideoDoc) => {
    if (!confirm(`Delete "${video.file_name}"? This cannot be undone.`)) return;
    setDeletingId(video.id);

    try {
      const { error: storageErr } = await supabase.storage
        .from('packet-documents')
        .remove([video.file_path]);
      if (storageErr) console.warn('Storage delete warning:', storageErr);

      const { error: dbErr } = await supabase
        .from('documents')
        .delete()
        .eq('id', video.id);

      if (dbErr) throw new Error(`Delete failed: ${dbErr.message}`);

      toast.success('Video deleted', { duration: 3000, position: 'bottom-center' });
      await fetchVideos();
    } catch (err: any) {
      toast.error(err.message || 'Delete failed', { duration: 5000, position: 'bottom-center' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500">Home Inventory Video</h3>

      {/* Prompt Card */}
      <div className="p-5 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Video size={20} />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-sm text-navy-muted">Home Inventory Video</p>
            <p className="text-xs text-stone-500 leading-relaxed">
              Walk through each room and narrate what you own. Insurance companies require video documentation to process fire, theft, or flood claims. Store one video per property here.
            </p>
            <p className="text-[10px] text-stone-400 italic leading-relaxed">
              Tip: Open every drawer, closet, and cabinet. State brand names and approximate values aloud.
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/avi,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {selectedFile && !uploading && (
          <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 rounded-lg border border-stone-200">
            <FileVideo size={14} className="text-navy-muted shrink-0" />
            <span className="text-xs text-navy-muted font-medium truncate">{selectedFile.name}</span>
            <span className="text-[10px] text-stone-400 shrink-0">{formatSize(selectedFile.size)}</span>
          </div>
        )}

        {uploading && (
          <div className="space-y-1.5">
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-[10px] text-stone-400 font-bold text-center">{uploadProgress}% uploading…</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-500 text-xs font-bold px-1">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1 py-2.5 bg-stone-100 text-navy-muted rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
          >
            <Upload size={14} />
            {selectedFile ? 'Change File' : 'Select Video'}
          </button>
          {selectedFile && !uploading && (
            <button
              onClick={handleUpload}
              className="flex-1 py-2.5 bg-navy-muted text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Upload size={14} />
              Upload Video
            </button>
          )}
        </div>
      </div>

      {/* Video List */}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="animate-spin text-stone-400" size={20} />
        </div>
      ) : (
        videos.map(video => (
          <div key={video.id} className="p-4 bg-white rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                <FileVideo size={20} />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-navy-muted truncate">{video.file_name}</p>
                <p className="text-[10px] text-stone-400 font-bold uppercase">
                  {formatSize(video.file_size)} · {new Date(video.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => handleDownload(video)}
                className="p-2 hover:bg-stone-100 rounded-lg text-navy-muted transition-colors"
                title="Download"
              >
                <Download size={16} />
              </button>
              <button
                onClick={() => handleDelete(video)}
                disabled={deletingId === video.id}
                className="p-2 hover:bg-red-50 rounded-lg text-stone-400 hover:text-red-500 transition-colors disabled:opacity-50"
                title="Delete"
              >
                {deletingId === video.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
