import { useState, useCallback, useEffect } from 'react';

export interface ILoadingState {
  isLoading: boolean;
  progress?: number;
  message?: string;
  error?: string | null;
}

export interface IUseLoadingOptions {
  initialMessage?: string;
  timeout?: number;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

export interface ILoadingTask<T = any> {
  id: string;
  name: string;
  status: 'pending' | 'loading' | 'completed' | 'failed';
  progress?: number;
  message?: string;
  error?: string;
  result?: T;
  startTime?: number;
  endTime?: number;
}

export function useLoading(options: IUseLoadingOptions = {}) {
  const [loadingState, setLoadingState] = useState<ILoadingState>({
    isLoading: false,
    ...(options.initialMessage && { message: options.initialMessage }),
    error: null,
  });

  const [tasks, setTasks] = useState<ILoadingTask[]>([]);

  const startLoading = useCallback((message?: string) => {
    setLoadingState({
      isLoading: true,
      message: message || options.initialMessage || 'Loading...',
      error: null,
    });
  }, [options.initialMessage]);

  const stopLoading = useCallback(() => {
    setLoadingState(prev => ({
      ...prev,
      isLoading: false,
    }));
    options.onSuccess?.();
  }, [options.onSuccess]);

  const setProgress = useCallback((progress: number, message?: string) => {
    setLoadingState(prev => ({
      ...prev,
      progress,
      ...(message || prev.message ? { message: message || prev.message } : {}),
    }));
  }, []);

  const setError = useCallback((error: Error | string) => {
    const errorMessage = error instanceof Error ? error.message : error;
    setLoadingState(prev => ({
      ...prev,
      isLoading: false,
      error: errorMessage,
    }));
    options.onError?.(error instanceof Error ? error : new Error(errorMessage));
  }, [options.onError]);

  const reset = useCallback(() => {
    setLoadingState({
      isLoading: false,
      ...(options.initialMessage && { message: options.initialMessage }),
      error: null,
    });
  }, [options.initialMessage]);

  // Task management
  const addTask = useCallback(<T = any>(name: string, taskFn: () => Promise<T>): Promise<T> => {
    const taskId = Math.random().toString(36).substr(2, 9);
    const newTask: ILoadingTask<T> = {
      id: taskId,
      name,
      status: 'pending',
      startTime: Date.now(),
    };

    setTasks(prev => [...prev, newTask]);

    const updateTask = (updates: Partial<ILoadingTask<T>>) => {
      setTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, ...updates } : task,
      ));
    };

    return new Promise((resolve, reject) => {
      updateTask({ status: 'loading' });
      startLoading(name);

      taskFn()
        .then((result) => {
          updateTask({
            status: 'completed',
            result,
            endTime: Date.now(),
          });
          stopLoading();
          resolve(result);
        })
        .catch((error) => {
          updateTask({
            status: 'failed',
            error: error.message,
            endTime: Date.now(),
          });
          setError(error);
          reject(error);
        });
    });
  }, [startLoading, stopLoading, setError]);

  const removeTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  }, []);

  const clearTasks = useCallback(() => {
    setTasks([]);
  }, []);

  const getTaskStats = useCallback(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const failed = tasks.filter(t => t.status === 'failed').length;
    const inProgress = tasks.filter(t => t.status === 'loading').length;

    return {
      total,
      completed,
      failed,
      inProgress,
      successRate: total > 0 ? (completed / total) * 100 : 0,
    };
  }, [tasks]);

  // Auto-cleanup on timeout
  useEffect(() => {
    if (loadingState.isLoading && options.timeout) {
      const timer = setTimeout(() => {
        if (loadingState.isLoading) {
          setError(new Error(`Loading timeout after ${options.timeout}ms`));
        }
      }, options.timeout);

      return () => clearTimeout(timer);
    }
    return () => {}; // Return empty cleanup function when no timer is set
  }, [loadingState.isLoading, options.timeout, setError]);

  return {
    loadingState,
    tasks,
    startLoading,
    stopLoading,
    setProgress,
    setError,
    reset,
    addTask,
    removeTask,
    clearTasks,
    getTaskStats,
  };
}

// Specialized hooks for common loading patterns
export function useAsyncData<T>(
  asyncFn: () => Promise<T>,
  options: IUseLoadingOptions & { immediate?: boolean; deps?: any[] } = {},
) {
  const {
    immediate = true,
    deps = [],
    onError,
    onSuccess,
    ...loadingOptions
  } = options;

  const { loadingState, addTask } = useLoading({
    ...loadingOptions,
    ...(onError && { onError }),
    ...(onSuccess && { onSuccess }),
  });

  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(async () => {
    try {
      const result = await addTask('Data fetch', asyncFn);
      setData(result);
      return result;
    } catch (error) {
      setData(null);
      throw error;
    }
  }, [asyncFn, addTask]);

  useEffect(() => {
    if (immediate) {
      execute().catch(console.error);
    }
  }, [immediate, execute, ...deps]);

  return {
    data,
    loadingState,
    execute,
    refetch: execute,
  };
}

export function useFormSubmission<T>(
  submitFn: (data: T) => Promise<any>,
  options: IUseLoadingOptions & { resetOnSuccess?: boolean } = {},
) {
  const { resetOnSuccess = false, ...loadingOptions } = options;
  const { loadingState, setError, reset } = useLoading(loadingOptions);

  const submit = useCallback(async (data: T) => {
    try {
      await submitFn(data);
      if (resetOnSuccess) {
        reset();
      }
    } catch (error) {
      setError(error as Error | string);
      throw error;
    }
  }, [submitFn, setError, reset, resetOnSuccess]);

  return {
    loadingState,
    submit,
    setError,
    reset,
  };
}

export function useInfiniteScroll<T>(
  loadMoreFn: (page: number) => Promise<{ items: T[]; hasMore: boolean }>,
  options: IUseLoadingOptions = {},
) {
  const { loadingState, setError, addTask } = useLoading(options);
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingState.isLoading) return;

    try {
      const result = await addTask(`Load page ${page}`, () => loadMoreFn(page));
      setItems(prev => [...prev, ...result.items]);
      setHasMore(result.hasMore);
      setPage(prev => prev + 1);
    } catch (error) {
      setError(error as Error | string);
    }
  }, [page, hasMore, loadingState.isLoading, loadMoreFn, addTask, setError]);

  const reset = useCallback(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
  }, []);

  return {
    items,
    loadingState,
    hasMore,
    loadMore,
    reset,
  };
}

export function useRealtimeStatus<T>(
  getStatusFn: () => Promise<T>,
  options: IUseLoadingOptions & { interval?: number } = {},
) {
  const { interval = 5000, ...loadingOptions } = options;
  const { loadingState, setError, addTask } = useLoading(loadingOptions);
  const [status, setStatus] = useState<T | null>(null);

  useEffect(() => {
    const updateStatus = async () => {
      try {
        const result = await addTask('Status check', getStatusFn);
        setStatus(result);
      } catch (error) {
        setError(error as Error | string);
      }
    };

    updateStatus();
    const intervalId = setInterval(updateStatus, interval);

    return () => clearInterval(intervalId);
  }, [getStatusFn, interval, addTask, setError]);

  return {
    status,
    loadingState,
  };
}

// Smart loading utilities
export const loadingUtils = {
  getEstimatedTime: (tasks: ILoadingTask[]): number => {
    const completedTasks = tasks.filter(t => t.status === 'completed');
    if (completedTasks.length === 0) return 0;

    const totalTime = completedTasks.reduce((sum, task) => {
      return sum + ((task.endTime || 0) - (task.startTime || 0));
    }, 0);

    return totalTime / completedTasks.length;
  },

  getSmartMessage: (state: ILoadingState, tasks: ILoadingTask[]): string => {
    if (state.error) return `Error: ${state.error}`;
    if (state.message) return state.message;

    const activeTasks = tasks.filter(t => t.status === 'loading');
    if (activeTasks.length === 0) return 'Loading...';

    if (activeTasks.length === 1) {
      return activeTasks[0]?.name || 'Loading...';
    }

    return `${activeTasks.length} tasks in progress...`;
  },

  calculateProgress: (tasks: ILoadingTask[]): number => {
    if (tasks.length === 0) return 0;

    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    return Math.round((completedTasks / tasks.length) * 100);
  },

  shouldShowSkeleton: (state: ILoadingState, delay: number = 300): boolean => {
    return state.isLoading && Date.now() - (state.progress || 0) > delay;
  },
};