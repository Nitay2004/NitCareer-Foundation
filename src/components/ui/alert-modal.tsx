"use client";

import * as React from "react";
import { CustomModal } from "./custom-modal";
import { Button } from "./button";
import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    title: string;
    description: string;
    variant?: "info" | "success" | "warning" | "destructive";
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
}

export function AlertModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    variant = "info",
    confirmText = "Continue",
    cancelText = "Cancel",
    isLoading = false,
}: AlertModalProps) {
    const icons = {
        info: <Info className="h-6 w-6 text-blue-500" />,
        success: <CheckCircle2 className="h-6 w-6 text-green-500" />,
        warning: <AlertCircle className="h-6 w-6 text-orange-500" />,
        destructive: <XCircle className="h-6 w-6 text-red-500" />,
    };

    const variantStyles = {
        info: "bg-blue-500/10 border-blue-500/20",
        success: "bg-green-500/10 border-green-500/20",
        warning: "bg-orange-500/10 border-orange-500/20",
        destructive: "bg-red-500/10 border-red-500/20",
    };

    const buttonStyles = {
        info: "bg-blue-600 hover:bg-blue-700",
        success: "bg-green-600 hover:bg-green-700",
        warning: "bg-orange-600 hover:bg-orange-700",
        destructive: "bg-red-600 hover:bg-red-700",
    };

    return (
        <CustomModal isOpen={isOpen} onClose={onClose} className="max-w-md p-0 overflow-hidden">
            <div className="p-6">
                <div className="flex items-start gap-4">
                    <div className={cn("p-3 rounded-2xl border", variantStyles[variant])}>
                        {icons[variant]}
                    </div>
                    <div className="space-y-1 pt-1">
                        <h3 className="text-xl font-bold tracking-tight">{title}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            {description}
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-8">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isLoading}
                        className="rounded-xl px-6"
                    >
                        {cancelText}
                    </Button>
                    {onConfirm && (
                        <Button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={cn(
                                "rounded-xl px-8 font-bold shadow-lg transition-all active:scale-95",
                                buttonStyles[variant]
                            )}
                        >
                            {isLoading ? (
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                            ) : (
                                confirmText
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </CustomModal>
    );
}
