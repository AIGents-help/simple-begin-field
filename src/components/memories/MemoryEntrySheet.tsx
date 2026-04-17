import React, { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAppContext } from '@/context/AppContext';
import { MEMORY_TYPE_BY_ID, type MemoryEntryType } from '@/config/memoryTypes';
import { Loader2, Trash2, Upload, Plus, X, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  memory: any | null;
  entryType: MemoryEntryType | null;
  onSaved: () => void;
}

const MAX_VIDEO = 500 * 1024 * 1024; // 500 MB
const MAX_IMG = 25 * 1024 * 1024;    // 25 MB
const MAX_AUDIO = 100 * 1024 * 1024; // 100 MB

export const MemoryEntrySheet: React.FC<Props> = ({ isOpen, onClose, memory, entryType, onSaved }) => {
  const { currentPacket } = useAppContext();
  const effectiveType: MemoryEntryType | null = (memory?.entry_type as MemoryEntryType) || entryType;
  const meta = effectiveType ? MEMORY_TYPE_BY_ID[effectiveType] : null;

  const [title, setTitle] = useState('');
  const [recipient, setRecipient] = useState('');
  const [content, setContent] = useState('');
  const [dateWritten, setDateWritten] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [bucketItems, setBucketItems] = useState<{ id?: string; item_text: string; completed: boolean }[]>([]);
  const [albumPhotos, setAlbumPhotos] = useState<{ id?: string; file?: File; file_path?: string; caption: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTitle(memory?.title || '');
    setRecipient(memory?.recipient || '');
    setContent(memory?.content || '');
    setDateWritten(memory?.date_written || '');
    setDeliveryInstructions(memory?.delivery_instructions || '');
    setMediaFile(null);

    if (memory?.id && meta?.hasBucketList) {
      (async () => {
        const { data } = await (supabase as any)
          .from('memory_bucket_items')
          .select('*')
          .eq('memory_id', memory.id)
          .order('display_order', { ascending: true });
        setBucketItems(data || []);
      })();
    } else if (meta?.hasBucketList) {
      setBucketItems([{ item_text: '', completed: false }]);
    } else {
      setBucketItems([]);
    }

    if (memory?.id && meta?.hasMediaUpload === 'images') {
      (async () => {
        const { data } = await (supabase as any)
          .from('memory_album_photos')
          .select('*')
          .eq('memory_id', memory.id)
          .order('display_order', { ascending: true });
        setAlbumPhotos((data || []).map((p: any) => ({ id: p.id, file_path: p.file_path, caption: p.caption || '' })));
      })();
    } else {
      setAlbumPhotos([]);
    }
  }, [isOpen, memory, meta]);

  if (!meta) return null;

  const validateMedia = (f: File): string | null => {
    if (meta.hasMediaUpload === 'video' && f.size > MAX_VIDEO) return 'Video must be 500 MB or smaller.';
    if (meta.hasMediaUpload === 'image' && f.size > MAX_IMG) return 'Image must be 25 MB or smaller.';
    if (meta.hasMediaUpload === 'audio' && f.size > MAX_AUDIO) return 'Audio must be 100 MB or smaller.';
    if (meta.hasMediaUpload === 'images' && f.size > MAX_IMG) return 'Each photo must be 25 MB or smaller.';
    return null;
  };

  const uploadOne = async (f: File): Promise<string> => {
    const ext = f.name.split('.').pop();
    const path = `${currentPacket.id}/memories/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('packet-documents').upload(path, f, { upsert: false });
    if (error) throw error;
    return path;
  };

  const handleSave = async () => {
    if (!currentPacket?.id) return;
    setSaving(true);
    try {
      let mediaPath = memory?.media_path || null;
      let mediaMime = memory?.media_mime || null;

      if (mediaFile) {
        const err = validateMedia(mediaFile);
        if (err) throw new Error(err);
        mediaPath = await uploadOne(mediaFile);
        mediaMime = mediaFile.type;
      }

      const payload: any = {
        packet_id: currentPacket.id,
        entry_type: effectiveType,
        title: title || null,
        recipient: meta.hasRecipient ? recipient || null : null,
        content: meta.hasRichText ? content || null : null,
        date_written: meta.hasDate && dateWritten ? dateWritten : null,
        delivery_instructions: meta.hasDeliveryNote ? deliveryInstructions || null : null,
        media_path: mediaPath,
        media_mime: mediaMime,
      };

      let memoryId = memory?.id;
      if (memoryId) {
        const { error } = await (supabase as any).from('memories').update(payload).eq('id', memoryId);
        if (error) throw error;
      } else {
        const { data, error } = await (supabase as any).from('memories').insert(payload).select().single();
        if (error) throw error;
        memoryId = data.id;
      }

      // Bucket list items
      if (meta.hasBucketList) {
        await (supabase as any).from('memory_bucket_items').delete().eq('memory_id', memoryId);
        const rows = bucketItems
          .filter((b) => b.item_text.trim())
          .map((b, i) => ({
            memory_id: memoryId,
            packet_id: currentPacket.id,
            item_text: b.item_text.trim(),
            completed: b.completed,
            display_order: i,
          }));
        if (rows.length) {
          const { error } = await (supabase as any).from('memory_bucket_items').insert(rows);
          if (error) throw error;
        }
      }

      // Album photos
      if (meta.hasMediaUpload === 'images') {
        for (let i = 0; i < albumPhotos.length; i++) {
          const p = albumPhotos[i];
          if (p.id) {
            await (supabase as any)
              .from('memory_album_photos')
              .update({ caption: p.caption, display_order: i })
              .eq('id', p.id);
          } else if (p.file) {
            const err = validateMedia(p.file);
            if (err) throw new Error(err);
            const filePath = await uploadOne(p.file);
            await (supabase as any).from('memory_album_photos').insert({
              memory_id: memoryId,
              packet_id: currentPacket.id,
              file_path: filePath,
              caption: p.caption || null,
              display_order: i,
            });
          }
        }
      }

      toast.success('Memory saved');
      onSaved();
    } catch (err: any) {
      console.error('Save memory failed', err);
      toast.error(err.message || 'Failed to save memory');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!memory?.id) return;
    if (!confirm('Delete this memory? This cannot be undone.')) return;
    setSaving(true);
    try {
      const { error } = await (supabase as any).from('memories').delete().eq('id', memory.id);
      if (error) throw error;
      toast.success('Memory deleted');
      onSaved();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  const accept =
    meta.hasMediaUpload === 'video' ? 'video/mp4,video/quicktime,video/*' :
    meta.hasMediaUpload === 'audio' ? 'audio/*' :
    meta.hasMediaUpload === 'image' || meta.hasMediaUpload === 'images' ? 'image/*' : undefined;

  return (
    <Sheet open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="h-[92vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader className="text-left mb-4">
          <SheetTitle className="font-serif text-xl text-navy-muted">
            {memory ? 'Edit' : 'Add'} {meta.label}
          </SheetTitle>
          <p className="text-sm text-stone-500">{meta.description}</p>
        </SheetHeader>

        <div className="space-y-4 pb-32">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Give it a title..." />
          </div>

          {meta.hasRecipient && (
            <div>
              <Label htmlFor="recipient">For (recipient)</Label>
              <Input id="recipient" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="e.g. My daughter Sarah" />
            </div>
          )}

          {meta.hasDate && (
            <div>
              <Label htmlFor="date">Date written</Label>
              <Input id="date" type="date" value={dateWritten} onChange={(e) => setDateWritten(e.target.value)} />
            </div>
          )}

          {meta.hasRichText && (
            <div>
              <Label>Content</Label>
              <RichTextEditor value={content} onChange={setContent} placeholder="Write your message..." minHeight={220} />
            </div>
          )}

          {meta.hasDeliveryNote && (
            <div>
              <Label htmlFor="delivery">When should this be delivered?</Label>
              <Textarea
                id="delivery"
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                placeholder="e.g. On her 18th birthday, or after I'm gone"
              />
            </div>
          )}

          {meta.hasMediaUpload !== 'none' && meta.hasMediaUpload !== 'images' && (
            <div>
              <Label>
                {meta.hasMediaUpload === 'video' && 'Upload video (max 500 MB)'}
                {meta.hasMediaUpload === 'audio' && 'Upload voice note'}
                {meta.hasMediaUpload === 'image' && 'Upload photo (optional)'}
              </Label>
              {memory?.media_path && !mediaFile && (
                <p className="text-xs text-stone-500 mb-2">Current file attached. Choose a new file to replace.</p>
              )}
              <Input
                type="file"
                accept={accept}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const err = validateMedia(f);
                  if (err) {
                    toast.error(err);
                    e.target.value = '';
                    return;
                  }
                  setMediaFile(f);
                }}
              />
              {mediaFile && (
                <p className="text-xs text-stone-500 mt-1">
                  {mediaFile.name} ({(mediaFile.size / 1024 / 1024).toFixed(1)} MB)
                </p>
              )}
            </div>
          )}

          {meta.hasMediaUpload === 'images' && (
            <div className="space-y-2">
              <Label>Album photos</Label>
              {albumPhotos.map((p, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2 border border-stone-100 rounded-lg">
                  <div className="flex-1 space-y-2">
                    {!p.id && (
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          const err = validateMedia(f);
                          if (err) {
                            toast.error(err);
                            e.target.value = '';
                            return;
                          }
                          const next = [...albumPhotos];
                          next[idx].file = f;
                          setAlbumPhotos(next);
                        }}
                      />
                    )}
                    {p.id && <p className="text-xs text-stone-500">Existing photo</p>}
                    <Input
                      placeholder="Caption (optional)"
                      value={p.caption}
                      onChange={(e) => {
                        const next = [...albumPhotos];
                        next[idx].caption = e.target.value;
                        setAlbumPhotos(next);
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setAlbumPhotos(albumPhotos.filter((_, i) => i !== idx))}
                  >
                    <X size={16} />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAlbumPhotos([...albumPhotos, { caption: '' }])}
              >
                <Plus size={14} className="mr-1" />
                Add photo
              </Button>
            </div>
          )}

          {meta.hasBucketList && (
            <div className="space-y-2">
              <Label>Bucket list items</Label>
              {bucketItems.map((b, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const next = [...bucketItems];
                      next[idx].completed = !next[idx].completed;
                      setBucketItems(next);
                    }}
                    className={`w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 ${
                      b.completed ? 'bg-amber-400 border-amber-400 text-white' : 'border-stone-300'
                    }`}
                    aria-label={b.completed ? 'Mark not done' : 'Mark done'}
                  >
                    {b.completed && <Check size={14} />}
                  </button>
                  <Input
                    value={b.item_text}
                    onChange={(e) => {
                      const next = [...bucketItems];
                      next[idx].item_text = e.target.value;
                      setBucketItems(next);
                    }}
                    placeholder="e.g. Visit the Grand Canyon"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setBucketItems(bucketItems.filter((_, i) => i !== idx))}
                  >
                    <X size={16} />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setBucketItems([...bucketItems, { item_text: '', completed: false }])}
              >
                <Plus size={14} className="mr-1" />
                Add item
              </Button>
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-100 p-4 flex gap-2">
          {memory && (
            <Button variant="ghost" onClick={handleDelete} disabled={saving} className="text-destructive">
              <Trash2 size={16} className="mr-1" />
              Delete
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-navy-muted text-white">
            {saving ? <Loader2 size={16} className="animate-spin mr-1" /> : <Upload size={16} className="mr-1" />}
            Save
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
