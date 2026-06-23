import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Bot, User, Plus, AlertTriangle, FileEdit, SendHorizontal, Trophy, Medal } from 'lucide-react'
import { Card } from '../components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import ChatInput from '../components/ChatInput'
import IssueCard from '../components/IssueCard'
import axiosInstance from '../utils/axios'
import { useTranslation } from "react-i18next"
import Uppy from '@uppy/core'
import AwsS3 from '@uppy/aws-s3'

const Assistant = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth?.user);

  const QUICK_FAQS = [
    { icon: "📝", text: t('faq_how_report') },
    { icon: "🕵️‍♂️", text: t('faq_anonymous') },
    { icon: "📍", text: t('faq_near_me') },
    { icon: "🏆", text: t('faq_leaderboard') }
  ];

  const userId = user?._id || 'guest';

  const [messages, setMessages] = useState(() => {
    const saved = sessionStorage.getItem(`lokai_messages_${userId}`);
    if (saved) return JSON.parse(saved).map(msg => ({ ...msg, timestamp: new Date(msg.timestamp) }));
    return [];
  });

  const [chatHistory, setChatHistory] = useState(() => {
    const saved = sessionStorage.getItem(`lokai_history_${userId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [isTyping, setIsTyping] = useState(false);
  const [userLocation, setUserLocation] = useState({ lat: null, lng: null, city: '', address: '' });

  const [draftMedia, setDraftMedia] = useState(null);
  const [awaitingImages, setAwaitingImages] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const savedMessages = sessionStorage.getItem(`lokai_messages_${userId}`);
    if (savedMessages) setMessages(JSON.parse(savedMessages).map(msg => ({ ...msg, timestamp: new Date(msg.timestamp) })));
    else setMessages([]);

    const savedHistory = sessionStorage.getItem(`lokai_history_${userId}`);
    setChatHistory(savedHistory ? JSON.parse(savedHistory) : []);
  }, [userId]);

  useEffect(() => { sessionStorage.setItem(`lokai_messages_${userId}`, JSON.stringify(messages)); }, [messages, userId]);
  useEffect(() => { sessionStorage.setItem(`lokai_history_${userId}`, JSON.stringify(chatHistory)); }, [chatHistory, userId]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages]);

  useEffect(() => {
    const cachedData = localStorage.getItem('cached_geo_location');
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      setUserLocation({ lat: parsed.latitude, lng: parsed.longitude, city: parsed.city, address: parsed.state });
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation(prev => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude })),
        (err) => console.warn("Geolocation blocked:", err.message)
      );
    }
  }, []);

  const handleNewChat = () => {
    setMessages([]);
    setChatHistory([]);
    setDraftMedia(null);
    setAwaitingImages(false);
    sessionStorage.removeItem(`lokai_messages_${userId}`);
    sessionStorage.removeItem(`lokai_history_${userId}`);
  };

  const handleSendMessage = async (textMsg, files = [], fileType = null) => {
    let displayMsg = textMsg;
    if (files.length > 0) {
      displayMsg = textMsg ? `[Attached ${files.length} ${fileType}(s)]: ${textMsg}` : `[Attached ${files.length} ${fileType}(s)]`;
    }

    setMessages(prev => [...prev, { id: Date.now(), type: 'user', content: displayMsg, timestamp: new Date() }]);
    setIsTyping(true);

    if (awaitingImages) {
      if (files.length === 0 || fileType !== 'image') {
        setMessages(prev => [...prev, {
          id: Date.now(),
          type: 'assistant',
          content: "Please upload at least 1 image (up to 3) using the + icon to proceed.",
          timestamp: new Date()
        }]);
        setIsTyping(false);
        return;
      }

      setDraftMedia(prev => ({ ...prev, images: files }));
      setAwaitingImages(false);

      try {
        const response = await fetch(`${import.meta.env.VITE_BASE_URL}/ai/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
          body: JSON.stringify({
            message: "System: Images uploaded successfully. Please ask the user if they want to report anonymously with [Yes] / [No] options.",
            history: chatHistory,
            lat: userLocation.lat,
            lng: userLocation.lng,
            city: user?.contact?.city || user?.city || userLocation.city || 'Unknown'
          })
        });

        const data = await response.json();
        if (data.latestHistory) setChatHistory(data.latestHistory);

        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          type: 'assistant',
          content: data.reply,
          timestamp: new Date()
        }]);
      } catch (error) {
        setMessages(prev => [...prev, { id: Date.now(), type: 'assistant', content: t('lokai_server_err'), timestamp: new Date() }]);
      } finally {
        setIsTyping(false);
      }
      return;
    }

    if (files.length > 0) {
      try {
        const formData = new FormData();
        files.forEach(file => formData.append(fileType === 'image' ? 'images' : 'audio', file));
        formData.append('lat', userLocation.lat || '');
        formData.append('lng', userLocation.lng || '');
        formData.append('city', user?.contact?.city || user?.city || userLocation.city || '');
        formData.append('userHint', textMsg || '');

        const endpoint = fileType === 'image' ? `${import.meta.env.VITE_BASE_URL}/ai/analyze-image` : `${import.meta.env.VITE_BASE_URL}/ai/analyze-audio`;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
          body: formData
        });

        const data = await response.json();

        if (data.success) {
          if (fileType === 'audio') {
            setDraftMedia({ audio: files[0] });
            setAwaitingImages(true);
          } else {
            setDraftMedia({
              images: files,
              previewUrl: URL.createObjectURL(files[0])
            });
          }

          // Context Injection
          const analysisContext = `System: User uploaded media. AI Analysis found -> Title: ${data.analysis.title}, Description: ${data.analysis.description}, Category: ${data.analysis.category}.`;

          setChatHistory(prevHistory => [
            ...prevHistory,
            { role: "user", parts: [{ text: analysisContext }] },
            { role: "model", parts: [{ text: data.chat_message }] }
          ]);

          setMessages(prev => [...prev, {
            id: Date.now(),
            type: 'assistant',
            content: data.chat_message,
            timestamp: new Date()
          }]);
        } else {
          setMessages(prev => [...prev, { id: Date.now(), type: 'assistant', content: data.message || t('lokai_process_media_fail'), timestamp: new Date() }]);
        }
      } catch (error) {
        setMessages(prev => [...prev, { id: Date.now(), type: 'assistant', content: t('lokai_upload_fail'), timestamp: new Date() }]);
      } finally {
        setIsTyping(false);
      }
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
        body: JSON.stringify({
          message: textMsg,
          history: chatHistory,
          lat: userLocation.lat,
          lng: userLocation.lng,
          city: user?.contact?.city || user?.city || userLocation.city || 'Unknown'
        })
      });

      const data = await response.json();
      if (data.latestHistory) setChatHistory(data.latestHistory);

      if (data.toolUsed === 'finalizeReportDraft') {
        const finalDraft = {
          title: data.data.title,
          category: data.data.category,
          description: data.data.description,
          isAnonymous: data.data.isAnonymous,
          location: {
            address: data.data.address || '',
            city: data.data.city || userLocation.city || '',
            district: data.data.district || userLocation.city || '',
            state: data.data.state || '',
            pinCode: data.data.pinCode || '',
            coordinates: [userLocation.lng, userLocation.lat]
          },
          originalFiles: draftMedia?.images,
          previewUrl: draftMedia?.previewUrl
        };
        showDraftCard(finalDraft);
        setDraftMedia(null);
        setIsTyping(false);
        return;
      }

      let displayReply = data.reply;

      // 1. If it's returning Issue Cards, hide the long text and show a clean intro
      if (data.toolUsed && Array.isArray(data.data) && data.data.length > 0) {
        displayReply = t('lokai_relevant_issues', 'Here are the relevant issues I found:');
      }

      // 2. If it's returning the Leaderboard Card, hide the long text and show a clean intro
      if (data.toolUsed === 'getCurrentLeaderboard') {
        displayReply = t('lokai_leaderboard_text', "Here's the current weekly leaderboard:");
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'assistant',
        content: displayReply,
        toolData: data.data,
        toolUsed: data.toolUsed,
        timestamp: new Date()
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now(), type: 'assistant', content: t('lokai_server_err'), timestamp: new Date() }])
    } finally {
      setIsTyping(false);
    }
  };

  const showDraftCard = (draftData) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'assistant',
      content: t('lokai_report_ready'),
      isDraftReport: true,
      draftData: draftData,
      timestamp: new Date()
    }]);
  };

  const handleModifyDraft = (draftData) => {
    navigate('/dashboard/report', { state: { prefilledData: draftData } });
  };

  // 🚀 UPPY MULTIPART INTEGRATION
  const handleDirectSubmit = async (draftData) => {
    setIsTyping(true);
    if (!draftData.originalFiles || draftData.originalFiles.length === 0 || !(draftData.originalFiles[0] instanceof Blob)) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'assistant',
        content: "Oops! Your images were cleared from memory. Please click 'Modify Details' below to quickly re-attach them and submit your report.",
        timestamp: new Date()
      }]);
      setIsTyping(false);
      return;
    }

    try {
      setMessages(prev => [...prev, { id: Date.now(), type: 'assistant', content: t('lokai_submitting_media'), timestamp: new Date() }]);

      let finalMediaUrl = [];

      if (draftData.originalFiles && draftData.originalFiles.length > 0) {
        // Wrapping Uppy into a Promise
        finalMediaUrl = await new Promise((resolve, reject) => {
          const uppy = new Uppy({
            autoProceed: true,
            allowMultipleUploadBatches: false,
            retryDelays: [1000, 3000, 5000]
          });

          uppy.use(AwsS3, {
            limit: 2,
            getChunkSize: () => 10 * 1024 * 1024,
            shouldUseMultipart: true,
            createMultipartUpload: async (file) => {
              const cleanTitle = (draftData.title || 'LokAI_Issue').replace(/[^a-zA-Z0-9]/g, '_');
              const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
              const uniqueId = Math.random().toString(36).substring(2, 8);
              const extension = file.name ? file.name.substring(file.name.lastIndexOf('.')) : '.jpeg';
              const customFileName = `LokAI_${cleanTitle}_${uniqueId}_${dateStr}${extension}`;

              const res = await axiosInstance.post('/multipart/create', {
                filename: customFileName,
                type: file.type,
                metadata: { category: draftData.category, location: draftData.location }
              });
              return { uploadId: res.data.uploadId, key: res.data.key };
            },
            signPart: async (file, partData) => {
              const res = await axiosInstance.post('/multipart/sign', {
                uploadId: partData.uploadId, key: partData.key, partNumber: partData.partNumber
              });
              return { url: res.data.url };
            },
            completeMultipartUpload: async (file, uploadData) => {
              const res = await axiosInstance.post('/multipart/complete', {
                uploadId: uploadData.uploadId, key: uploadData.key, parts: uploadData.parts
              });
              return { location: res.data.location };
            },
            abortMultipartUpload: async (file, uploadData) => {
              await axiosInstance.post('/multipart/abort', { uploadId: uploadData.uploadId, key: uploadData.key });
            }
          });

          let successUrls = [];

          uppy.on('upload-success', (file, response) => {
            successUrls.push(response.body?.location || response.uploadURL);
          });

          uppy.on('complete', (result) => {
            if (result.failed.length > 0) {
              reject(new Error("Media upload failed for some chunks."));
            } else {
              resolve(successUrls);
            }
            uppy.destroy();
          });

          uppy.on('error', (error) => {
            reject(error);
            uppy.destroy();
          });

          // Process files
          draftData.originalFiles.forEach((file, index) => {
            // Ensure Blob is cast as File for Uppy compatibility
            const fileObj = file instanceof File ? file : new File([file], `lokai_upload_${index}.jpeg`, { type: file.type });
            uppy.addFile({ name: fileObj.name, type: fileObj.type, data: fileObj });
          });
        });
      }

      setMessages(prev => [...prev.slice(0, -1), { id: Date.now(), type: 'assistant', content: t('lokai_finalizing'), timestamp: new Date() }]);

      const payload = {
        title: draftData.title,
        category: draftData.category,
        description: draftData.description,
        isAnonymous: draftData.isAnonymous,
        media: finalMediaUrl,
        location: {
          address: draftData.location.address || 'Location not provided',
          city: draftData.location.city,
          district: draftData.location.district || draftData.location.city,
          state: draftData.location.state,
          pinCode: draftData.location.pinCode,
          geoData: {
            type: 'Point',
            coordinates: draftData.location.coordinates || [0, 0]
          }
        }
      };

      const response = await axiosInstance.post('/issue', payload);

      if (response.data && response.data.success) {
        setMessages(prev => [...prev.slice(0, -1), { id: Date.now(), type: 'assistant', content: t('lokai_submit_success'), timestamp: new Date() }]);
      } else {
        throw new Error(response.data?.message || "Server issue creation failed");
      }
    } catch (error) {
      console.error("Direct Submit Error:", error);
      const errorMsg = error.response?.data?.message || error.message;
      setMessages(prev => [...prev.slice(0, -1), { id: Date.now(), type: 'assistant', content: `${t('lokai_submit_fail')} ${errorMsg}`, timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderDataCard = (data) => {
    if (!data || !Array.isArray(data)) return null;
    return (
      <div className="flex flex-col gap-3 md:gap-4 mt-4 w-full max-h-[60vh] md:max-h-[400px] overflow-y-auto thin-scrollbar pr-1 md:pr-2">
        {data.map((issue) => (
          <div
            key={issue._id}
            className="w-full flex-shrink-0"
          >
            <IssueCard
              issue={issue}
              onClick={() => navigate('/dashboard', { state: { selectedIssueId: issue._id } })}
              hideActions={true}
            />
          </div>
        ))}
      </div>
    );
  }

  const renderDraftCard = (draftData) => {
    if (!draftData) return null;

    const isVideo = draftData.originalFiles && draftData.originalFiles[0]?.type?.startsWith('video/');

    return (
      <div className="mt-3 bg-card border border-border/50 rounded-xl overflow-hidden shadow-md max-w-lg">
        <div className="bg-primary/10 px-4 py-2 border-b border-border/50 flex items-center gap-2">
          <AlertTriangle size={16} className="text-primary" />
          <span className="text-sm font-semibold text-primary">{t('draft_report_gen')}</span>
        </div>
        <div className="p-4 flex flex-col gap-3 text-foreground">

          {draftData.previewUrl && (
            <div className="mb-2 h-36 w-full rounded-lg overflow-hidden border border-border/50 bg-black flex items-center justify-center">
              {isVideo ? (
                <video
                  src={`${draftData.previewUrl}#t=0.1`}
                  preload="metadata"
                  className="w-full h-full object-contain"
                  playsInline
                  muted
                />
              ) : (
                <img src={draftData.previewUrl} alt="Report draft" className="w-full h-full object-cover" />
              )}
            </div>
          )}

          <div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">{t('title')}</div>
            <div className="text-sm font-semibold leading-tight">{draftData.title}</div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">{t('category')}</div>
            <div className="text-sm">
              <span className="px-2.5 py-1 bg-muted rounded-full border border-border/50">{t(draftData.category?.toLowerCase()) || draftData.category}</span>
            </div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">{t('desc_draft')}</div>
            <div className="text-xs leading-relaxed text-muted-foreground line-clamp-2">{draftData.description}</div>
          </div>

          <div className="flex items-center gap-2.5 mt-2 pt-3 border-t border-border/50">
            <button
              onClick={() => handleModifyDraft(draftData)}
              className="flex-1 py-2 px-3 flex items-center justify-center gap-2 text-xs font-medium bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors border border-border"
            >
              <FileEdit size={16} /> {t('mod_details')}
            </button>
            <button
              onClick={() => handleDirectSubmit(draftData)}
              disabled={isTyping}
              className="flex-1 py-2 px-3 flex items-center justify-center gap-2 text-xs font-medium bg-primary hover:opacity-90 text-white rounded-lg transition-colors shadow-sm"
            >
              <SendHorizontal size={16} /> {t('submit_now')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderLeaderboardCard = (data) => {
    if (!data || (!data.topCitizens && !data.topAuthorities)) return null;

    return (
      <div className="mt-4 flex flex-col gap-4 w-full animate-fade-in-up">

        {/* TOP CITIZENS CARD */}
        {data.topCitizens?.length > 0 && (
          <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-emerald-500/10 px-4 py-2 border-b border-emerald-500/20 flex items-center gap-2">
              <Trophy size={16} className="text-emerald-600" />
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Top Citizens</span>
            </div>
            <div className="p-2 flex flex-col gap-1">
              {data.topCitizens.map((user, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-6 text-center">
                    <span className={`text-sm font-black ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                      #{user.rank}
                    </span>
                  </div>
                  <Avatar className="h-8 w-8 border border-border/50 shadow-sm">
                    <AvatarImage src={user.profilePic} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate leading-tight">{user.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{user.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-500">{user.score}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest">CSI</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TOP AUTHORITIES CARD */}
        {data.topAuthorities?.length > 0 && (
          <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-blue-500/10 px-4 py-2 border-b border-blue-500/20 flex items-center gap-2">
              <Medal size={16} className="text-blue-600" />
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Top Authorities</span>
            </div>
            <div className="p-2 flex flex-col gap-1">
              {data.topAuthorities.map((auth, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-6 text-center">
                    <span className={`text-sm font-black ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                      #{auth.rank}
                    </span>
                  </div>
                  <Avatar className="h-8 w-8 border border-border/50 shadow-sm">
                    <AvatarImage src={auth.profilePic} className="object-cover" />
                    <AvatarFallback className="bg-blue-500/10 text-blue-600 text-xs font-bold">
                      {auth.name?.charAt(0)?.toUpperCase() || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate leading-tight">{auth.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{auth.department}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-blue-500">{auth.score}</p>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest">CSI</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-texture flex flex-col fixed inset-0 z-30 pb-16 md:relative md:pb-0 md:h-screen">
      <div className="glass-card border-b border-border/50 sticky top-0 z-10 mx-2 my-2 md:mx-4 md:my-2 rounded-lg">
        <div className="flex items-center justify-between p-3 md:p-4">
          <div className="flex items-center space-x-2 md:space-x-3">
            <Avatar className="h-8 w-8 md:h-10 md:w-10">
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                <Bot className="h-4 w-4 md:h-5 md:w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-foreground text-sm md:text-base">LokAI Assistant</h3>
              <div className="flex items-center space-x-2">
                <div className="h-1.5 w-1.5 md:h-2 md:w-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] md:text-xs text-muted-foreground">{t('online')}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleNewChat}
            className='px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm btn-gradient flex items-center gap-1.5 md:gap-2 border rounded-lg text-white'
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('new_chat')}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto thin-scrollbar p-2 md:p-4">
        <div className="max-w-4xl mx-auto">

          {messages.length === 0 && !isTyping && (
            <div className="flex flex-col items-center justify-center text-center py-10 md:py-16 px-4 animate-fade-in-up">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/20">
                <Bot className="h-8 w-8 md:h-10 md:w-10 text-white" />
              </div>
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-3">{t('hello_lokai')}</h2>
              <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto mb-8 leading-relaxed">
                {t('lokai_desc')}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-lg">
                {QUICK_FAQS.map((faq, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(faq.text)}
                    className="flex items-center gap-3.5 px-5 py-3.5 bg-card/60 hover:bg-card border border-border/50 rounded-xl text-left transition-all hover:shadow-md hover:border-primary/30 group"
                  >
                    <span className="text-lg">{faq.icon}</span>
                    <span className="text-xs md:text-sm font-medium text-foreground group-hover:text-primary transition-colors leading-tight">{faq.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => {
            const isLatest = index === messages.length - 1;
            const optionsMatch = message.type === 'assistant' ? message.content.match(/\[(.*?)\]\s*\/\s*\[(.*?)\]/) : null;

            return (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up mb-6`}>
                <div className={`flex items-start gap-2.5 max-w-[95%] md:max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>

                  {message.type === 'assistant' && (
                    <Avatar className="h-7 w-7 md:h-9 md:w-9 flex-shrink-0 mt-1">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                        <Bot className="h-3.5 w-3.5 md:h-4.5 md:w-4.5" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className="flex flex-col gap-1 w-full">
                    <Card className={`glass-card p-3 md:p-4 border ${message.type === 'user'
                      ? 'bg-gradient-to-br from-primary to-secondary text-white border-primary/20 rounded-2xl rounded-tr-sm'
                      : 'bg-card/80 border-border/50 rounded-2xl rounded-tl-sm shadow-sm'
                      }`}>

                      <p className={`text-[14px] md:text-[15px] leading-relaxed whitespace-pre-wrap ${message.type === 'user' ? 'text-white' : 'text-foreground'}`}>
                        {isLatest && optionsMatch && !isTyping
                          ? message.content.replace(/\[(.*?)\]\s*\/\s*\[(.*?)\]/, '')
                          : message.content}
                      </p>

                      {isLatest && optionsMatch && !isTyping && (
                        <div className="flex gap-3 mt-4 pt-3 border-t border-border/50">
                          <button
                            onClick={() => handleSendMessage(optionsMatch[1])}
                            className="flex-1 py-2 px-4 bg-primary/10 border border-primary/30 text-primary font-semibold rounded-xl hover:bg-primary hover:text-primary-foreground transition-all shadow-sm active:scale-95"
                          >
                            {optionsMatch[1]}
                          </button>
                          <button
                            onClick={() => handleSendMessage(optionsMatch[2])}
                            className="flex-1 py-2 px-4 bg-muted border border-border text-foreground font-semibold rounded-xl hover:bg-muted/80 transition-all shadow-sm active:scale-95"
                          >
                            {optionsMatch[2]}
                          </button>
                        </div>
                      )}

                      {/* If it's the leaderboard, render the leaderboard card */}
                      {message.type === 'assistant' && message.toolUsed === 'getCurrentLeaderboard' && renderLeaderboardCard(message.toolData)}

                      {/* For all other standard searches, render the standard issue cards */}
                      {message.type === 'assistant' && message.toolUsed !== 'getCurrentLeaderboard' && message.toolData && renderDataCard(message.toolData)}

                      {/* If it's a draft, render the draft preview */}
                      {message.type === 'assistant' && message.isDraftReport && renderDraftCard(message.draftData)}
                    </Card>
                  </div>

                  {message.type === 'user' && (
                    <Avatar className="h-7 w-7 md:h-9 md:w-9 flex-shrink-0 mt-1">
                      {user?.profilePic ? (
                        <AvatarImage src={user.profilePic} alt="User" className="object-cover" />
                      ) : (
                        <AvatarFallback className="bg-muted text-foreground">
                          {user?.name ? user.name[0].toUpperCase() : <User className="h-3.5 w-3.5 md:h-4.5 md:w-4.5 text-muted-foreground" />}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  )}

                </div>
              </div>
            )
          })}

          {isTyping && (
            <div className="flex justify-start animate-fade-in-up mb-6">
              <div className="flex items-start gap-2.5">
                <Avatar className="h-7 w-7 md:h-9 md:w-9 flex-shrink-0 mt-1">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                    <Bot className="h-3.5 w-3.5 md:h-4.5 md:w-4.5" />
                  </AvatarFallback>
                </Avatar>
                <Card className="glass-card bg-card/80 border-border/50 rounded-2xl rounded-tl-sm p-4">
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  )
}

export default Assistant;