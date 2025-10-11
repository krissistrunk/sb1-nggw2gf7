import { supabase } from '../lib/supabase';
import type { Action } from '../lib/database.types';

export function useActions() {
  const scheduleAction = async (actionId: string, date: string) => {
    const { error } = await supabase
      .from('actions')
      .update({ scheduled_date: date })
      .eq('id', actionId);

    if (error) throw error;
  };

  const toggleAction = async (actionId: string, done: boolean) => {
    const { error } = await supabase
      .from('actions')
      .update({
        done,
        completed_at: done ? new Date().toISOString() : null
      })
      .eq('id', actionId);

    if (error) throw error;
  };

  const createAction = async (outcomeId: string, title: string) => {
    const { data, error } = await supabase
      .from('actions')
      .insert({ outcome_id: outcomeId, title })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const toggleMustStatus = async (actionId: string, isMust: boolean) => {
    const { error } = await supabase
      .from('actions')
      .update({ is_must: isMust })
      .eq('id', actionId);

    if (error) throw error;
  };

  const updateDelegation = async (
    actionId: string,
    delegatedTo: string | null
  ) => {
    const { error } = await supabase
      .from('actions')
      .update({
        delegated_to: delegatedTo,
        delegated_date: delegatedTo ? new Date().toISOString() : null,
      })
      .eq('id', actionId);

    if (error) throw error;
  };

  const deleteAction = async (actionId: string) => {
    const { error } = await supabase
      .from('actions')
      .delete()
      .eq('id', actionId);

    if (error) throw error;
  };

  const updateActionOrder = async (
    actionId: string,
    newSortOrder: number
  ) => {
    const { error } = await supabase
      .from('actions')
      .update({ sort_order: newSortOrder })
      .eq('id', actionId);

    if (error) throw error;
  };

  const reorderActions = async (
    outcomeId: string,
    actionIds: string[]
  ) => {
    const updates = actionIds.map((actionId, index) =>
      supabase
        .from('actions')
        .update({ sort_order: index })
        .eq('id', actionId)
        .eq('outcome_id', outcomeId)
    );

    const results = await Promise.all(updates);
    const errors = results.filter((r) => r.error);

    if (errors.length > 0) {
      throw errors[0].error;
    }
  };

  const calculateTimeByPriority = (actions: Action[]) => {
    const mustTime = actions
      .filter((a) => a.is_must)
      .reduce((sum, a) => sum + (a.duration_minutes || 0), 0);

    const totalTime = actions.reduce(
      (sum, a) => sum + (a.duration_minutes || 0),
      0
    );

    const optionalTime = totalTime - mustTime;

    return {
      mustTime,
      optionalTime,
      totalTime,
    };
  };

  const getActionsByPriority = (actions: Action[]) => {
    return {
      mustActions: actions.filter((a) => a.is_must),
      optionalActions: actions.filter((a) => !a.is_must),
      delegatedActions: actions.filter((a) => a.delegated_to),
    };
  };

  return {
    scheduleAction,
    toggleAction,
    createAction,
    toggleMustStatus,
    updateDelegation,
    deleteAction,
    updateActionOrder,
    reorderActions,
    calculateTimeByPriority,
    getActionsByPriority,
  };
}
