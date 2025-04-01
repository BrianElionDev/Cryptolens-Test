declare module "react-hot-toast" {
  export interface Toast {
    id: string;
    type: "success" | "error" | "loading" | "blank" | "custom";
    message: string;
    duration?: number;
    position?:
      | "top-left"
      | "top-center"
      | "top-right"
      | "bottom-left"
      | "bottom-center"
      | "bottom-right";
  }

  export interface ToastOptions {
    duration?: number;
    position?:
      | "top-left"
      | "top-center"
      | "top-right"
      | "bottom-left"
      | "bottom-center"
      | "bottom-right";
    style?: React.CSSProperties;
    className?: string;
    icon?: string | React.ReactNode;
    ariaProps?: {
      role: string;
      "aria-live": "polite" | "assertive" | "off";
    };
  }

  export interface ToasterProps {
    position?: ToastOptions["position"];
    toastOptions?: ToastOptions;
  }

  export function Toaster(props?: ToasterProps): JSX.Element;
  export function toast(message: string, options?: ToastOptions): string;

  export namespace toast {
    export function success(message: string, options?: ToastOptions): string;
    export function error(message: string, options?: ToastOptions): string;
    export function loading(message: string, options?: ToastOptions): string;
    export function custom(message: string, options?: ToastOptions): string;
    export function dismiss(toastId?: string): void;
    export function promise<T>(
      promise: Promise<T>,
      messages: {
        loading: string;
        success: string;
        error: string;
      },
      options?: ToastOptions
    ): Promise<T>;
  }
}
