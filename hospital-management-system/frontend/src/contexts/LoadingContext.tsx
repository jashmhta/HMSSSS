'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

import { LoadingSpinner } from '@/components/ui/LoadingStates';

import type { ILoadingState, ILoadingTask } from '@/hooks/useLoading';

interface ILoadingContextType {
  globalLoading: ILoadingState;
  globalTasks: ILoadingTask[];
  setGlobalLoading: (loading: ILoadingState) => void;
  addGlobalTask: (task: ILoadingTask) => void;
  removeGlobalTask: (taskId: string) => void;
  clearGlobalTasks: () => void;
  showGlobalLoader: (message?: string) => void;
  hideGlobalLoader: () => void;
}

const LoadingContext = createContext<ILoadingContextType | undefined>(undefined);

export function useLoadingContext() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoadingContext must be used within a LoadingProvider');
  }
  return context;
}

interface ILoadingProviderProps {
  children: React.ReactNode;
}

export function LoadingProvider({ children }: ILoadingProviderProps) {
  const [globalLoading, setGlobalLoadingState] = useState<ILoadingState>({
    isLoading: false,
    error: null,
  });

  const [globalTasks, setGlobalTasks] = useState<ILoadingTask[]>([]);

  const setGlobalLoading = useCallback((loading: ILoadingState) => {
    setGlobalLoadingState(loading);
  }, []);

  const addGlobalTask = useCallback((task: ILoadingTask) => {
    setGlobalTasks(prev => {
      const existingTaskIndex = prev.findIndex(t => t.id === task.id);
      if (existingTaskIndex >= 0) {
        const updatedTasks = [...prev];
        updatedTasks[existingTaskIndex] = task;
        return updatedTasks;
      }
      return [...prev, task];
    });

    // Update global loading state based on tasks
    const activeTasks = [...globalTasks, task].filter(t => t.status === 'loading');
    if (activeTasks.length > 0) {
      setGlobalLoadingState({
        isLoading: true,
        message: activeTasks[activeTasks.length - 1]?.message || 'Loading...',
        error: null,
      });
    }
  }, [globalTasks]);

  const removeGlobalTask = useCallback((taskId: string) => {
    setGlobalTasks(prev => prev.filter(task => task.id !== taskId));

    // Update global loading state
    const remainingTasks = globalTasks.filter(task => task.id !== taskId);
    const activeTasks = remainingTasks.filter(t => t.status === 'loading');

    if (activeTasks.length === 0) {
      setGlobalLoadingState(prev => ({
        ...prev,
        isLoading: false,
      }));
    } else {
      setGlobalLoadingState({
        isLoading: true,
        message: activeTasks[activeTasks.length - 1]?.message || 'Loading...',
        error: null,
      });
    }
  }, [globalTasks]);

  const clearGlobalTasks = useCallback(() => {
    setGlobalTasks([]);
    setGlobalLoadingState(prev => ({
      ...prev,
      isLoading: false,
    }));
  }, []);

  const showGlobalLoader = useCallback((message?: string) => {
    setGlobalLoadingState({
      isLoading: true,
      ...(message && { message }),
      error: null,
    });
  }, []);

  const hideGlobalLoader = useCallback(() => {
    setGlobalLoadingState(prev => ({
      ...prev,
      isLoading: false,
    }));
  }, []);

  const value = {
    globalLoading,
    globalTasks,
    setGlobalLoading,
    addGlobalTask,
    removeGlobalTask,
    clearGlobalTasks,
    showGlobalLoader,
    hideGlobalLoader,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
      <GlobalLoadingOverlay />
    </LoadingContext.Provider>
  );
}

function GlobalLoadingOverlay() {
  const { globalLoading } = useLoadingContext();

  if (!globalLoading.isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl max-w-sm mx-4">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mb-4 mx-auto" />
          <p className="text-gray-700 dark:text-gray-300 font-medium">
            {globalLoading.message || 'Loading...'}
          </p>
          {globalLoading.progress !== undefined && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {Math.round(globalLoading.progress)}% complete
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Higher-order component for loading states
export function withLoading<P extends object>(
  Component: React.ComponentType<P>,
  loadingProp: keyof P = 'loading' as keyof P,
) {
  return function WithLoading(props: P) {
    const { globalLoading } = useLoadingContext();

    return (
      <Component
        {...props}
        { ...{ [loadingProp]: globalLoading.isLoading } as any }
      />
    );
  };
}

// Hook for component-level loading
export function useComponentLoading() {
  const { showGlobalLoader, hideGlobalLoader } = useLoadingContext();

  const withLoading = useCallback(
    <T,>(promise: Promise<T>, message?: string): Promise<T> => {
      showGlobalLoader(message);
      return promise.finally(() => hideGlobalLoader());
    },
    [showGlobalLoader, hideGlobalLoader],
  );

  return { withLoading };
}