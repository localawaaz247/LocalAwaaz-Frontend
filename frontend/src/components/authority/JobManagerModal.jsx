import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, Clock, AlertTriangle, UploadCloud, Info, FileText, Plus, LogOut } from 'lucide-react';
import axiosInstance from '../../utils/axios';
import { showToast } from '../../utils/toast';
import Uppy from '@uppy/core';
import AwsS3 from '@uppy/aws-s3';
import { motion, AnimatePresence } from 'framer-motion';
import CustomSelect from '../CustomSelect';

const generateHDThumbnail = (file) => {
    return new Promise((resolve) => {
        const video = document.createElement("video");
        const url = URL.createObjectURL(file);
        video.src = url;
        video.muted = true;
        video.playsInline = true;
        video.preload = "metadata";
        video.onloadeddata = () => { video.currentTime = Math.min(1, video.duration || 0.1); };
        video.onseeked = () => {
            const canvas = document.createElement("canvas");
            canvas.width = 640; canvas.height = 360;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/jpeg", 0.7));
            video.src = ""; video.load(); URL.revokeObjectURL(url);
        };
        video.onerror = () => {
            video.src = ""; video.load(); URL.revokeObjectURL(url); resolve(null);
        };
    });
};

const JobManagerModal = ({ job, onClose, onSuccess }) => {
    const isAwaitingHandover = job.status === 'AWAITING_HANDOVER';
    const [view, setView] = useState(isAwaitingHandover ? 'handover' : 'resolve');
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [remarks, setRemarks] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const uppyRef = useRef(null);
    const isCancelledRef = useRef(false);

    const [timeValue, setTimeValue] = useState('');
    const [timeUnit, setTimeUnit] = useState('HOURS');

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
            previewUrls.forEach(url => { if (url && url.startsWith('blob:')) URL.revokeObjectURL(url); });
            if (uppyRef.current) uppyRef.current.destroy();
        };
    }, [previewUrls]);

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        if (selectedFiles.length + files.length > 3) {
            return showToast({ icon: 'error', title: 'Maximum 3 files allowed.' });
        }

        const currentTotalSize = selectedFiles.reduce((total, file) => total + file.size, 0);
        const newFilesSize = files.reduce((total, file) => total + file.size, 0);
        if (currentTotalSize + newFilesSize > 314572800) {
            return showToast({ icon: 'error', title: 'Total size exceeds the 300MB limit.' });
        }

        const newPreviewUrls = [];
        for (const file of files) {
            if (file.type.startsWith('video/')) {
                const thumbBase64 = await generateHDThumbnail(file);
                newPreviewUrls.push(thumbBase64 || 'https://via.placeholder.com/640x360?text=Video');
            } else if (file.type === 'application/pdf') {
                newPreviewUrls.push('PDF_DOCUMENT');
            } else {
                newPreviewUrls.push(URL.createObjectURL(file));
            }
        }

        setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
        setSelectedFiles(prev => [...prev, ...files]);
        e.target.value = '';
    };

    const handleRemoveFile = (index) => {
        if (previewUrls[index] && previewUrls[index].startsWith('blob:')) {
            URL.revokeObjectURL(previewUrls[index]);
        }
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleCancelAction = () => {
        if (loading) {
            isCancelledRef.current = true;
            if (uppyRef.current) uppyRef.current.cancelAll();
            setLoading(false);
            setUploadProgress(0);
            showToast({ icon: 'info', title: 'Upload stopped.' });
        } else {
            onClose();
        }
    };

    const uploadFilesToCloud = () => {
        return new Promise((resolve, reject) => {
            if (selectedFiles.length === 0) return resolve([]);
            isCancelledRef.current = false;
            const uppy = new Uppy({ autoProceed: true });
            uppyRef.current = uppy;

            uppy.use(AwsS3, {
                limit: 2,
                getChunkSize: () => 10 * 1024 * 1024,
                shouldUseMultipart: true,
                createMultipartUpload: async (file) => {
                    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                    const res = await axiosInstance.post('/multipart/create', { filename: `job-${job._id}-${Date.now()}-${safeName}`, type: file.type, metadata: { category: job.category } });
                    return { uploadId: res.data.uploadId, key: res.data.key };
                },
                signPart: async (file, partData) => {
                    const res = await axiosInstance.post('/multipart/sign', partData);
                    return { url: res.data.url };
                },
                completeMultipartUpload: async (file, uploadData) => {
                    const res = await axiosInstance.post('/multipart/complete', uploadData);
                    return { location: res.data.location };
                },
                abortMultipartUpload: async (file, uploadData) => {
                    await axiosInstance.post('/multipart/abort', uploadData);
                }
            });

            let successUrls = [];
            uppy.on('progress', (progress) => { if (!isCancelledRef.current) setUploadProgress(progress); });
            uppy.on('upload-success', (file, response) => { if (!isCancelledRef.current) successUrls.push(response.body?.location || response.uploadURL); });
            uppy.on('complete', (result) => {
                if (isCancelledRef.current) reject(new Error("UPLOAD_CANCELLED"));
                else if (result.failed.length > 0) reject(new Error("Cloud upload failed for some files."));
                else resolve(successUrls);
            });
            selectedFiles.forEach(f => uppy.addFile({ name: f.name, type: f.type, data: f }));
        });
    };

    // --- ACTIONS ---
    const handleResolveSubmit = async (e) => {
        e.preventDefault();
        if (selectedFiles.length === 0) return showToast({ icon: 'warning', title: 'Please provide proof of resolution.' });
        setLoading(true);
        try {
            const uploadedUrls = await uploadFilesToCloud();
            await axiosInstance.post(`/authority/issues/${job._id}/resolve`, { mediaUrls: uploadedUrls, remarks });
            showToast({ icon: 'success', title: 'Resolution submitted to Escrow!' });
            onSuccess();
        } catch (err) {
            if (err.message !== "UPLOAD_CANCELLED") showToast({ icon: 'error', title: err.response?.data?.message || 'Failed to submit resolution.' });
        } finally {
            if (!isCancelledRef.current) { setLoading(false); setUploadProgress(0); }
        }
    };

    const handleExtendSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axiosInstance.post(`/authority/issues/${job._id}/extend`, { requestedTimeValue: timeValue, requestedTimeUnit: timeUnit, reason: remarks });
            showToast({ icon: 'success', title: 'Extension requested successfully' });
            onSuccess();
        } catch (err) {
            showToast({ icon: 'error', title: err.response?.data?.message || 'Failed to request extension' });
        } finally {
            setLoading(false);
        }
    };

    const handleHandoverSubmit = async (e) => {
        e.preventDefault();
        if (selectedFiles.length === 0) return showToast({ icon: 'warning', title: 'Please upload partial work documents.' });
        setLoading(true);
        try {
            const uploadedUrls = await uploadFilesToCloud();
            await axiosInstance.post(`/authority/issues/${job._id}/handover`, { mediaUrls: uploadedUrls, reasonForFailure: remarks });
            showToast({ icon: 'success', title: 'Handover report submitted.' });
            onSuccess();
        } catch (err) {
            if (err.message !== "UPLOAD_CANCELLED") showToast({ icon: 'error', title: err.response?.data?.message || 'Failed to submit handover' });
        } finally {
            if (!isCancelledRef.current) { setLoading(false); setUploadProgress(0); }
        }
    };

    // 🟢 NEW ACTION: VOLUNTARY RELEASE
    const handleReleaseSubmit = async (e) => {
        e.preventDefault();
        if (!remarks) return showToast({ icon: 'warning', title: 'Please provide a reason for releasing the job.' });
        setLoading(true);
        try {
            await axiosInstance.post(`/authority/issues/${job._id}/release`, { reason: remarks });
            showToast({ icon: 'success', title: 'Job released successfully.' });
            onSuccess();
        } catch (err) {
            showToast({ icon: 'error', title: err.response?.data?.message || 'Failed to release job' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={!loading ? handleCancelAction : undefined} />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-card/95 backdrop-blur-2xl w-full max-w-2xl border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] relative z-10"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border/50 bg-background/30 shrink-0">
                    <div className="overflow-hidden pr-4">
                        <h3 className="text-2xl font-black truncate text-foreground leading-tight">{job.title}</h3>
                        <p className="text-xs font-mono text-muted-foreground mt-1">ID: {job._id}</p>
                    </div>
                    <button onClick={handleCancelAction} className="p-2 bg-card border border-border/50 hover:bg-muted rounded-full transition-colors shrink-0">
                        <X size={20} className="text-foreground" />
                    </button>
                </div>

                {/* Segmented Control Tabs */}
                {!isAwaitingHandover && (
                    <div className="px-6 pt-6 pb-2 shrink-0">
                        <div className="flex bg-background border border-border/50 p-1.5 rounded-2xl shadow-inner gap-1">
                            <button onClick={() => setView('resolve')} disabled={loading} className={`relative flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-2 rounded-xl transition-all duration-300 z-10 ${view === 'resolve' ? 'text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                                {view === 'resolve' && <motion.div layoutId="jobTab" className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-xl" transition={{ type: "spring", stiffness: 500, damping: 30 }} />}
                                <span className="relative z-10 flex items-center gap-1.5"><CheckCircle size={16} /> Resolve</span>
                            </button>
                            <button onClick={() => setView('extend')} disabled={loading} className={`relative flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-2 rounded-xl transition-all duration-300 z-10 ${view === 'extend' ? 'text-amber-500 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                                {view === 'extend' && <motion.div layoutId="jobTab" className="absolute inset-0 bg-amber-500/10 border border-amber-500/20 rounded-xl" transition={{ type: "spring", stiffness: 500, damping: 30 }} />}
                                <span className="relative z-10 flex items-center gap-1.5"><Clock size={16} /> Extend</span>
                            </button>
                            <button onClick={() => setView('release')} disabled={loading} className={`relative flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-2 rounded-xl transition-all duration-300 z-10 ${view === 'release' ? 'text-destructive shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                                {view === 'release' && <motion.div layoutId="jobTab" className="absolute inset-0 bg-destructive/10 border border-destructive/20 rounded-xl" transition={{ type: "spring", stiffness: 500, damping: 30 }} />}
                                <span className="relative z-10 flex items-center gap-1.5"><LogOut size={16} /> Release</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Scrollable Form Area */}
                <div className="p-6 overflow-y-auto thin-scrollbar flex-1 relative bg-background/20">
                    <AnimatePresence mode="wait">

                        {/* RESOLVE / HANDOVER FORMS */}
                        {(view === 'resolve' || view === 'handover') && (
                            <motion.form key="media-form" id="media-form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={view === 'resolve' ? handleResolveSubmit : handleHandoverSubmit} className="space-y-6">
                                {view === 'resolve' ? (
                                    <div className="bg-primary/5 border border-primary/20 p-4 rounded-2xl flex gap-3 shadow-inner">
                                        <Info className="text-primary shrink-0" size={24} />
                                        <p className="text-sm font-medium text-primary/90 leading-relaxed">Submitting resolution evidence places this job into Escrow. The citizen has 72 hours to verify before CSI points are released.</p>
                                    </div>
                                ) : (
                                    <div className="bg-destructive/10 border border-destructive/30 p-4 rounded-2xl flex gap-3 shadow-inner">
                                        <AlertTriangle className="text-destructive shrink-0" size={24} />
                                        <p className="text-sm font-medium text-destructive/90 leading-relaxed"><strong>Deadline Missed!</strong> Submit proof of partial progress within 24 hours to avoid the Ghost Protocol (-100 CSI).</p>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <label className="text-xs font-bold uppercase tracking-widest text-foreground">
                                        {view === 'resolve' ? 'Resolution Evidence (Req)' : 'Proof of Work / Documents (Req)'}
                                    </label>

                                    {selectedFiles.length === 0 ? (
                                        <label className="relative overflow-hidden border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group">
                                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <div className="p-4 bg-background rounded-full shadow-sm mb-4 border border-border/50 group-hover:scale-110 transition-transform"><UploadCloud className="text-primary" size={32} /></div>
                                            <p className="text-base font-bold text-foreground">Click or drag media here</p>
                                            <p className="text-xs font-medium text-muted-foreground mt-2">Accepts Images, Videos (MP4), & PDFs. Max 300MB.</p>
                                            <input type="file" accept="image/*,video/*,application/pdf" multiple className="hidden" onChange={handleFileChange} disabled={loading} />
                                        </label>
                                    ) : (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                            {selectedFiles.map((file, index) => (
                                                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} key={index} className="relative group aspect-square rounded-2xl overflow-hidden border border-border/50 bg-background shadow-sm flex items-center justify-center">
                                                    {previewUrls[index] === 'PDF_DOCUMENT' ? (
                                                        <div className="flex flex-col items-center justify-center text-muted-foreground p-2">
                                                            <FileText size={32} className="mb-2 text-primary" />
                                                            <span className="text-[10px] font-bold uppercase truncate w-full text-center">{file.name}</span>
                                                        </div>
                                                    ) : (
                                                        <img src={previewUrls[index]} alt="Preview" className="w-full h-full object-cover" />
                                                    )}
                                                    {file.type.startsWith('video/') && (
                                                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md rounded-md px-2 py-1">
                                                            <span className="text-[9px] font-black text-white tracking-widest">VIDEO</span>
                                                        </div>
                                                    )}
                                                    {!loading && (
                                                        <button type="button" onClick={() => handleRemoveFile(index)} className="absolute top-2 right-2 bg-destructive/90 backdrop-blur-md text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 hover:bg-destructive shadow-lg">
                                                            <X size={14} />
                                                        </button>
                                                    )}
                                                </motion.div>
                                            ))}
                                            {selectedFiles.length < 3 && !loading && (
                                                <label className="relative flex flex-col items-center justify-center aspect-square rounded-2xl border-2 border-dashed border-border/60 bg-background/50 cursor-pointer hover:bg-muted transition-all group">
                                                    <div className="p-2 bg-card rounded-full shadow-sm mb-2 border border-border/50 group-hover:scale-110 transition-transform"><Plus className="w-5 h-5 text-muted-foreground" /></div>
                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Add</span>
                                                    <input type="file" accept="image/*,video/*,application/pdf" multiple className="hidden" onChange={handleFileChange} />
                                                </label>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-bold uppercase tracking-widest text-foreground">{view === 'resolve' ? 'Closing Remarks (Optional)' : 'Reason for Delay / Abandonment (Req)'}</label>
                                    <textarea required={view === 'handover'} value={remarks} onChange={(e) => setRemarks(e.target.value)} disabled={loading} className="w-full bg-background/50 backdrop-blur-sm border border-border/60 rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none disabled:opacity-50 transition-all shadow-inner" rows="3" placeholder={view === 'resolve' ? "Add final notes..." : "Explain blockages..."} />
                                </div>
                            </motion.form>
                        )}

                        {/* EXTEND FORM */}
                        {view === 'extend' && (
                            <motion.form key="extend-form" id="extend-form" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onSubmit={handleExtendSubmit} className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-1/3 flex flex-col gap-2.5">
                                        <label className="text-xs font-bold uppercase tracking-widest text-foreground">Value</label>
                                        <input
                                            type="number"
                                            min="1"
                                            required
                                            disabled={loading}
                                            value={timeValue}
                                            onChange={(e) => setTimeValue(e.target.value)}
                                            className="w-full h-[42px] px-4 bg-background/50 border border-border/60 rounded-xl text-sm font-bold focus:border-amber-500 outline-none transition-all shadow-inner box-border"
                                            placeholder="e.g. 24"
                                        />
                                    </div>
                                    <div className="w-2/3 flex flex-col gap-2.5">
                                        <label className="text-xs font-bold uppercase tracking-widest text-foreground">Unit</label>
                                        <div className="w-full h-[42px]">
                                            <CustomSelect
                                                options={[{ value: 'HOURS', label: 'Hours' }, { value: 'DAYS', label: 'Days' }, { value: 'WEEKS', label: 'Weeks' }, { value: 'MONTHS', label: 'Months' }]}
                                                value={timeUnit}
                                                onChange={setTimeUnit}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-bold uppercase tracking-widest text-foreground">Justification (Required)</label>
                                    <textarea required disabled={loading} value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full bg-background/50 backdrop-blur-sm border border-border/60 rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none disabled:opacity-50 transition-all shadow-inner resize-none" rows="4" placeholder="Why do you need more time?"></textarea>
                                </div>
                            </motion.form>
                        )}

                        {/* RELEASE FORM */}
                        {view === 'release' && (
                            <motion.form key="release-form" id="release-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleReleaseSubmit} className="space-y-6">
                                <div className="bg-destructive/5 border border-destructive/20 p-4 rounded-2xl flex gap-3 shadow-inner">
                                    <AlertTriangle className="text-destructive shrink-0" size={24} />
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-destructive">Are you sure you want to release this job?</h4>
                                        <p className="text-xs font-medium text-destructive/80 leading-relaxed">
                                            Releasing this job will drop it from your active list and place it back on the radar for other officials to bid on.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-bold uppercase tracking-widest text-foreground">Reason for Release (Required)</label>
                                    <textarea required disabled={loading} value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full bg-background/50 backdrop-blur-sm border border-border/60 rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-destructive/10 focus:border-destructive outline-none disabled:opacity-50 transition-all shadow-inner resize-none" rows="4" placeholder="e.g. Outside of my jurisdiction, lacking resources..."></textarea>
                                </div>
                            </motion.form>
                        )}

                    </AnimatePresence>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-border/50 bg-background/50 backdrop-blur-xl flex justify-end gap-3 rounded-b-3xl relative overflow-hidden shrink-0">
                    {loading && uploadProgress > 0 && (
                        <div className="absolute inset-0 bg-primary/5 flex items-center">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }} className="h-full bg-primary/20" />
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleCancelAction}
                        className={`px-6 py-3 rounded-xl font-bold text-sm border transition-colors relative z-10 shadow-sm hover:scale-[1.02] active:scale-[0.98] ${loading ? 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20' : 'bg-card border-border/60 hover:bg-muted/50'}`}
                    >
                        {loading ? 'Stop Upload' : 'Cancel'}
                    </button>

                    <button
                        type="submit"
                        form={view === 'extend' ? 'extend-form' : view === 'release' ? 'release-form' : 'media-form'}
                        disabled={loading}
                        className={`px-8 py-3 rounded-xl font-black text-sm text-white shadow-lg transition-all disabled:opacity-50 relative z-10 min-w-[160px] hover:scale-[1.02] active:scale-[0.98]
                            ${view === 'resolve' ? 'bg-primary shadow-primary/30 hover:bg-primary/90' : ''}
                            ${view === 'extend' ? 'bg-amber-500 shadow-amber-500/30 hover:bg-amber-600' : ''}
                            ${view === 'release' || view === 'handover' ? 'bg-destructive shadow-destructive/30 hover:bg-destructive/90' : ''}
                        `}
                    >
                        {loading ? (uploadProgress > 0 ? `Uploading (${uploadProgress}%)` : 'Processing...') :
                            view === 'resolve' ? 'Submit to Escrow' :
                                view === 'extend' ? 'Submit Request' :
                                    view === 'release' ? 'Release Job' : 'Submit Handover'}
                    </button>
                </div>

            </motion.div>
        </div>
    );
};

export default JobManagerModal;