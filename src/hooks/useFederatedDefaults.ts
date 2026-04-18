import { useCallback, useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import {
  applyFederationDefaults,
  AppliedFederation,
  EMPTY_FEDERATION_SOURCES,
  FederationSources,
  loadFederationSources,
} from '@/services/federationService';

/**
 * Loads federation sources for the current packet and exposes
 * `applyDefaults(section, formData, isExistingRecord)`.
 *
 * Sources reload whenever `completionVersion` changes (any save in the app),
 * keeping cross-section pre-fill suggestions fresh without manual refresh.
 */
export function useFederatedDefaults() {
  const { currentPacket, completionVersion } = useAppContext();
  const [sources, setSources] = useState<FederationSources>(EMPTY_FEDERATION_SOURCES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!currentPacket?.id) {
      setSources(EMPTY_FEDERATION_SOURCES);
      setLoaded(true);
      return;
    }
    loadFederationSources(currentPacket.id)
      .then((next) => {
        if (!cancelled) {
          setSources(next);
          setLoaded(true);
        }
      })
      .catch((err) => {
        console.error('Failed to load federation sources:', err);
        if (!cancelled) {
          setSources(EMPTY_FEDERATION_SOURCES);
          setLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [currentPacket?.id, completionVersion]);

  const applyDefaults = useCallback(
    <T extends Record<string, any>>(section: string, formData: T, isExistingRecord: boolean): AppliedFederation =>
      applyFederationDefaults(section, formData, sources, isExistingRecord),
    [sources],
  );

  return { sources, loaded, applyDefaults };
}
