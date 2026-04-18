import * as React from 'react';
import { useIsMobile } from './use-mobile';

interface Options {
  /** Called with dropped files. Validate inside the handler. */
  onFiles: (files: File[]) => void;
  /** Disable the dropzone entirely (no visual activation, no callbacks). */
  disabled?: boolean;
  /** If false, only the first file is forwarded. Defaults to true. */
  multiple?: boolean;
}

/**
 * Reusable drag-and-drop file handler for any container.
 * Returns props to spread on the drop target plus the active state and a
 * `isTouch` flag for hiding drag-only copy on mobile.
 *
 * Uses a counter for dragenter/leave so nested children don't flicker the
 * active state. On touch devices, drag handlers are no-ops.
 */
export function useFileDropzone({ onFiles, disabled = false, multiple = true }: Options) {
  const isTouch = useIsMobile();
  const [isDragging, setIsDragging] = React.useState(false);
  const counter = React.useRef(0);

  const reset = React.useCallback(() => {
    counter.current = 0;
    setIsDragging(false);
  }, []);

  const onDragEnter = React.useCallback(
    (e: React.DragEvent) => {
      if (disabled || isTouch) return;
      // Only react when files are being dragged in
      const hasFiles = Array.from(e.dataTransfer?.types || []).includes('Files');
      if (!hasFiles) return;
      e.preventDefault();
      counter.current += 1;
      setIsDragging(true);
    },
    [disabled, isTouch],
  );

  const onDragOver = React.useCallback(
    (e: React.DragEvent) => {
      if (disabled || isTouch) return;
      const hasFiles = Array.from(e.dataTransfer?.types || []).includes('Files');
      if (!hasFiles) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    },
    [disabled, isTouch],
  );

  const onDragLeave = React.useCallback(
    (e: React.DragEvent) => {
      if (disabled || isTouch) return;
      e.preventDefault();
      counter.current = Math.max(0, counter.current - 1);
      if (counter.current === 0) setIsDragging(false);
    },
    [disabled, isTouch],
  );

  const onDrop = React.useCallback(
    (e: React.DragEvent) => {
      if (disabled || isTouch) return;
      e.preventDefault();
      reset();
      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length === 0) return;
      onFiles(multiple ? files : files.slice(0, 1));
    },
    [disabled, isTouch, multiple, onFiles, reset],
  );

  return {
    isDragging,
    isTouch,
    dropzoneProps: { onDragEnter, onDragOver, onDragLeave, onDrop },
  };
}
