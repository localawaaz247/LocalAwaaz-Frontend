import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Bot, User, Plus, AlertTriangle, FileEdit, SendHorizontal } from 'lucide-react'
import { Card } from '../components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import ChatInput from '../components/ChatInput'
import IssueCard from '../components/IssueCard'
import axiosInstance from '../utils/axios'

const QUICK_FAQS = [
  { icon: "📝", text: "How do I post a report?" },
  { icon: "🕵️‍♂️", text: "Can I post anonymously?" },
  { icon: "📍", text: "What issues are near me?" },
  { icon: "🏆", text: "Show me the city leaderboard" }
];

const Assistant = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth?.user);

  // --- SECURE SESSION STORAGE (Tied to specific User ID) ---
  const userId = user?._id || 'guest';

  const [messages, setMessages] = useState(() => {
    const saved = sessionStorage.getItem(`lokai_messages_${userId}`);
    if (saved) {
      return JSON.parse(saved).map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
    }
    return [];
  });

  const [chatHistory, setChatHistory] = useState(() => {
    const saved = sessionStorage.getItem(`lokai_history_${userId}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [isTyping, setIsTyping] = useState(false)
  const [userLocation, setUserLocation] = useState({ lat: null, lng: null, city: '', address: '' })
  const [pendingReport, setPendingReport] = useState(null)
  const messagesEndRef = useRef(null);

  // --- HANDLE USER SWITCHING IN SAME TAB ---
  // If the logged-in user changes without refreshing the page, swap their chat histories securely
  useEffect(() => {
    const savedMessages = sessionStorage.getItem(`lokai_messages_${userId}`);
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages).map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })));
    } else {
      setMessages([]);
    }

    const savedHistory = sessionStorage.getItem(`lokai_history_${userId}`);
    setChatHistory(savedHistory ? JSON.parse(savedHistory) : []);
    setPendingReport(null);
  }, [userId]);

  // --- SAVE TO USER-SPECIFIC SESSION STORAGE ON CHANGE ---
  useEffect(() => {
    sessionStorage.setItem(`lokai_messages_${userId}`, JSON.stringify(messages));
  }, [messages, userId]);

  useEffect(() => {
    sessionStorage.setItem(`lokai_history_${userId}`, JSON.stringify(chatHistory));
  }, [chatHistory, userId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Get Location
  useEffect(() => {
    const cachedData = localStorage.getItem('cached_geo_location');
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      setUserLocation({
        lat: parsed.latitude,
        lng: parsed.longitude,
        city: parsed.city,
        address: parsed.state // Gives extra context to AI
      });
    } else if (navigator.geolocation) {
      // Fallback if they opened Assistant before Feed
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation(prev => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude })),
        (err) => console.warn("Geolocation blocked:", err.message)
      );
    }
  }, []);

  // Clear Chat Function (Only clears current user's chat)
  const handleNewChat = () => {
    setMessages([]);
    setChatHistory([]);
    setPendingReport(null);
    sessionStorage.removeItem(`lokai_messages_${userId}`);
    sessionStorage.removeItem(`lokai_history_${userId}`);
  };

  const handleSendMessage = async (textMsg, file = null, fileType = null) => {
    let displayMsg = textMsg;
    if (file) {
      displayMsg = textMsg ? `[Attached ${fileType}]: ${textMsg}` : `[Attached ${fileType}]`;
    }
    setMessages(prev => [...prev, { id: Date.now(), type: 'user', content: displayMsg, timestamp: new Date() }]);
    setIsTyping(true);

    if (pendingReport) {
      if (pendingReport.missing === 'image') {
        if (!file || fileType !== 'image') {
          setMessages(prev => [...prev, { id: Date.now(), type: 'assistant', content: "To complete your audio report, please click the '+' icon and upload an image.", timestamp: new Date() }]);
          setIsTyping(false);
          return;
        }
        const updatedDraft = { ...pendingReport.draftData, originalFile: file, previewUrl: URL.createObjectURL(file) };
        checkLocationAndProceed(updatedDraft);
        return;
      }

      if (pendingReport.missing === 'location') {
        const parts = textMsg.split(',').map(s => s.trim());
        if (parts.length >= 3) {
          const updatedDraft = {
            ...pendingReport.draftData,
            location: {
              ...pendingReport.draftData.location,
              state: parts[0],
              city: parts[1],
              pinCode: parts[2],
              coordinates: pendingReport.draftData.location?.coordinates || [userLocation.lng, userLocation.lat]
            }
          };
          showDraftCard(updatedDraft);
          return;
        } else {
          setMessages(prev => [...prev, { id: Date.now(), type: 'assistant', content: "Please provide it exactly as 'State, City, Pincode' (e.g. 'Uttar Pradesh, Sultanpur, 228001').", timestamp: new Date() }]);
          setIsTyping(false);
          return;
        }
      }
    }

    if (file) {
      try {
        const formData = new FormData();
        formData.append(fileType === 'image' ? 'images' : 'audio', file);
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
          let draftData = { ...data.analysis };

          if (fileType === 'image') {
            draftData.originalFile = file;
            draftData.previewUrl = URL.createObjectURL(file);
            checkLocationAndProceed(draftData);
          } else if (fileType === 'audio') {
            setPendingReport({ draftData, missing: 'image' });
            setMessages(prev => [...prev, {
              id: Date.now(),
              type: 'assistant',
              content: "I've drafted the report from your audio! However, LocalAwaaz requires an image for all issues. Please click the '+' icon to upload an image of the problem (max 30MB).",
              timestamp: new Date()
            }]);
          }
        } else {
          setMessages(prev => [...prev, { id: Date.now(), type: 'assistant', content: data.message || "I couldn't process that media properly.", timestamp: new Date() }]);
        }
      } catch (error) {
        setMessages(prev => [...prev, { id: Date.now(), type: 'assistant', content: "Failed to upload and analyze media.", timestamp: new Date() }]);
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
          city: user?.contact?.city || user?.city || userLocation.city || 'Unknown',
          userName: user?.name || 'Citizen'
        })
      });

      const data = await response.json();
      if (data.latestHistory) setChatHistory(data.latestHistory);

      let displayReply = data.reply;
      if (data.toolUsed && Array.isArray(data.data) && data.data.length > 0) {
        displayReply = "Here are the most relevant issues I found based on your request:";
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
      setMessages(prev => [...prev, { id: Date.now(), type: 'assistant', content: "Sorry, I am having trouble connecting to the server.", timestamp: new Date() }])
    } finally {
      setIsTyping(false);
    }
  };

  const checkLocationAndProceed = (draftData) => {
    const finalLng = draftData.location?.coordinates?.[0] || userLocation.lng;
    const finalLat = draftData.location?.coordinates?.[1] || userLocation.lat;

    if (!finalLng || !finalLat) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'assistant',
        content: "I need your exact GPS coordinates to submit this report. Since location services are disabled, please click 'Modify Details' to capture your location on the map.",
        isDraftReport: true,
        draftData: draftData,
        timestamp: new Date()
      }]);
      setPendingReport(null);
      setIsTyping(false);
      return;
    }

    if (!draftData.location?.state || !draftData.location?.city || !draftData.location?.pinCode) {
      const draftWithCoords = { ...draftData, location: { ...draftData.location, coordinates: [finalLng, finalLat] } };
      setPendingReport({ draftData: draftWithCoords, missing: 'location' });
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'assistant',
        content: "To complete your draft, I need your State, City, and Pincode. Please reply with them separated by commas (e.g. 'Uttar Pradesh, Sultanpur, 228001').",
        timestamp: new Date()
      }]);
      setIsTyping(false);
      return;
    }

    showDraftCard(draftData);
  };

  const showDraftCard = (draftData) => {
    setPendingReport(null);
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'assistant',
      content: "Your report is ready! What would you like to do?",
      isDraftReport: true,
      draftData: draftData,
      timestamp: new Date()
    }]);
    setIsTyping(false);
  };

  const handleModifyDraft = (draftData) => {
    setPendingReport(null);
    navigate('/dashboard/report', { state: { prefilledData: draftData } });
  };

  const handleDirectSubmit = async (draftData) => {
    setIsTyping(true);
    try {
      setMessages(prev => [...prev, { id: Date.now(), type: 'assistant', content: "[1/2] Uploading media to LocalAwaaz...", timestamp: new Date() }]);

      let finalMediaUrl = [];
      if (draftData.originalFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('issue_media', draftData.originalFile);

        const uploadRes = await axiosInstance.post('/upload-issues', uploadFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (!uploadRes.data || !uploadRes.data.success || !uploadRes.data.media) {
          throw new Error("Failed to upload media to server");
        }
        finalMediaUrl = Array.isArray(uploadRes.data.media) ? uploadRes.data.media : [uploadRes.data.media];
      }

      setMessages(prev => [...prev.slice(0, -1), { id: Date.now(), type: 'assistant', content: "[2/2] Finalizing report...", timestamp: new Date() }]);

      const payload = {
        title: draftData.title,
        category: draftData.category,
        description: draftData.description,
        isAnonymous: false,
        media: finalMediaUrl,
        location: {
          address: draftData.location.address || 'Location not provided',
          city: draftData.location.city,
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
        setMessages(prev => [...prev.slice(0, -1), { id: Date.now(), type: 'assistant', content: "Success! Your issue has been officially reported to LocalAwaaz.", timestamp: new Date() }]);
      } else {
        throw new Error(response.data?.message || "Server issue creation failed");
      }
    } catch (error) {
      console.error("Direct Submit Error:", error);
      const errorMsg = error.response?.data?.message || error.message;
      setMessages(prev => [...prev.slice(0, -1), { id: Date.now(), type: 'assistant', content: `Failed to submit directly: ${errorMsg}`, timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderDataCard = (data) => {
    if (!data || !Array.isArray(data)) return null;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
        {data.map((issue) => (
          <IssueCard
            key={issue._id}
            issue={issue}
            onClick={() => navigate(`/dashboard/issue/${issue._id}`)}
            onFlagClick={() => console.log("Flagging issue:", issue._id)}
          />
        ))}
      </div>
    );
  }

  const renderDraftCard = (draftData) => {
    if (!draftData) return null;
    return (
      <div className="mt-3 bg-card border border-border/50 rounded-xl overflow-hidden shadow-md max-w-lg">
        <div className="bg-primary/10 px-4 py-2 border-b border-border/50 flex items-center gap-2">
          <AlertTriangle size={16} className="text-primary" />
          <span className="text-sm font-semibold text-primary">Draft Report Generated</span>
        </div>
        <div className="p-4 flex flex-col gap-3 text-foreground">

          {draftData.previewUrl && (
            <div className="mb-2 h-36 w-full rounded-lg overflow-hidden border border-border/50">
              <img src={draftData.previewUrl} alt="Report draft" className="w-full h-full object-cover" />
            </div>
          )}

          <div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">Title</div>
            <div className="text-sm font-semibold leading-tight">{draftData.title}</div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Category</div>
            <div className="text-sm">
              <span className="px-2.5 py-1 bg-muted rounded-full border border-border/50">{draftData.category}</span>
            </div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">Description Draft</div>
            <div className="text-xs leading-relaxed text-muted-foreground line-clamp-2">{draftData.description}</div>
          </div>

          <div className="flex items-center gap-2.5 mt-2 pt-3 border-t border-border/50">
            <button
              onClick={() => handleModifyDraft(draftData)}
              className="flex-1 py-2 px-3 flex items-center justify-center gap-2 text-xs font-medium bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors border border-border"
            >
              <FileEdit size={16} /> Modify Details
            </button>
            <button
              onClick={() => handleDirectSubmit(draftData)}
              className="flex-1 py-2 px-3 flex items-center justify-center gap-2 text-xs font-medium bg-primary hover:opacity-90 text-white rounded-lg transition-colors shadow-sm"
            >
              <SendHorizontal size={16} /> Submit Now
            </button>
          </div>
        </div>
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
                <span className="text-[10px] md:text-xs text-muted-foreground">Online</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleNewChat}
            className='px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm btn-gradient flex items-center gap-1.5 md:gap-2 border rounded-lg text-white'
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Chat</span>
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
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-3">Hello! I'm LokAI</h2>
              <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto mb-8 leading-relaxed">
                Your civic assistant. Describe an issue, check your city's leaderboard, or upload a photo/audio to instantly draft a report.
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

          {messages.map((message) => (
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
                      {message.content}
                    </p>

                    {message.type === 'assistant' && message.toolData && renderDataCard(message.toolData)}
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
          ))}

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

export default Assistant