import { useState, useEffect, useRef, useCallback } from 'react';

import { useAuth, useE2EE, useSocket, arrayBufferToBase64 } from '../hooks';
import api from '../services/api';
import {
  Send,
  Paperclip,
  Mic,
  ShieldCheck,
  Users,
  FolderGit2,
  FileText,
  Download,
  Loader2,
  MessageSquare,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { AudioRecorder } from '../components/AudioRecorder';
import axios from 'axios';

// Helper: Base64 String to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

interface Message {
  id: string;
  senderId: string;
  senderName?: string;
  recipientId?: string | null;
  groupId?: string | null;
  encryptedContent: string;
  iv: string;
  mediaUrl?: string | null;
  mediaIv?: string | null;
  mediaName?: string | null;
  mediaType?: string | null;
  createdAt: string;
  decryptedContent?: string;
  decryptedMediaUrl?: string | null;
}

interface ChatUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  projectId?: string | null;
  ecdhPublicKey?: string;
  status?: 'online' | 'offline';
}

interface ChatGroup {
  id: string;
  name: string;
  role?: string | null;
  projectId?: string | null;
}

export default function Chat() {
  const { user } = useAuth();
  const userId = user?.id;
  const { socket, onlineUsers } = useSocket();

  // Cryptographic hooks
  const {
    deriveSharedKey,
    encryptPayload,
    decryptPayload,
    encryptFile,
    decryptFile,
    generateGroupKey,
    importRawGroupKey,
  } = useE2EE(userId);

  // States
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [activeRecipient, setActiveRecipient] = useState<ChatUser | null>(null);
  const [activeGroup, setActiveGroup] = useState<ChatGroup | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Group creation modal state
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroupRole, setSelectedGroupRole] = useState('');
  const [selectedGroupProject, setSelectedGroupProject] = useState('');

  // Key Caches
  const sharedKeyCacheRef = useRef<Record<string, CryptoKey>>({});
  const groupKeyCacheRef = useRef<Record<string, CryptoKey>>({});

  // Socket and UI Refs
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 1. Initialize lists & groups
  const loadSidebarData = useCallback(async () => {
    try {
      const [usersRes, groupsRes] = await Promise.all([api.get('/users?chat=true'), api.get('/chats/groups')]);
      const fetchedUsers: ChatUser[] = usersRes.data.data.map((u: any) => ({
        ...u,
        status: onlineUsers.includes(u.id) ? 'online' : 'offline',
      }));
      setUsers(fetchedUsers.filter((u) => u.id !== userId));
      setGroups(groupsRes.data.data);
    } catch (err) {
      console.error('Failed to fetch sidebar listings:', err);
      toast.error('Failed to load chat channels');
    }
  }, [userId, onlineUsers]);

  // Sync users status when onlineUsers updates
  useEffect(() => {
    setUsers((prev) =>
      prev.map((u) => ({
        ...u,
        status: onlineUsers.includes(u.id) ? 'online' : 'offline',
      }))
    );
  }, [onlineUsers]);

  // Load E2EE Group Keys
  const loadGroupKeys = useCallback(async () => {
    try {
      const res = await api.get('/chats/keys');
      const keysList = res.data.data;
      for (const k of keysList) {
        if (!groupKeyCacheRef.current[k.groupId]) {
          try {
            // Find key exchange creator to derive shared key and decrypt group key
            const creatorKeyRes = await api.get(`/users/${k.userId}/public-key`);
            const creatorPublicKey = creatorKeyRes.data.data.ecdhPublicKey;
            const sharedKey = await deriveSharedKey(creatorPublicKey);

            // Decrypt raw group key bytes
            const decryptedRawKeyBase64 = await decryptPayload(k.encryptedKey, k.iv, sharedKey);
            const rawBytes = new Uint8Array(base64ToArrayBuffer(decryptedRawKeyBase64));

            // Import as CryptoKey
            const importedKey = await importRawGroupKey(rawBytes);
            groupKeyCacheRef.current[k.groupId] = importedKey;
          } catch (err) {
            console.error(`Failed to decrypt group key for group ${k.groupId}:`, err);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load E2EE group keys:', err);
    }
  }, [deriveSharedKey, decryptPayload, importRawGroupKey]);

  useEffect(() => {
    if (userId) {
      loadSidebarData();
      loadGroupKeys();
    }
  }, [userId, loadSidebarData, loadGroupKeys]);

  // 1.5 Register Push Notifications
  useEffect(() => {
    const registerPush = async () => {
      if (!userId || !('serviceWorker' in navigator) || !('PushManager' in window)) return;
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        if (Notification.permission === 'default') {
          await Notification.requestPermission();
        }

        if (Notification.permission !== 'granted') return;

        const keyRes = await api.get('/notifications/vapid-public-key');
        const vapidPublicKey = keyRes.data.data.publicKey;
        if (!vapidPublicKey) return;

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64ToArrayBuffer(vapidPublicKey),
        });

        await api.post('/notifications/subscribe', { subscription });
      } catch (err) {
        console.error('Push subscription failed:', err);
      }
    };

    registerPush();
  }, [userId]);

  // 2. Attach WebSocket event listeners
  useEffect(() => {
    if (!socket || !userId) return;

    const handleNewMessage = async (msg: Message) => {
      if (!msg.senderName) {
        const found = users.find((u) => u.id === msg.senderId);
        msg.senderName = found ? found.fullName : 'Team Member';
      }

      const isForActiveGroup = !!(msg.groupId && activeGroup && msg.groupId === activeGroup.id);
      const isForActiveRecipient = !!(msg.recipientId && activeRecipient && (
        (msg.senderId === userId && msg.recipientId === activeRecipient.id) ||
        (msg.senderId === activeRecipient.id && msg.recipientId === userId)
      ));

      if (isForActiveGroup || isForActiveRecipient) {
        const decrypted = await decryptMessage(msg);
        setMessages((prev) => [...prev, decrypted]);
        scrollToBottom();
      } else {
        // Notification toast for background messages
        if (msg.senderId !== userId) {
          toast.info(`🔒 New secure message from ${msg.senderName}`);
        }
      }
    };

    const handlePresenceChange = (payload: { userId: string; status: 'online' | 'offline' }) => {
      setUsers((prev) =>
        prev.map((u) => (u.id === payload.userId ? { ...u, status: payload.status } : u))
      );
    };

    const handleTypingStatus = (payload: { userId: string; userName: string; isTyping: boolean }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [payload.userId]: payload.isTyping,
      }));
    };

    socket.on('new_message', handleNewMessage);
    socket.on('presence_change', handlePresenceChange);
    socket.on('typing_status', handleTypingStatus);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('presence_change', handlePresenceChange);
      socket.off('typing_status', handleTypingStatus);
    };
  }, [socket, userId, users, activeRecipient, activeGroup]);

  // Scroll to bottom helper
  function scrollToBottom() {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  // Get or cache ECDH/AES key for 1:1 user direct chat
  async function getDirectChatKey(otherUser: ChatUser): Promise<CryptoKey> {
    if (sharedKeyCacheRef.current[otherUser.id]) {
      return sharedKeyCacheRef.current[otherUser.id];
    }

    // Fetch recipient public key
    const res = await api.get(`/users/${otherUser.id}/public-key`);
    const jwkPublic = res.data.data.ecdhPublicKey;

    const aesKey = await deriveSharedKey(jwkPublic);
    sharedKeyCacheRef.current[otherUser.id] = aesKey;
    return aesKey;
  }

  // E2EE Decrypt a single message
  async function decryptMessage(msg: Message): Promise<Message> {
    try {
      let aesKey: CryptoKey | null = null;

      if (msg.recipientId) {
        // Direct message
        const otherId = msg.senderId === userId ? msg.recipientId : msg.senderId;
        const otherUser = users.find((u) => u.id === otherId);
        if (otherUser) {
          aesKey = await getDirectChatKey(otherUser);
        }
      } else if (msg.groupId) {
        // Group message
        aesKey = groupKeyCacheRef.current[msg.groupId] || null;
      }

      if (!aesKey) {
        return {
          ...msg,
          decryptedContent: '🔒 Encrypted message (Key unavailable)',
        };
      }

      // Decrypt text content
      const decryptedText = await decryptPayload(msg.encryptedContent, msg.iv, aesKey);
      let decryptedMediaUrl: string | null = null;

      // Handle encrypted media attachments decryption
      if (msg.mediaUrl && msg.mediaIv && msg.mediaType) {
        try {
          // Download encrypted file blob
          const res = await axios.get(msg.mediaUrl, { responseType: 'blob' });
          const decryptedFileBlob = await decryptFile(res.data, msg.mediaIv, aesKey, msg.mediaType);
          decryptedMediaUrl = URL.createObjectURL(decryptedFileBlob);
        } catch (mediaErr) {
          console.error('Failed to decrypt attachment:', mediaErr);
        }
      }

      return {
        ...msg,
        decryptedContent: decryptedText,
        decryptedMediaUrl,
      };
    } catch (err) {
      console.error('Decryption failed for message ID:', msg.id, err);
      return {
        ...msg,
        decryptedContent: '⚠️ Verification failed (Corrupt payload)',
      };
    }
  }

  // 3. Load chat histories
  const loadChatHistory = async (recipient: ChatUser | null, group: ChatGroup | null) => {
    setIsHistoryLoading(true);
    setMessages([]);
    try {
      let url = '/chats/history';
      if (recipient) {
        url += `?recipientId=${recipient.id}`;
      } else if (group) {
        url += `?groupId=${group.id}`;
      }

      const res = await api.get(url);
      const history: Message[] = res.data.data;

      // Decrypt all historical messages
      const decryptedHistory = await Promise.all(history.map((m) => decryptMessage(m)));

      setMessages(decryptedHistory);
      scrollToBottom();
    } catch (err) {
      console.error('Failed to load chat history:', err);
      toast.error('Failed to load conversation history');
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // Change recipient selection
  const handleSelectRecipient = (recipient: ChatUser) => {
    setActiveRecipient(recipient);
    setActiveGroup(null);
    loadChatHistory(recipient, null);
  };

  // Change group selection
  const handleSelectGroup = (group: ChatGroup) => {
    setActiveGroup(group);
    setActiveRecipient(null);
    loadChatHistory(null, group);
  };

  // Emit typing event to socket
  const handleTextInput = (text: string) => {
    setInputText(text);

    if (!isTyping && socket) {
      setIsTyping(true);
      socket.emit('typing', {
        recipientId: activeRecipient?.id,
        groupId: activeGroup?.id,
        isTyping: true,
      });

      // Clear typing indicator after idle duration
      setTimeout(() => {
        setIsTyping(false);
        if (socket) {
          socket.emit('typing', {
            recipientId: activeRecipient?.id,
            groupId: activeGroup?.id,
            isTyping: false,
          });
        }
      }, 3000);
    }
  };

  // 4. Send encrypted text message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !socket) return;

    try {
      let aesKey: CryptoKey | null = null;
      if (activeRecipient) {
        aesKey = await getDirectChatKey(activeRecipient);
      } else if (activeGroup) {
        aesKey = groupKeyCacheRef.current[activeGroup.id] || null;
      }

      if (!aesKey) {
        toast.error('E2EE security key is not initialized for this chat');
        return;
      }

      // Encrypt locally
      const { ciphertext, iv } = await encryptPayload(inputText, aesKey);

      // Emit encrypted payload via WebSocket
      socket.emit('send_message', {
        recipientId: activeRecipient?.id,
        groupId: activeGroup?.id,
        encryptedContent: ciphertext,
        iv,
      });

      setInputText('');
    } catch (err) {
      console.error('Failed to send E2EE message:', err);
      toast.error('Encryption pipeline error');
    }
  };

  // 5. Send encrypted file attachment (image, pdf, document)
  const handleSendFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !socket) return;

    setIsUploading(true);
    try {
      let aesKey: CryptoKey | null = null;
      if (activeRecipient) {
        aesKey = await getDirectChatKey(activeRecipient);
      } else if (activeGroup) {
        aesKey = groupKeyCacheRef.current[activeGroup.id] || null;
      }

      if (!aesKey) {
        toast.error('Security key is not initialized');
        return;
      }

      // 1. Client-Side Encryption of file Blob
      const { encryptedBlob, iv: fileIv } = await encryptFile(file, aesKey);

      // 2. Upload Encrypted Blob to Cloudinary
      const formData = new FormData();
      formData.append('file', encryptedBlob, file.name);

      const uploadRes = await api.post('/chats/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { url } = uploadRes.data.data;

      // 3. Encrypt file name metadata
      const { ciphertext: encFileName, iv: textIv } = await encryptPayload(file.name, aesKey);

      // 4. Send encrypted payload details via WebSocket
      socket.emit('send_message', {
        recipientId: activeRecipient?.id,
        groupId: activeGroup?.id,
        encryptedContent: encFileName,
        iv: textIv,
        mediaUrl: url,
        mediaIv: fileIv,
        mediaName: file.name,
        mediaType: file.type,
      });

      toast.success('Secure file attachment transmitted');
    } catch (err) {
      console.error('File encryption or upload failed:', err);
      toast.error('Attachment upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // 6. Send E2EE Voice Message
  const handleSendVoiceMessage = async (audioBlob: Blob) => {
    setIsUploading(true);
    try {
      let aesKey: CryptoKey | null = null;
      if (activeRecipient) {
        aesKey = await getDirectChatKey(activeRecipient);
      } else if (activeGroup) {
        aesKey = groupKeyCacheRef.current[activeGroup.id] || null;
      }

      if (!aesKey) {
        toast.error('Security key missing');
        return;
      }

      // 1. Encrypt recorded voice Blob
      const { encryptedBlob, iv: voiceIv } = await encryptFile(audioBlob, aesKey);

      // 2. Upload encrypted Voice message to Cloudinary
      const formData = new FormData();
      formData.append('file', encryptedBlob, 'voice_message.webm');

      const uploadRes = await api.post('/chats/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { url } = uploadRes.data.data;

      // 3. Encrypt display label
      const { ciphertext: encLabel, iv: textIv } = await encryptPayload('Voice Message', aesKey);

      // 4. Broadcast
      if (socket) {
        socket.emit('send_message', {
          recipientId: activeRecipient?.id,
          groupId: activeGroup?.id,
          encryptedContent: encLabel,
          iv: textIv,
          mediaUrl: url,
          mediaIv: voiceIv,
          mediaName: 'voice_message.webm',
          mediaType: 'audio/webm',
        });
      }

      setShowVoiceRecorder(false);
      toast.success('Voice message sent');
    } catch (err) {
      console.error('Voice message upload failed:', err);
      toast.error('Voice message dispatch failed');
    } finally {
      setIsUploading(false);
    }
  };

  // 7. Create Group Chat (generates random AES key and encrypts key for members)
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      // 1. Create message group in database
      const createGroupRes = await api.post('/chats/groups', {
        name: newGroupName,
        role: selectedGroupRole || null,
        projectId: selectedGroupProject || null,
      });

      const newGroup = createGroupRes.data.data;

      // 2. Generate random 256-bit AES Group key in browser
      const groupRawKey = await generateGroupKey();

      // Find authorized members for E2EE key distribution mapping
      let members: ChatUser[] = [];
      if (selectedGroupRole) {
        members = users.filter((u) => u.role === selectedGroupRole);
      } else if (selectedGroupProject) {
        members = users.filter((u) => u.projectId === selectedGroupProject);
      } else {
        // Custom group containing everyone for testing
        members = [...users];
      }

      // Include myself in group key mappings
      const currentLoggedInUser = await api.get('/users/profile');
      const meProfile = currentLoggedInUser.data.data;

      const keysListToEncrypt = [...members, { id: meProfile.id, fullName: meProfile.fullName }];

      const encryptedKeysPayload: Array<{ userId: string; encryptedKey: string; iv: string }> = [];

      for (const member of keysListToEncrypt) {
        try {
          // Fetch public key for member
          const pubRes = await api.get(`/users/${member.id}/public-key`);
          const memberJwk = pubRes.data.data.ecdhPublicKey;
          const sharedKey = await deriveSharedKey(memberJwk);

          // Encrypt raw group key bytes using member's 1:1 derived key
          const rawKeyBase64 = arrayBufferToBase64(groupRawKey.buffer as ArrayBuffer);
          const { ciphertext, iv } = await encryptPayload(rawKeyBase64, sharedKey);

          encryptedKeysPayload.push({
            userId: member.id,
            encryptedKey: ciphertext,
            iv,
          });
        } catch (err) {
          console.warn(`Could not encrypt group key for member ${member.fullName}:`, err);
        }
      }

      // Save encrypted group keys to backend
      await api.post('/chats/keys', {
        groupId: newGroup.id,
        keys: encryptedKeysPayload,
      });

      toast.success(`E2EE Group ${newGroupName} created successfully`);
      setShowCreateGroupModal(false);
      setNewGroupName('');
      setSelectedGroupRole('');
      setSelectedGroupProject('');
      loadSidebarData();
      loadGroupKeys();
    } catch (err) {
      console.error('Failed to create E2EE group:', err);
      toast.error('Failed to create group');
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-3xl overflow-hidden border border-border bg-card/45 shadow-2xl backdrop-blur-md">
      {/* Sidebar List Panel */}
      <div className="w-80 border-r border-border flex flex-col bg-background/30">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <MessageSquare size={18} className="text-primary" />
            Workspace Chat
          </h2>
          <button
            onClick={() => setShowCreateGroupModal(true)}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 transition shadow"
          >
            Create Group
          </button>
        </div>

        {/* Scrollable list content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Direct Messages List */}
          <div>
            <div className="text-xs font-bold tracking-wider text-muted-foreground uppercase px-2 mb-2">
              Direct Messages
            </div>
            <div className="space-y-1">
              {users.map((u) => {
                const isActive = activeRecipient?.id === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => handleSelectRecipient(u)}
                    className={`flex items-center gap-3 w-full p-2.5 rounded-xl text-left transition ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'hover:bg-accent hover:text-accent-foreground text-foreground'
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={`data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%238696a0'><rect width='24' height='24' fill='%23e9edef'/><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>`}
                        className="w-10 h-10 rounded-full border border-border"
                        alt={u.fullName}
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background ${
                          u.status === 'online' ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                    </div>
                    <div className="overflow-hidden flex-1">
                      <div className="flex justify-between items-baseline">
                        <span className="font-medium text-sm truncate">{u.fullName}</span>
                      </div>
                      <span
                        className={`text-[10px] uppercase font-semibold block mt-0.5 truncate ${
                          isActive ? 'text-primary-foreground/70' : 'text-primary/70'
                        }`}
                      >
                        {u.role}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group Channels List */}
          <div>
            <div className="text-xs font-bold tracking-wider text-muted-foreground uppercase px-2 mb-2">
              Group Channels
            </div>
            <div className="space-y-1">
              {groups.map((g) => {
                const isActive = activeGroup?.id === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => handleSelectGroup(g)}
                    className={`flex items-center gap-3 w-full p-2.5 rounded-xl text-left transition ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'hover:bg-accent hover:text-accent-foreground text-foreground'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-secondary border border-border">
                      {g.projectId ? (
                        <FolderGit2 size={18} className="text-primary" />
                      ) : (
                        <Users size={18} className="text-indigo-400" />
                      )}
                    </div>
                    <div className="overflow-hidden flex-1">
                      <span className="font-medium text-sm truncate block">{g.name}</span>
                      <span
                        className={`text-[10px] block mt-0.5 ${
                          isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        }`}
                      >
                        {g.projectId ? 'Project Channel' : g.role ? 'Role Channel' : 'Group E2EE'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Panel Area */}
      <div className="flex-1 flex flex-col bg-background/10">
        {activeRecipient || activeGroup ? (
          <>
            {/* Chat header banner */}
            <div className="p-4 border-b border-border bg-card/25 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base flex items-center gap-2">
                  {activeRecipient ? activeRecipient.fullName : activeGroup?.name}
                  {activeRecipient && (
                    <span
                      className={`w-2 h-2 rounded-full ${
                        activeRecipient.status === 'online' ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                  )}
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider font-semibold">
                  {activeRecipient
                    ? `${activeRecipient.role} - Direct Secure Channel`
                    : activeGroup?.projectId
                      ? 'Project Channel'
                      : 'Team E2EE Group'}
                </p>
              </div>

              {/* Secure verification indicator */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium">
                <ShieldCheck size={16} />
                End-to-End Encrypted
              </div>
            </div>

            {/* Chat timeline feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-accent/5">
              {/* E2EE Info banner */}
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-secondary/40 border border-border/50 text-xs text-muted-foreground max-w-xl mx-auto my-2">
                <Info size={16} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">Secure Workspace Communication: </span>
                  All message payloads, images, audio clips, and documents are encrypted directly in your browser. Decryption happens strictly on recipients' endpoints. Your credentials never travel as plaintext.
                </div>
              </div>

              {isHistoryLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-2">
                  <Loader2 className="animate-spin text-primary" size={24} />
                  <span className="text-xs text-muted-foreground">Decrypting chat logs...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-20 text-xs text-muted-foreground italic">
                  Beginning of E2EE secured chat history.
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.senderId === userId;
                  const isVoice = m.mediaType === 'audio/webm';
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%] ${
                        isMe ? 'ml-auto' : 'mr-auto'
                      }`}
                    >
                      <div className="text-[10px] text-muted-foreground mb-1 px-1 flex items-center gap-1">
                        {!isMe && <span className="font-semibold text-foreground">{m.senderName}</span>}
                        <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div
                        className={`p-3 rounded-2xl shadow border ${
                          isMe
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card text-card-foreground border-border'
                        }`}
                      >
                        {/* Encrypted text content display */}
                        <p className="text-sm break-all whitespace-pre-wrap">{m.decryptedContent}</p>

                        {/* Encrypted attachment render */}
                        {m.mediaUrl && (
                          <div className="mt-2.5 border-t border-border/30 pt-2.5 flex flex-col gap-2">
                            {m.decryptedMediaUrl ? (
                              isVoice ? (
                                <audio src={m.decryptedMediaUrl} controls className="max-w-full rounded h-10" />
                              ) : m.mediaType?.startsWith('image/') ? (
                                <img
                                  src={m.decryptedMediaUrl}
                                  alt="Decrypted upload"
                                  className="max-h-60 max-w-full rounded-lg object-contain border border-border/40"
                                />
                              ) : (
                                <a
                                  href={m.decryptedMediaUrl}
                                  download={m.mediaName || 'file'}
                                  className="flex items-center gap-2 p-2 rounded-xl bg-secondary/80 hover:bg-secondary border border-border text-xs text-foreground font-medium transition"
                                >
                                  <FileText size={16} className="text-primary" />
                                  <span className="truncate flex-1 max-w-[150px]">{m.mediaName}</span>
                                  <Download size={14} className="text-muted-foreground shrink-0" />
                                </a>
                              )
                            ) : (
                              <div className="flex items-center gap-2 text-xs text-rose-500 bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
                                <AlertTriangle size={14} />
                                Failed to decrypt attachment
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing indicators */}
              {Object.keys(typingUsers).map((tuId) => {
                if (typingUsers[tuId] && tuId !== userId) {
                  return (
                    <div key={tuId} className="flex items-center gap-1.5 text-[10px] text-muted-foreground px-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-75" />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce delay-150" />
                      <span className="font-semibold ml-1">Typing...</span>
                    </div>
                  );
                }
                return null;
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* Input & Voice panel controls */}
            <div className="p-4 border-t border-border bg-card/25">
              {showVoiceRecorder ? (
                <AudioRecorder
                  onSend={handleSendVoiceMessage}
                  onCancel={() => setShowVoiceRecorder(false)}
                />
              ) : (
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="p-2.5 rounded-xl bg-secondary border border-border hover:bg-accent hover:text-accent-foreground text-muted-foreground transition"
                    title="Attach Encrypted File"
                  >
                    <Paperclip size={18} />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleSendFile}
                    className="hidden"
                    accept="image/*,application/pdf,.doc,.docx,.txt"
                  />

                  <button
                    type="button"
                    onClick={() => setShowVoiceRecorder(true)}
                    className="p-2.5 rounded-xl bg-secondary border border-border hover:bg-accent hover:text-accent-foreground text-muted-foreground transition"
                    title="Record Voice Message"
                  >
                    <Mic size={18} />
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => handleTextInput(e.target.value)}
                    placeholder="Enter E2EE secured message..."
                    className="flex-1 bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-foreground transition"
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className={`p-2.5 rounded-xl transition ${
                      inputText.trim()
                        ? 'bg-primary text-primary-foreground shadow-md hover:bg-primary/95'
                        : 'bg-secondary text-muted-foreground/30 border border-border cursor-not-allowed'
                    }`}
                  >
                    <Send size={18} />
                  </button>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-secondary border border-border mb-2 shadow-inner">
              <ShieldCheck size={32} className="text-primary" />
            </div>
            <h3 className="font-semibold text-lg text-foreground">Secure Communications Hub</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Select a team member or a group channel from the sidebar to establish an end-to-end encrypted direct session.
            </p>
          </div>
        )}
      </div>

      {/* 8. Group creation modal */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
            <h3 className="font-bold text-lg text-foreground mb-4">Create Secure Group Channel</h3>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Group Name</label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Frontend Engineers"
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Restrict to Role (Optional)
                </label>
                <select
                  value={selectedGroupRole}
                  onChange={(e) => {
                    setSelectedGroupRole(e.target.value);
                    setSelectedGroupProject('');
                  }}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-foreground"
                >
                  <option value="">No Role Restriction (Custom Group)</option>
                  <option value="ADMIN">Administrators</option>
                  <option value="MANAGER">Managers</option>
                  <option value="PROJECT_MANAGER">Project Managers</option>
                  <option value="EMPLOYEE">Employees</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">
                  Restrict to Project (Optional)
                </label>
                <select
                  value={selectedGroupProject}
                  onChange={(e) => {
                    setSelectedGroupProject(e.target.value);
                    setSelectedGroupRole('');
                  }}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-foreground"
                >
                  <option value="">No Project Restriction</option>
                  {/* Populate project selections if needed */}
                  <option value="cld7w8r1s00003b5x0w8qol35">General Workspace Project</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border bg-secondary hover:bg-accent text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 text-sm font-semibold transition shadow-md"
                >
                  Create Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
