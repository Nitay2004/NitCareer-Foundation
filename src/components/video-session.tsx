"use client";

import { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import {
    StreamVideo,
    StreamVideoClient,
    Call,
    StreamCall,
    useCallStateHooks,
    ParticipantView,
    User,
    CallingState,
    useCall,
} from "@stream-io/video-react-sdk";
import { StreamChat, Channel as StreamChannel } from "stream-chat";
import {
    Chat,
    Channel,
    MessageList,
    MessageInput,
} from "stream-chat-react";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import "stream-chat-react/dist/css/v2/index.css";

import {
    Video, PhoneOff, Mic, MicOff, VideoOff,
    Lock, Sparkles, Loader2, Shield, Users,
    MessageSquare, ScreenShare, Smile, Circle,
    MoreHorizontal, Maximize2, ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/notifications";

interface VideoSessionRoomProps {
    sessionId: string;
    isExpert?: boolean;
    expertName?: string;
    sessionTitle?: string;
}

export function VideoSessionRoom({
    sessionId,
    isExpert = false,
    expertName = "Expert",
    sessionTitle = "Career Counselling Session"
}: VideoSessionRoomProps) {
    const { user } = useUser();
    const [client, setClient] = useState<StreamVideoClient | null>(null);
    const [chatClient, setChatClient] = useState<StreamChat | null>(null);
    const [channel, setChannel] = useState<StreamChannel | null>(null);
    const [call, setCall] = useState<Call | null>(null);
    const [configError, setConfigError] = useState(false);
    const [permissionError, setPermissionError] = useState(false);
    const [showChat, setShowChat] = useState(true);
    const [showParticipants, setShowParticipants] = useState(false);

    useEffect(() => {
        if (!user) return;

        let active = true;

        const initVideoHub = async () => {
            try {
                const response = await fetch("/api/video/token", { method: "POST" });
                const { token, apiKey, userId, userName, userImage } = await response.json();

                if (!active) return;

                if (!token || !apiKey) {
                    setConfigError(true);
                    return;
                }

                const streamUser: User = {
                    id: userId,
                    name: userName || "User",
                    image: userImage,
                };

                const videoClient = new StreamVideoClient({ apiKey, user: streamUser, token });
                const myCall = videoClient.call("default", `nit-${sessionId.replace(/[^a-zA-Z0-9]/g, '')}`);

                const chatInstance = StreamChat.getInstance(apiKey);
                await chatInstance.connectUser({ id: userId, name: userName, image: userImage }, token);

                const chatChannel = chatInstance.channel("messaging", `chat-${sessionId.replace(/[^a-zA-Z0-9]/g, '')}`, {
                    name: sessionTitle,
                    members: [userId],
                } as any);
                await chatChannel.watch();

                try {
                    await myCall.join({ create: true });
                } catch (err: any) {
                    if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
                        setPermissionError(true);
                    }
                    throw err;
                }

                if (!active) {
                    myCall.leave();
                    videoClient.disconnectUser();
                    chatInstance.disconnectUser();
                    return;
                }

                setClient(videoClient);
                setChatClient(chatInstance);
                setChannel(chatChannel);
                setCall(myCall);
                notify.success("Identity Verified • Hub Active");
            } catch (err) {
                console.error("Video Hub Init Error:", err);
            }
        };

        initVideoHub();

        return () => {
            active = false;
            if (call) call.leave();
            if (client) client.disconnectUser();
            if (chatClient) chatClient.disconnectUser();
        };
    }, [user, sessionId]);

    if (configError) return <ConfigRequiredUI />;
    if (permissionError) return <PermissionsRequiredUI />;
    if (!client || !call || !chatClient || !channel) return <LoadingHub />;

    return (
        <StreamVideo client={client}>
            <StreamCall call={call}>
                <div className="flex flex-col h-screen bg-[#1a1a1a] text-white overflow-hidden font-sans select-none">
                    {/* Main Content Area */}
                    <div className="flex-1 flex overflow-hidden relative">
                        {/* Video Grid */}
                        <div className="flex-1 relative flex items-center justify-center p-4 bg-black">
                            <CustomHubMediaCanvas />
                        </div>

                        {/* Sidebar Chat & Participants */}
                        {(showChat || showParticipants) && (
                            <div className={cn(
                                "bg-[#1a1a1a] border-l border-[#333] flex flex-col animate-in slide-in-from-right-10 duration-300 z-30",
                                "fixed inset-0 md:relative md:w-[360px]"
                            )}>
                                {showParticipants && (
                                    <div className="flex-1 flex flex-col border-b border-[#333] min-h-0">
                                        <div className="p-4 flex items-center justify-between border-b border-[#333] mb-2">
                                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">All Participants</h3>
                                            <Button variant="ghost" size="sm" onClick={() => setShowParticipants(false)} className="text-[#888] hover:text-white">✕</Button>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                            <ParticipantList />
                                        </div>
                                    </div>
                                )}

                                {showChat && (
                                    <div className="flex-[2] flex flex-col min-h-0 bg-black">
                                        <div className="p-4 border-b border-[#333] flex items-center justify-between bg-[#1a1a1a]">
                                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Hub Chat</h3>
                                            <Button variant="ghost" size="sm" onClick={() => setShowChat(false)} className="text-[#888] hover:text-white">✕</Button>
                                        </div>
                                        <Chat client={chatClient} theme="str-chat__theme-dark">
                                            <Channel channel={channel}>
                                                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar-chat px-2">
                                                    <MessageList
                                                        hideDeletedMessages
                                                        disableDateSeparator
                                                        messageActions={[]}
                                                    />
                                                </div>
                                                <div className="p-4 bg-[#1a1a1a] border-t border-[#333]">
                                                    <MessageInput />
                                                </div>
                                            </Channel>
                                        </Chat>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Bottom Control Bar */}
                    <HubControlBar
                        isExpert={isExpert}
                        showChat={showChat}
                        setShowChat={setShowChat}
                        showParticipants={showParticipants}
                        setShowParticipants={setShowParticipants}
                    />
                </div>
            </StreamCall>
        </StreamVideo>
    );
}

function HubControlBar({ isExpert, showChat, setShowChat, showParticipants, setShowParticipants }: any) {
    const { useMicrophoneState, useCameraState, useScreenShareState, useParticipants } = useCallStateHooks();
    const { microphone, isMute: isMicMuted } = useMicrophoneState();
    const { camera, isMute: isCamMuted } = useCameraState();
    const { screenShare, isEnabled: isScreenSharing } = useScreenShareState();
    const participants = useParticipants();

    // High-reliability toggle functions
    const toggleMic = async () => {
        try {
            await microphone.toggle();
            notify.info(!isMicMuted ? "Mic Muted" : "Mic Active");
        } catch (e) {
            notify.error("Microphone Error");
        }
    };

    const toggleCam = async () => {
        try {
            await camera.toggle();
            notify.info(!isCamMuted ? "Camera Offline" : "Feed Active");
        } catch (e) {
            notify.error("Camera Error");
        }
    };

    const handleEndCall = () => {
        window.location.href = "/dashboard";
    };

    return (
        <div className="h-[80px] bg-[#1a1a1a] border-t border-[#333] flex items-center justify-between px-4 md:px-6 z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.5)] overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1 shrink-0">
                <HubControlButton
                    onClick={toggleMic}
                    active={!isMicMuted}
                    icon={isMicMuted ? <MicOff className="h-5 w-5 text-red-500" /> : <Mic className="h-5 w-5" />}
                    label={isMicMuted ? "Unmute" : "Mute"}
                    subIcon={<ChevronUp className="h-3 w-3" />}
                />
                <HubControlButton
                    onClick={toggleCam}
                    active={!isCamMuted}
                    icon={isCamMuted ? <VideoOff className="h-5 w-5 text-red-500" /> : <Video className="h-5 w-5" />}
                    label={isCamMuted ? "Start Video" : "Stop Video"}
                    subIcon={<ChevronUp className="h-3 w-3" />}
                />
            </div>

            <div className="flex items-center gap-1 shrink-0 px-4">
                <HubControlButton
                    onClick={() => setShowParticipants(!showParticipants)}
                    active={showParticipants}
                    icon={<Users className="h-5 w-5" />}
                    label="Participants"
                    count={new Set(participants.map(p => p.userId)).size.toString()}
                />
                <HubControlButton
                    onClick={() => setShowChat(!showChat)}
                    active={showChat}
                    icon={<MessageSquare className="h-5 w-5" />}
                    label="Chat"
                />
                <HubControlButton
                    onClick={() => screenShare.toggle()}
                    active={isScreenSharing}
                    icon={<ScreenShare className={cn("h-5 w-5", isScreenSharing ? "text-red-500" : "text-[#2ecc71]")} />}
                    label={isScreenSharing ? "Stop Share" : "Share Screen"}
                    className={!isScreenSharing ? "text-[#2ecc71]" : ""}
                />
                {isExpert && (
                    <HubControlButton
                        onClick={() => notify.info("Cloud Bridge Syncing")}
                        icon={<Circle className="h-5 w-5" />}
                        label="Record"
                    />
                )}
            </div>

            <div className="shrink-0">
                <Button
                    onClick={handleEndCall}
                    className="bg-[#e74c3c] hover:bg-[#c0392b] text-white font-bold px-4 md:px-6 h-9 rounded-md transition-all active:scale-95 shadow-lg"
                >
                    End
                </Button>
            </div>
        </div>
    );
}

function ParticipantList() {
    const { useParticipants, useLocalParticipant } = useCallStateHooks();
    const participants = useParticipants();
    const localParticipant = useLocalParticipant();

    const uniqueParticipants = participants.filter((p, index, self) =>
        index === self.findIndex((t) => (
            t.userId === p.userId
        ))
    );

    return (
        <div className="space-y-4">
            {uniqueParticipants.map((p) => (
                <div key={p.sessionId} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-md bg-[#333] flex items-center justify-center text-[10px] font-black border border-white/5 uppercase">
                            {p.name?.charAt(0) || "U"}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-white/90">
                                {p.name || "User"}
                                {p.userId === localParticipant?.userId && <span className="text-[#888] font-medium ml-1">(Me)</span>}
                            </span>
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Authorized Payload</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-[#888]">
                        {!p.audioStream ? <MicOff className="h-3.5 w-3.5 text-red-500/60" /> : <Mic className="h-3.5 w-3.5 text-green-500/60" />}
                        {!p.videoStream ? <VideoOff className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5 text-green-500/60" />}
                    </div>
                </div>
            ))}
        </div>
    );
}

function HubControlButton({ icon, label, subIcon, onClick, active, count, className = "" }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex flex-col items-center justify-center h-[64px] min-w-[72px] rounded-lg hover:bg-[#333] transition-all gap-1 group relative active:scale-95 hover:scale-105",
                active && !label.includes("Mute") && !label.includes("Video") ? "bg-[#333]" : "",
                className
            )}
        >
            <div className="relative pointer-events-none">
                {icon}
                {count && <span className="absolute -top-1.5 -right-2 bg-blue-600 text-[10px] font-black px-1.5 min-w-[17px] rounded-full border border-[#1a1a1a] shadow-lg">{count}</span>}
            </div>
            <div className="flex items-center gap-0.5 mt-0.5 pointer-events-none">
                <span className="text-[10px] font-bold text-white/90 leading-tight whitespace-nowrap">{label}</span>
                {subIcon && <span className="opacity-30 group-hover:opacity-100 transition-opacity">{subIcon}</span>}
            </div>
        </button>
    );
}

function CustomHubMediaCanvas() {
    const { useParticipants, useCallCallingState } = useCallStateHooks();
    const participants = useParticipants();
    const callingState = useCallCallingState();

    if (callingState !== CallingState.JOINED) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center gap-6 text-slate-500 bg-[#0a0a0a] rounded-2xl border border-white/5">
                <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse" />
                    <Loader2 className="h-10 w-10 text-blue-500 animate-spin relative z-10" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-bold tracking-widest text-white/50 uppercase">Securing Hub Connection...</p>
                    <p className="text-[10px] text-slate-600 mt-2 font-black uppercase tracking-[0.3em]">NIT INFRASTRUCTURE READY</p>
                </div>
            </div>
        );
    }

    const uniqueParticipants = participants.filter((p, index, self) =>
        index === self.findIndex((t) => (
            t.userId === p.userId
        ))
    );

    const activeSpeaker = uniqueParticipants.find(p => p.isSpeaking) || uniqueParticipants[0];
    const remoteParticipants = uniqueParticipants.filter(p => p.sessionId !== activeSpeaker?.sessionId);

    return (
        <div className="h-full w-full flex flex-col gap-4 animate-in fade-in duration-1000">
            <div className="flex-1 relative rounded-2xl overflow-hidden border border-[#333] shadow-2xl bg-[#0a0a0a]">
                {activeSpeaker ? (
                    <div className="h-full w-full">
                        <ParticipantView participant={activeSpeaker} className="h-full w-full object-cover" />
                        <div className="absolute bottom-6 left-6 flex items-center gap-3 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/10 shadow-2xl">
                            {activeSpeaker.isSpeaking && <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />}
                            <span className="text-[11px] font-black text-white/90 uppercase tracking-wider">{activeSpeaker.name}</span>
                        </div>
                    </div>
                ) : (
                    <div className="h-full w-full bg-[#111] flex flex-col items-center justify-center text-[#444] italic gap-4">
                        <Loader2 className="h-8 w-8 animate-spin opacity-20" />
                        Initializing Hub Stream...
                    </div>
                )}
            </div>

            {remoteParticipants.length > 0 && (
                <div className="h-[140px] flex gap-4 overflow-x-auto pb-2 custom-scrollbar px-2">
                    {remoteParticipants.map(p => (
                        <div key={p.sessionId} className="w-[220px] h-full shrink-0 relative rounded-2xl overflow-hidden border-2 border-[#333] hover:border-blue-500/50 transition-all shadow-xl group">
                            <ParticipantView participant={p} className="h-full w-full object-cover" />
                            <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-black border border-white/5 shadow-lg">
                                {p.name}
                            </div>
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="p-1.5 bg-black/60 rounded-lg backdrop-blur-sm border border-white/5">
                                    {!p.audioStream ? <MicOff className="h-3.5 w-3.5 text-red-500" /> : <Mic className="h-3.5 w-3.5 text-green-500" />}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function LoadingHub() {
    return (
        <div className="flex flex-col h-screen items-center justify-center bg-black text-white font-sans">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Preparing Hub...</p>
        </div>
    );
}

function ConfigRequiredUI() {
    return (
        <div className="flex flex-col h-screen items-center justify-center bg-[#0a0a0a] p-12 text-center text-white">
            <Shield className="h-20 w-20 text-blue-500 mb-8 animate-pulse shadow-[0_0_30px_rgba(59,130,246,0.3)]" />
            <h3 className="text-3xl font-black mb-4 italic uppercase tracking-tighter">Configuration Missing</h3>
            <p className="text-slate-500 text-sm max-w-sm mb-10 font-bold">Please provide authorized NIT infrastructure credentials in your environment layout.</p>
            <Button onClick={() => window.location.reload()} className="bg-white text-black font-black h-14 px-12 rounded-2xl hover:scale-105 transition-transform shadow-2xl">RELOAD BRIDGE</Button>
        </div>
    );
}

function PermissionsRequiredUI() {
    return (
        <div className="flex flex-col h-screen items-center justify-center bg-[#0a0a0a] p-12 text-center text-white">
            <VideoOff className="h-20 w-20 text-red-500 mb-8 animate-bounce shadow-[0_0_30px_rgba(239,68,68,0.2)]" />
            <h3 className="text-3xl font-black mb-4 italic uppercase tracking-tighter text-red-500/90">Media Link Blocked</h3>
            <p className="text-slate-500 text-sm mb-10 max-w-sm font-bold">The NIT Hub requires explicit browser authorization for your camera and microphone payloads.</p>
            <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-500 text-white font-black h-14 px-16 rounded-2xl shadow-2xl hover:scale-105 transition-all">GRANT ACCESS & RE-LINK</Button>
        </div>
    );
}

function cn(...inputs: any) {
    return inputs.filter(Boolean).join(" ");
}
