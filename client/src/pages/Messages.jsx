import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

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

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
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

        if (!userIdFromUrl && data.length > 0) {
          setActiveChat(data[0]);
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

      const existingChat = chats.find((chat) => chat.user._id === userIdFromUrl);

      if (existingChat) {
        setActiveChat((prev) =>
          prev?.user?._id === existingChat.user._id ? prev : existingChat
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
        socket.emit("joinChat", chatRoom);
        socket.emit("joinUserRoom", currentUserId);

        await api.put(`/messages/${activeUserId}/seen`);
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
            },
            ...prev,
          ];
        }

        return prev.map((chat) =>
          chat.user._id === otherUser._id
            ? {
                ...chat,
                lastMessage: newMessage.text,
                lastMessageDate: newMessage.createdAt,
                lastMessageSeen: newMessage.isSeen,
                lastMessageSender: senderId,
              }
            : chat
        );
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
        })
      );

      setChats((prev) =>
        prev.map((chat) =>
          chat.user._id === seenBy
            ? {
                ...chat,
                lastMessageSeen: true,
              }
            : chat
        )
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  const handleSelectChat = (chat) => {
    loadedChatRef.current = null;
    setActiveChat(chat);
    navigate(`/messages?user=${chat.user._id}`);
  };

  const handleMessageChange = (event) => {
    const value = event.target.value;
    setMessageText(value);

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

  const handleSendMessage = async (event) => {
    event.preventDefault();

    if (!messageText.trim() || !activeUserId) return;

    try {
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

      setChats((prev) => {
        const chatExists = prev.some((chat) => chat.user._id === activeUserId);

        if (!chatExists) {
          return [
            {
              user: activeChat.user,
              lastMessage: data.text,
              lastMessageDate: data.createdAt,
              lastMessageSeen: data.isSeen,
              lastMessageSender: data.sender?._id || data.sender,
            },
            ...prev,
          ];
        }

        return prev.map((chat) =>
          chat.user._id === activeUserId
            ? {
                ...chat,
                lastMessage: data.text,
                lastMessageDate: data.createdAt,
                lastMessageSeen: data.isSeen,
                lastMessageSender: data.sender?._id || data.sender,
              }
            : chat
        );
      });

      setMessageText("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send message");
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
    <main className="messages-page">
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
              <button
                key={chat.user._id}
                type="button"
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
              </button>
            );
          })}
        </div>
      </section>

      <section className="messages-conversation">
        {!activeChat ? (
          <div className="messages-no-chat">
            <h2>Your messages</h2>
            <p>Send a message to start a chat.</p>
          </div>
        ) : (
          <>
            <header className="messages-conversation-header">
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
                      const isLastOwnMessage =
                        message._id === lastOwnMessageId;

                      return (
                        <div
                          key={message._id}
                          className={`message-row ${
                            isOwnMessage ? "own" : "other"
                          }`}
                        >
                          {isOwnMessage ? (
                            <>
                              <div className="message-content">
                                <div className="message-bubble sent">
                                  {message.text}
                                </div>

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
                                <div className="message-bubble received">
                                  {message.text}
                                </div>

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
              <input
                id="message-text"
                name="message"
                type="text"
                placeholder="Write message"
                value={messageText}
                onChange={handleMessageChange}
                autoComplete="off"
              />

              <button type="submit" disabled={!messageText.trim()}>
                Send
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
};

export default Messages;