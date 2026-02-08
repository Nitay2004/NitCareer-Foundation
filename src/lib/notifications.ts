"use client";

import { toast } from "sonner";

export const notify = {
    success: (message: string, description?: string) => {
        return toast.success(message, {
            description,
            className: "premium-toast success",
        });
    },
    error: (message: string, description?: string) => {
        return toast.error(message, {
            description,
            className: "premium-toast error",
        });
    },
    info: (message: string, description?: string) => {
        return toast.info(message, {
            description,
            className: "premium-toast info",
        });
    },
    loading: (message: string) => {
        return toast.loading(message, {
            className: "premium-toast info",
        });
    },
    dismiss: (id?: string | number) => {
        toast.dismiss(id);
    },
    promise: (promise: Promise<any>, {
        loading,
        success,
        error,
    }: {
        loading: string;
        success: (data: any) => string | React.ReactNode;
        error: (err: any) => string | React.ReactNode;
    }) => {
        return toast.promise(promise, {
            loading,
            success,
            error,
        });
    },
};
