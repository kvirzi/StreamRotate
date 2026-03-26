import { useState, useEffect, useCallback } from 'react';
import { servicesApi, showsApi } from '../lib/api';
import { supabase } from '../lib/supabase';
import { Service, Show } from '../types';

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await servicesApi.getAll();
      setServices(data);
      setError(null);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Failed to load services');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { services, loading, error, refresh, setServices };
}

export function useShows() {
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await showsApi.getAll();
      setShows(data);
      setError(null);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Failed to load shows');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { shows, loading, error, refresh, setShows };
}

export function useUserPlan() {
  const [plan, setPlan] = useState<'free' | 'pro'>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const userPlan = (user?.user_metadata?.plan as 'free' | 'pro') || 'free';
      setPlan(userPlan);
      setLoading(false);
    });
  }, []);

  return { plan, loading };
}
