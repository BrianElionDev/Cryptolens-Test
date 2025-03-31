declare module 'react-hot-toast' {
  export interface ToastOptions {
    duration?: number;
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    style?: React.CSSProperties;
    success?: { style?: React.CSSProperties };
    error?: { style?: React.CSSProperties };
    loading?: { style?: React.CSSProperties };
  }

  export interface ToasterProps {
    position?: ToastOptions['position'];
    toastOptions?: ToastOptions;
  }

  export function Toaster(props?: ToasterProps): JSX.Element;
  export function toast(message: string, options?: ToastOptions): string;
  export function toast.success(message: string, options?: ToastOptions): string;
  export function toast.error(message: string, options?: ToastOptions): string;
  export function toast.loading(message: string, options?: ToastOptions): string;
  export function toast.dismiss(toastId?: string): void;
  export function toast.promise<T>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error: string },
    options?: ToastOptions
  ): Promise<T>;
} 