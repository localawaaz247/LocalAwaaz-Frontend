import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axios';
import { showToast } from '../../utils/toast';
import { X, Building2, MapPin, Mail, User, Shield, CheckCircle, XCircle, RotateCcw, FileText, Maximize2 } from 'lucide-react';
import MiniLoader from '../MiniLoader';

const AuthorityDetailModal = ({ authority, isOpen, onClose, onActionComplete }) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [actionType, setActionType] = useState(null); // 'APPROVE', 'REJECT', 'REVERT'
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setShowRejectInput(false);
                setRejectionReason('');
                setActionType(null);
                setIsZoomed(false);
            }, 300);
        }
    }, [isOpen]);

    if (!authority) return null;

    const currentStatus = authority.authorityProfile?.verificationStatus;
    const isPdf = authority.authorityProfile?.idProofUrl?.toLowerCase().endsWith('.pdf');

    const handleStatusUpdate = async (newStatus) => {
        if (newStatus === 'REJECTED' && !showRejectInput) {
            setShowRejectInput(true);
            return;
        }

        if (newStatus === 'REJECTED' && !rejectionReason.trim()) {
            showToast({ icon: 'error', title: 'Please provide a reason for rejection.' });
            return;
        }

        setIsUpdating(true);
        setActionType(newStatus);

        try {
            await axiosInstance.patch(`/admin/authority/${authority._id}/status`, {
                status: newStatus,
                rejectionReason: newStatus === 'REJECTED' ? rejectionReason : undefined
            });

            showToast({ icon: 'success', title: `Authority marked as ${newStatus}` });
            onActionComplete();
            onClose();
        } catch (error) {
            console.error("Action failed:", error);
            showToast({ icon: 'error', title: error.response?.data?.message || 'Failed to update status' });
        } finally {
            setIsUpdating(false);
            setActionType(null);
        }
    };

    return (
        <>
            {/* Main Modal Overlay */}
            <div className={`fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6 transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>

                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

                <div
                    className={`relative bg-card border-t sm:border border-border/50 rounded-t-2xl sm:rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transform transition-all duration-300 ease-out ${isOpen ? 'translate-y-0 sm:scale-100' : 'translate-y-full sm:translate-y-8 sm:scale-95'}`}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex justify-between items-center p-4 border-b border-border/50 bg-muted/10 shrink-0">
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <Shield className="text-primary w-5 h-5" />
                            Verification Review
                        </h3>
                        <button onClick={onClose} className="p-1.5 rounded-full bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden thin-scrollbar">

                        {/* LEFT SIDE: Details */}
                        <div className="flex-1 p-4 md:p-6 space-y-6 lg:overflow-y-auto thin-scrollbar lg:border-r border-border/50">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-2xl font-bold text-foreground">
                                        {authority.authorityProfile?.departmentName}
                                    </h2>
                                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase rounded-md border border-primary/20">
                                        {authority.role}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                    <MapPin size={14} /> Assigned: {authority.authorityProfile?.assignedDistrict}, {authority.authorityProfile?.assignedState}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-background/50 border border-border/50 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1 flex items-center gap-1.5"><User size={14} /> Rep Name</p>
                                    <p className="text-sm font-semibold text-foreground">{authority.name}</p>
                                </div>
                                <div className="bg-background/50 border border-border/50 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1 flex items-center gap-1.5"><Mail size={14} /> Official Email</p>
                                    <a href={`mailto:${authority.contact?.email}`} className="text-sm font-semibold text-primary hover:underline">{authority.contact?.email}</a>
                                </div>
                            </div>

                            <div className="bg-background/50 border border-border/50 rounded-xl p-4">
                                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Expertise Tags</p>
                                <div className="flex flex-wrap gap-2">
                                    {authority.authorityProfile?.expertiseTags?.length > 0 ? (
                                        authority.authorityProfile.expertiseTags.map((tag, i) => (
                                            <span key={i} className="px-2.5 py-1 bg-muted rounded-md text-xs font-medium text-foreground">
                                                {tag}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-sm text-muted-foreground">No specific tags provided.</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT SIDE: Document & Actions */}
                        <div className="w-full lg:w-[400px] xl:w-[450px] shrink-0 p-4 md:p-6 bg-muted/5 flex flex-col gap-6 lg:overflow-y-auto thin-scrollbar">

                            {/* Document Preview Box */}
                            <div className="flex flex-col gap-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase flex justify-between items-center">
                                    <span><FileText size={14} className="inline mr-1.5" /> ID Proof / Document</span>
                                    {authority.authorityProfile?.idProofUrl && (
                                        <button onClick={() => setIsZoomed(true)} className="text-primary hover:underline flex items-center gap-1">
                                            <Maximize2 size={12} /> Expand
                                        </button>
                                    )}
                                </p>

                                <div
                                    className="w-full aspect-[4/3] bg-black/10 dark:bg-black/30 rounded-xl border border-border/50 overflow-hidden relative group cursor-pointer"
                                    onClick={() => setIsZoomed(true)}
                                >
                                    {authority.authorityProfile?.idProofUrl ? (
                                        isPdf ? (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted">
                                                <FileText size={48} className="mb-2 opacity-50" />
                                                <span className="text-sm font-medium">PDF Document</span>
                                                <span className="text-xs mt-1">Click to Expand</span>
                                            </div>
                                        ) : (
                                            <img
                                                src={authority.authorityProfile.idProofUrl}
                                                alt="ID Proof"
                                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                            />
                                        )
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                                            No Document Uploaded
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Maximize2 className="text-white w-8 h-8" />
                                    </div>
                                </div>
                            </div>

                            {/* Action Area */}
                            <div className="mt-auto space-y-3 pt-4 border-t border-border/50">
                                {currentStatus === 'PENDING' ? (
                                    <>
                                        {showRejectInput && (
                                            <div className="animate-fade-in mb-3">
                                                <label className="text-xs font-semibold text-foreground mb-1 block">Rejection Reason (Sent to User)</label>
                                                <textarea
                                                    value={rejectionReason}
                                                    onChange={(e) => setRejectionReason(e.target.value)}
                                                    className="w-full p-3 bg-background border border-border/50 rounded-lg text-sm focus:border-red-500 outline-none resize-none thin-scrollbar"
                                                    rows="3"
                                                    placeholder="Specify why the document or details are invalid..."
                                                    autoFocus
                                                />
                                            </div>
                                        )}
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleStatusUpdate('REJECTED')}
                                                disabled={isUpdating}
                                                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all flex justify-center items-center gap-2 ${showRejectInput ? 'bg-red-500 text-white shadow-md hover:bg-red-600' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20'}`}
                                            >
                                                {isUpdating && actionType === 'REJECTED' ? <MiniLoader className="w-4 h-4" /> : <><XCircle size={16} /> {showRejectInput ? 'Confirm Reject' : 'Reject'}</>}
                                            </button>

                                            {!showRejectInput && (
                                                <button
                                                    onClick={() => handleStatusUpdate('APPROVED')}
                                                    disabled={isUpdating}
                                                    className="flex-1 py-2.5 bg-green-500 text-white rounded-xl font-semibold text-sm transition-all hover:bg-green-600 shadow-md flex justify-center items-center gap-2"
                                                >
                                                    {isUpdating && actionType === 'APPROVED' ? <MiniLoader className="w-4 h-4" /> : <><CheckCircle size={16} /> Approve</>}
                                                </button>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <div className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold ${currentStatus === 'APPROVED' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                            {currentStatus === 'APPROVED' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                                            Currently {currentStatus}
                                        </div>
                                        <button
                                            onClick={() => handleStatusUpdate('PENDING')}
                                            disabled={isUpdating}
                                            className="w-full py-2.5 bg-muted/50 hover:bg-muted text-foreground rounded-xl font-semibold text-sm transition-colors border border-border/50 flex justify-center items-center gap-2"
                                        >
                                            {isUpdating && actionType === 'PENDING' ? <MiniLoader className="w-4 h-4" /> : <><RotateCcw size={16} /> Revert to Pending</>}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Full Screen Document Zoom Overlay */}
            {isZoomed && (
                <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col animate-fade-in">
                    <div className="flex justify-between items-center p-4 bg-black/50 text-white absolute top-0 w-full z-10">
                        <span className="font-semibold text-sm tracking-wider uppercase">Document Viewer</span>
                        <button onClick={() => setIsZoomed(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                    <div className="flex-1 p-4 md:p-12 flex items-center justify-center mt-14 overflow-hidden">
                        {isPdf ? (
                            <iframe
                                src={`${authority.authorityProfile.idProofUrl}#toolbar=0`}
                                className="w-full h-full max-w-5xl bg-white rounded-xl"
                                title="ID Proof PDF"
                            />
                        ) : (
                            <img
                                src={authority.authorityProfile.idProofUrl}
                                alt="ID Proof Zoomed"
                                className="max-w-full max-h-full object-contain rounded-lg"
                            />
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default AuthorityDetailModal;