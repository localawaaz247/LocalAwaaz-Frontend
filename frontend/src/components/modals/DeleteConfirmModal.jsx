import React from "react";
import { Trash2, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const DeleteConfirmModal = ({ onClose, onConfirm, isDeleting }) => {
    const { t } = useTranslation();

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 h-[100dvh] w-full overflow-hidden animate-fade-in">
            <div className="bg-card glass-card border border-border/50 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col scale-in m-auto relative">

                <div className="p-6 text-center space-y-4">
                    <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                        <Trash2 size={32} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">
                        {t("Delete Issue?")}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {t("Are you sure you want to delete this issue? This action cannot be undone.")}
                    </p>
                </div>

                <div className="p-4 md:p-6 border-t border-border/50 bg-muted/20 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="flex-1 py-3 rounded-xl font-semibold border border-border bg-card hover:bg-muted transition-colors text-sm"
                    >
                        {t('cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-sm transition-colors"
                    >
                        {isDeleting ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> {t('deleting') || "Deleting..."}</>
                        ) : t("Delete")}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default DeleteConfirmModal;