import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, MoreHorizontal, SendHorizontal, Smile } from "lucide-react";
import EmojiPicker from "emoji-picker-react";

import api from "../api/axios";
import socket from "../socket";
import Avatar from "../components/ui/Avatar";
import Loader from "../components/ui/Loader";
import { useAuth } from "../context/AuthContext";

import "../styles/messages.css";

const getCurrentUserId = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.userId || payload.id || payload._id || null;
  } catch {
    return null;
  }
};

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const loadedChatRef = useRef(null);
  const emojiRef = useRef(null);
  const inputRef = useRef(null);

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [editingMessage, setEditingMessage] = useState(null);
  const [openMessageMenuId, setOpenMessageMenuId] = useState(null);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState("");

  const currentUserId = user?._id || getCurrentUserId();
  const userIdFromUrl = searchParams.get("user");
  const activeUserId = activeChat?.user?._id;

  const [currentTime] = useState(() => new Date().getTime());

  const getChatRoom = () => {
    if (!currentUserId || !activeUserId) return null;
    return [currentUserId, activeUserId].sort().join("_");
  };

  useEffect(() => {
    const getChats = async () => {
      if (!currentUserId) return;

      try {
        setIsLoadingChats(true);
        setError("");

        const { data } = await api.get("/messages");
        setChats(data);

        if (!userIdFromUrl) {
          setActiveChat(null);
          setMessages([]);
          return;
        }

        const existingChat = data.find(
          (chat) => chat.user._id === userIdFromUrl,
        );

        if (existingChat) {
          setActiveChat(existingChat);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load chats");
      } finally {
        setIsLoadingChats(false);
      }
    };

    getChats();
  }, [currentUserId, userIdFromUrl]);

  useEffect(() => {
    const openChatFromProfile = async () => {
      if (!userIdFromUrl || !currentUserId) return;

      const existingChat = chats.find(
        (chat) => chat.user._id === userIdFromUrl,
      );

      if (existingChat) {
        setActiveChat((prev) =>
          prev?.user?._id === existingChat.user._id ? prev : existingChat,
        );
        return;
      }

      if (activeChat?.user?._id === userIdFromUrl) return;

      try {
        const { data } = await api.get(`/users/${userIdFromUrl}`);

        setActiveChat({
          user: data.user,
          lastMessage: "",
          lastMessageDate: null,
          lastMessageSeen: false,
          lastMessageSender: null,
          unreadCount: 0,
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to open chat");
      }
    };

    openChatFromProfile();
  }, [userIdFromUrl, currentUserId, chats, activeChat?.user?._id]);

  useEffect(() => {
    loadedChatRef.current = null;
  }, [activeUserId]);

  useEffect(() => {
    const getMessages = async () => {
      if (!activeUserId || !currentUserId) return;

      const chatKey = `${currentUserId}_${activeUserId}`;

      if (loadedChatRef.current === chatKey) return;
      loadedChatRef.current = chatKey;

      try {
        setIsLoadingMessages(true);
        setTypingUser(null);
        setError("");

        const { data } = await api.get(`/messages/${activeUserId}`);
        setMessages(data);

        const chatRoom = [currentUserId, activeUserId].sort().join("_");

        socket.emit("joinUserRoom", currentUserId);
        socket.emit("joinChat", chatRoom);

        await api.put(`/messages/${activeUserId}/seen`);

        setChats((prev) =>
          prev.map((chat) =>
            chat.user._id === activeUserId
              ? {
                  ...chat,
                  unreadCount: 0,
                  lastMessageSeen: true,
                }
              : chat,
          ),
        );
      } catch (err) {
        loadedChatRef.current = null;
        setError(err.response?.data?.message || "Failed to load messages");
      } finally {
        setIsLoadingMessages(false);
      }
    };

    getMessages();
  }, [activeUserId, currentUserId]);

  useEffect(() => {
    const handleNewMessage = (newMessage) => {
      const senderId = newMessage.sender?._id || newMessage.sender;
      const receiverId = newMessage.receiver?._id || newMessage.receiver;

      const isMessageForActiveChat =
        senderId === activeUserId || receiverId === activeUserId;

      if (isMessageForActiveChat) {
        setMessages((prev) => {
          const exists = prev.some((message) => message._id === newMessage._id);
          return exists ? prev : [...prev, newMessage];
        });

        if (senderId !== currentUserId && activeUserId) {
          api.put(`/messages/${activeUserId}/seen`).catch(() => {});
        }
      }

      const otherUser =
        senderId === currentUserId ? newMessage.receiver : newMessage.sender;

      setChats((prev) => {
        const chatExists = prev.some((chat) => chat.user._id === otherUser._id);

        if (!chatExists) {
          return [
            {
              user: otherUser,
              lastMessage: newMessage.text,
              lastMessageDate: newMessage.createdAt,
              lastMessageSeen: newMessage.isSeen,
              lastMessageSender: senderId,
              unreadCount:
                senderId !== currentUserId && senderId !== activeUserId ? 1 : 0,
            },
            ...prev,
          ];
        }

        return prev.map((chat) => {
          if (chat.user._id !== otherUser._id) return chat;

          const shouldIncreaseUnread =
            senderId !== currentUserId && chat.user._id !== activeUserId;

          return {
            ...chat,
            lastMessage: newMessage.text,
            lastMessageDate: newMessage.createdAt,
            lastMessageSeen: newMessage.isSeen,
            lastMessageSender: senderId,
            unreadCount: shouldIncreaseUnread
              ? (chat.unreadCount || 0) + 1
              : chat.user._id === activeUserId
                ? 0
                : chat.unreadCount || 0,
          };
        });
      });
    };

    const handleMessagesSeen = ({ seenBy }) => {
      setMessages((prev) =>
        prev.map((message) => {
          const senderId = message.sender?._id || message.sender;

          if (senderId === currentUserId) {
            return {
              ...message,
              isSeen: true,
              seenAt: new Date().toISOString(),
            };
          }

          return message;
        }),
      );

      setChats((prev) =>
        prev.map((chat) =>
          chat.user._id === seenBy
            ? {
                ...chat,
                lastMessageSeen: true,
              }
            : chat,
        ),
      );
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messagesSeen", handleMessagesSeen);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messagesSeen", handleMessagesSeen);
    };
  }, [currentUserId, activeUserId]);

  useEffect(() => {
    const handleTyping = (typingUserData) => {
      setTypingUser(typingUserData);
    };

    const handleStopTyping = () => {
      setTypingUser(null);
    };

    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);

    return () => {
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
    };
  }, []);

  useEffect(() => {
    const handleOnlineUsers = (users) => {
      setOnlineUsers(users);
    };

    socket.on("onlineUsers", handleOnlineUsers);

    return () => {
      socket.off("onlineUsers", handleOnlineUsers);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target)) {
        setIsEmojiOpen(false);
      }

      if (
        !event.target.closest(".message-menu-wrap") &&
        !event.target.closest(".chat-menu-wrap")
      ) {
        setOpenMessageMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  const handleSelectChat = (chat) => {
    loadedChatRef.current = null;
    setEditingMessage(null);
    setOpenMessageMenuId(null);
    setMessageText("");
    setActiveChat(chat);
    navigate(`/messages?user=${chat.user._id}`);
  };

  const handleBackToChats = () => {
    loadedChatRef.current = null;
    setActiveChat(null);
    setMessages([]);
    setEditingMessage(null);
    setOpenMessageMenuId(null);
    setMessageText("");
    navigate("/messages");
  };

  const handleMessageChange = (event) => {
    const value = event.target.value;
    setMessageText(value);

    if (editingMessage) return;

    const chatRoom = getChatRoom();

    if (!chatRoom || !currentUserId) return;

    socket.emit("typing", {
      chatRoom,
      user: {
        _id: currentUserId,
        username: user?.username,
      },
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", chatRoom);
    }, 1200);
  };

  const handleEmojiClick = (emojiData) => {
    setMessageText((prev) => prev + emojiData.emoji);
    setIsEmojiOpen(false);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const toggleMessageMenu = (messageId) => {
    setOpenMessageMenuId((prev) => (prev === messageId ? null : messageId));
  };

  const startEditingMessage = (message) => {
    if (message.messageType === "post" || message.sharedPost) {
      return;
    }

    setEditingMessage(message);
    setMessageText(message.text);
    setOpenMessageMenuId(null);
    setIsEmojiOpen(false);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await api.delete(`/messages/message/${messageId}`);

      setMessages((prev) =>
        prev.filter((message) => message._id !== messageId),
      );

      const chatsResponse = await api.get("/messages");
      setChats(chatsResponse.data);
      setOpenMessageMenuId(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete message");
    }
  };

  const handleDeleteChat = async (userId) => {
    try {
      await api.delete(`/messages/chat/${userId}`);

      setChats((prev) => prev.filter((chat) => chat.user._id !== userId));

      if (activeUserId === userId) {
        setActiveChat(null);
        setMessages([]);
        setEditingMessage(null);
        setMessageText("");
        navigate("/messages");
      }

      setOpenMessageMenuId(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete chat");
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();

    if (!messageText.trim()) return;

    try {
      if (editingMessage) {
        const { data } = await api.put(
          `/messages/message/${editingMessage._id}`,
          {
            text: messageText.trim(),
          },
        );

        setMessages((prev) =>
          prev.map((message) =>
            message._id === editingMessage._id ? data : message,
          ),
        );

        const chatsResponse = await api.get("/messages");
        setChats(chatsResponse.data);

        setEditingMessage(null);
        setMessageText("");
        return;
      }

      if (!activeUserId) return;

      const chatRoom = getChatRoom();

      if (chatRoom) {
        socket.emit("stopTyping", chatRoom);
      }

      const { data } = await api.post("/messages", {
        receiver: activeUserId,
        text: messageText.trim(),
      });

      setMessages((prev) => {
        const exists = prev.some((message) => message._id === data._id);
        return exists ? prev : [...prev, data];
      });

      const chatsResponse = await api.get("/messages");
      setChats(chatsResponse.data);

      setMessageText("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save message");
    }
  };

  const formatTime = (date) => {
    if (!date) return "";

    const diff = currentTime - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;

    return `${days}d`;
  };

  const formatMessageDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getLastOwnMessageId = () => {
    const ownMessages = messages.filter((message) => {
      const senderId = message.sender?._id || message.sender;
      return senderId === currentUserId;
    });

    return ownMessages.at(-1)?._id;
  };

  if (isLoadingChats) {
    return <Loader />;
  }

  const lastOwnMessageId = getLastOwnMessageId();

  return (
    <main
      className={`messages-page ${activeChat ? "chat-open" : "chat-list-open"}`}
    >
      <section className="messages-list-panel">
        <h2 className="messages-account">{user?.username || "Messages"}</h2>

        {error && <p className="messages-error">{error}</p>}

        {chats.length === 0 && (
          <p className="messages-empty">No messages yet.</p>
        )}

        <div className="messages-chat-list">
          {chats.map((chat) => {
            const isOnline = onlineUsers.includes(chat.user._id);

            return (
              <div
                key={chat.user._id}
                className={`messages-chat-item ${
                  activeUserId === chat.user._id ? "active" : ""
                }`}
                onClick={() => handleSelectChat(chat)}
              >
                <div className="messages-avatar-wrap">
                  <Avatar
                    src={chat.user.avatar}
                    name={chat.user.username || chat.user.fullName}
                    size={52}
                  />

                  {isOnline && <span className="messages-online-dot" />}
                </div>

                <div className="messages-chat-info">
                  <strong>{chat.user.username}</strong>

                  <span>
                    {typingUser?._id === chat.user._id
                      ? "typing..."
                      : `${chat.lastMessage || "No messages yet"} ${
                          chat.lastMessageDate
                            ? `· ${formatTime(chat.lastMessageDate)}`
                            : ""
                        }`}
                  </span>
                </div>

                {chat.unreadCount > 0 && (
                  <span className="chat-unread-badge">
                    {chat.unreadCount > 9 ? "9+" : chat.unreadCount}
                  </span>
                )}

                <div
                  className="chat-menu-wrap"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    type="button"
                    className="chat-menu-button"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleMessageMenu(`chat-${chat.user._id}`);
                    }}
                  >
                    <MoreHorizontal size={18} />
                  </button>

                  {openMessageMenuId === `chat-${chat.user._id}` && (
                    <div className="chat-menu-dropdown">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeleteChat(chat.user._id);
                        }}
                      >
                        Delete chat
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="messages-conversation">
        {!activeChat ? (
          <div className="messages-no-chat">
            <h2>Your messages</h2>
            <p>Choose a chat or open a profile to start messaging.</p>
          </div>
        ) : (
          <>
            <header className="messages-conversation-header">
              <button
                type="button"
                className="messages-back-button"
                onClick={handleBackToChats}
              >
                <ArrowLeft size={22} />
              </button>

              <Link
                to={`/users/${activeChat.user._id}`}
                className="messages-header-user"
              >
                <div className="messages-avatar-wrap">
                  <Avatar
                    src={activeChat.user.avatar}
                    name={activeChat.user.username || activeChat.user.fullName}
                    size={40}
                  />

                  {onlineUsers.includes(activeChat.user._id) && (
                    <span className="messages-online-dot small" />
                  )}
                </div>

                <div className="messages-header-info">
                  <strong>{activeChat.user.username}</strong>
                  <span>
                    {typingUser?._id === activeChat.user._id
                      ? "typing..."
                      : onlineUsers.includes(activeChat.user._id)
                        ? "Active now"
                        : "Offline"}
                  </span>
                </div>
              </Link>
            </header>

            <div className="messages-conversation-body">
              <div className="messages-profile-preview">
                <div className="messages-avatar-wrap">
                  <Avatar
                    src={activeChat.user.avatar}
                    name={activeChat.user.username || activeChat.user.fullName}
                    size={96}
                  />

                  {onlineUsers.includes(activeChat.user._id) && (
                    <span className="messages-online-dot large" />
                  )}
                </div>

                <h3>{activeChat.user.username}</h3>
                <p>{activeChat.user.fullName} · ICHgram</p>

                <Link
                  to={`/users/${activeChat.user._id}`}
                  className="messages-view-profile"
                >
                  View profile
                </Link>
              </div>

              {isLoadingMessages ? (
                <Loader />
              ) : (
                <>
                  {messages.length > 0 && (
                    <p className="messages-date">
                      {formatMessageDate(messages[0].createdAt)}
                    </p>
                  )}

                  <div className="messages-bubbles">
                    {messages.map((message) => {
                      const senderId = message.sender?._id || message.sender;
                      const isOwnMessage = senderId === currentUserId;
                      const isLastOwnMessage = message._id === lastOwnMessageId;

                      return (
                        <div
                          key={message._id}
                          className={`message-row ${
                            isOwnMessage ? "own" : "other"
                          }`}
                        >
                          {isOwnMessage ? (
                            <>
                              <div className="message-menu-wrap">
                                <button
                                  type="button"
                                  className="message-menu-button"
                                  onClick={() => toggleMessageMenu(message._id)}
                                >
                                  <MoreHorizontal size={18} />
                                </button>

                                {openMessageMenuId === message._id && (
                                  <div className="message-menu-dropdown">
                                    {message.messageType !== "post" &&
                                      !message.sharedPost && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            startEditingMessage(message)
                                          }
                                        >
                                          Edit
                                        </button>
                                      )}

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteMessage(message._id)
                                      }
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>

                              <div className="message-content">
                                {message.messageType === "post" &&
                                message.sharedPost ? (
                                  <div className="shared-post-message">
                                    <img
                                      src={message.sharedPost.image}
                                      alt={
                                        message.sharedPost.caption ||
                                        "Shared post"
                                      }
                                    />

                                    <div className="shared-post-message-info">
                                      <strong>
                                        {message.sharedPost.author?.username}
                                      </strong>

                                      <span>{message.sharedPost.caption}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="message-bubble sent">
                                    {message.text}
                                  </div>
                                )}

                                <span className="message-time">
                                  {formatTime(message.createdAt)}
                                </span>

                                {isLastOwnMessage && (
                                  <span
                                    className={`message-status ${
                                      message.isSeen ? "seen" : "sent"
                                    }`}
                                  >
                                    {message.isSeen ? "✓✓ Seen" : "✓ Sent"}
                                  </span>
                                )}
                              </div>

                              <Avatar
                                src={user?.avatar}
                                name={user?.username}
                                size={28}
                              />
                            </>
                          ) : (
                            <>
                              <Avatar
                                src={message.sender?.avatar}
                                name={message.sender?.username}
                                size={28}
                              />

                              <div className="message-content">
                                {message.messageType === "post" &&
                                message.sharedPost ? (
                                  <div className="shared-post-message">
                                    <img
                                      src={message.sharedPost.image}
                                      alt={
                                        message.sharedPost.caption ||
                                        "Shared post"
                                      }
                                    />

                                    <div className="shared-post-message-info">
                                      <strong>
                                        {message.sharedPost.author?.username}
                                      </strong>

                                      <span>{message.sharedPost.caption}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="message-bubble received">
                                    {message.text}
                                  </div>
                                )}

                                <span className="message-time">
                                  {formatTime(message.createdAt)}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}

                    {typingUser?._id === activeChat.user._id && (
                      <div className="message-row other">
                        <Avatar
                          src={activeChat.user.avatar}
                          name={activeChat.user.username}
                          size={26}
                        />

                        <div className="message-content">
                          <div className="message-bubble received typing-bubble">
                            typing...
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </>
              )}
            </div>

            <form className="messages-form" onSubmit={handleSendMessage}>
              <div className="messages-emoji" ref={emojiRef}>
                <button
                  type="button"
                  className="messages-emoji-button"
                  onClick={() => setIsEmojiOpen((prev) => !prev)}
                >
                  <Smile size={20} />
                </button>

                {isEmojiOpen && (
                  <div className="messages-emoji-picker">
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      width={320}
                      height={380}
                      emojiStyle="native"
                      previewConfig={{ showPreview: false }}
                      skinTonesDisabled
                    />
                  </div>
                )}
              </div>

              <input
                ref={inputRef}
                id="message-text"
                name="message"
                type="text"
                placeholder={
                  editingMessage ? "Edit message..." : "Write message..."
                }
                autoComplete="off"
                value={messageText}
                onChange={handleMessageChange}
              />

              <button
                type="submit"
                className="messages-send-button"
                disabled={!messageText.trim()}
                title={editingMessage ? "Save" : "Send"}
              >
                <SendHorizontal size={20} />
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
};

export default Messages;
