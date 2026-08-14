import { useState, useEffect, useCallback } from 'react';
import { Branch, BranchArtifact } from '../types';

const API_BASE = import.meta.env.VITE_LOSM_API_URL || 'http://localhost:8000';

export function useBranches(wrId?: string) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBranches = useCallback(async () => {
    if (!wrId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/branches/wr/${wrId}`);
      if (res.ok) {
        const data = await res.json();
        setBranches(data);
      }
    } catch {
      // backend not available
    } finally {
      setLoading(false);
    }
  }, [wrId]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const createBranch = useCallback(async (label: string) => {
    if (!wrId) return;
    try {
      const res = await fetch(`${API_BASE}/branches/?wr_id=${wrId}&label=${encodeURIComponent(label)}`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setBranches((prev) => [...prev, data]);
      }
    } catch {
      // backend not available
    }
  }, [wrId]);

  const forkBranch = useCallback(async (branchId: string, label: string) => {
    try {
      const res = await fetch(`${API_BASE}/branches/${branchId}/fork?label=${encodeURIComponent(label)}`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setBranches((prev) => [...prev, data]);
      }
    } catch {
      // backend not available
    }
  }, []);

  const scoreBranch = useCallback(async (branchId: string, score: number) => {
    try {
      const res = await fetch(`${API_BASE}/branches/${branchId}/score?score=${score}`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchBranches();
      }
    } catch {
      // backend not available
    }
  }, [fetchBranches]);

  const mergeBranch = useCallback(async (branchId: string, strategy: string = 'select_best') => {
    try {
      const res = await fetch(`${API_BASE}/branches/${branchId}/merge?strategy=${strategy}`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchBranches();
      }
    } catch {
      // backend not available
    }
  }, [fetchBranches]);

  const discardBranch = useCallback(async (branchId: string) => {
    try {
      const res = await fetch(`${API_BASE}/branches/${branchId}/discard`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchBranches();
      }
    } catch {
      // backend not available
    }
  }, [fetchBranches]);

  return {
    branches,
    selectedBranch,
    setSelectedBranch,
    loading,
    createBranch,
    forkBranch,
    scoreBranch,
    mergeBranch,
    discardBranch,
    refresh: fetchBranches,
  };
}
