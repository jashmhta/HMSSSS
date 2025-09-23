'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { LoadingState, LoadingTask } from '@/hooks/useLoading';
import { LoadingOverlay, LoadingSpinner } from '@/components/ui/LoadingStates';

interface LoadingContextType {
  globalLoading: LoadingState;
  globalTasks: LoadingTask[];
  setGlobalLoading: (loading: LoadingState) => void;
  addGlobalTask: (task: LoadingTask) => void;
  removeGlobalTask: (taskId: string) => void;
  clearGlobalTasks: () => void;
  showGlobalLoader: (message?: string) => void;
  hideGlobalLoader: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function useLoadingContext() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoadingContext must be used within a LoadingProvider');
  }
  return context;
}

interface LoadingProviderProps {
  children: React.ReactNode;
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [globalLoading, setGlobalLoadingState] = useState<LoadingState>({
    isLoading: false,
    message: undefined,
    error: null,
  });

  const [globalTasks, setGlobalTasks] = useState<LoadingTask[]>([]);

  const setGlobalLoading = useCallback((loading: LoadingState) => {
    setGlobalLoadingState(loading);
  }, []);

  const addGlobalTask = useCallback((task: LoadingTask) => {
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
        message: activeTasks[activeTasks.length - 1].message || 'Loading...',
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
        progress: undefined,
      }));
    } else {
      setGlobalLoadingState({
        isLoading: true,
        message: activeTasks[activeTasks.length - 1].message || 'Loading...',
        error: null,
      });
    }
  }, [globalTasks]);

  const clearGlobalTasks = useCallback(() => {
    setGlobalTasks([]);
    setGlobalLoadingState(prev => ({
      ...prev,
      isLoading: false,
      progress: undefined,
    }));
  }, []);

  const showGlobalLoader = useCallback((message?: string) => {
    setGlobalLoadingState({
      isLoading: true,
      message,
      error: null,
    });
  }, []);

  const hideGlobalLoader = useCallback(() => {
    setGlobalLoadingState(prev => ({
      ...prev,
      isLoading: false,
      progress: undefined,
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
  loadingProp: keyof P = 'loading'
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

  const withLoading = useCallback(async <T>(
    promise: Promise<T>,
    message?: string
  ): Promise<T> => {
    showGlobalLoader(message);
    try {
      const result = await promise;
      return result;
    } finally {
      hideGlobalLoader();
    }
  }, [showGlobalLoader, hideGlobalLoader]);

  return { withLoading };
}