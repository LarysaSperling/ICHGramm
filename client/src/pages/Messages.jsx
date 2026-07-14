import { useEffect, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  MoreHorizontal,
  SendHorizontal,
  Smile,
} from "lucide-react";
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
    const payload = JSON.parse(
      atob(token.split(".")[1]),
    );

    return (
      payload.userId ||
      payload.id ||
      payload._id ||
      null
    );
  } catch {
    return null;
  }
};

const getMessageUserId = (messageUser) => {
  if (!messageUser) return null;

  if (typeof messageUser === "string") {
    return messageUser;
  }

  return messageUser._id || null;
};

const getChatLastMessageText = (message) => {
  if (!message) {
    return "No messages yet";
  }

  if (
    message.messageType === "post" ||
    message.sharedPost
  ) {
    return "Shared a post";
  }

  return message.text?.trim() || "No messages yet";
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
  const [editingMessage, setEditingMessage] =
    useState(null);
  const [openMessageMenuId, setOpenMessageMenuId] =
    useState(null);
  const [isEmojiOpen, setIsEmojiOpen] =
    useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [isLoadingChats, setIsLoadingChats] =
    useState(true);
  const [isLoadingMessages, setIsLoadingMessages] =
    useState(false);
  const [error, setError] = useState("");

  const currentUserId =
    user?._id || getCurrentUserId();

  const userIdFromUrl = searchParams.get("user");
  const activeUserId = activeChat?.user?._id;

  const [currentTime] = useState(() =>
    new Date().getTime(),
  );

  const getChatRoom = () => {
    if (!currentUserId || !activeUserId) {
      return null;
    }

    return [currentUserId, activeUserId]
      .sort()
      .join("_");
  };

  useEffect(() => {
    const getChats = async () => {
      if (!currentUserId) return;

      try {
        setIsLoadingChats(true);
        setError("");

        const { data } = await api.get("/messages");

        const loadedChats = Array.isArray(data)
          ? data
          : [];

        setChats(loadedChats);

        if (!userIdFromUrl) {
          setActiveChat(null);
          setMessages([]);
          return;
        }

        const existingChat = loadedChats.find(
          (chat) =>
            chat.user?._id === userIdFromUrl,
        );

        if (existingChat) {
          setActiveChat(existingChat);
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to load chats",
        );
      } finally {
        setIsLoadingChats(false);
      }
    };

    getChats();
  }, [currentUserId, userIdFromUrl]);

  useEffect(() => {
    const openChatFromProfile = async () => {
      if (!userIdFromUrl || !currentUserId) {
        return;
      }

      const existingChat = chats.find(
        (chat) =>
          chat.user?._id === userIdFromUrl,
      );

      if (existingChat) {
        setActiveChat((previousChat) =>
          previousChat?.user?._id ===
          existingChat.user._id
            ? previousChat
            : existingChat,
        );

        return;
      }

      if (
        activeChat?.user?._id === userIdFromUrl
      ) {
        return;
      }

      try {
        const { data } = await api.get(
          `/users/${userIdFromUrl}`,
        );

        if (!data?.user) {
          throw new Error("User not found");
        }

        setActiveChat({
          user: data.user,
          lastMessage: "",
          lastMessageDate: null,
          lastMessageSeen: false,
          lastMessageSender: null,
          unreadCount: 0,
        });
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to open chat",
        );
      }
    };

    openChatFromProfile();
  }, [
    userIdFromUrl,
    currentUserId,
    chats,
    activeChat?.user?._id,
  ]);

  useEffect(() => {
    loadedChatRef.current = null;
  }, [activeUserId]);

  useEffect(() => {
    const getMessages = async () => {
      if (!activeUserId || !currentUserId) {
        return;
      }

      const chatKey = `${currentUserId}_${activeUserId}`;

      if (loadedChatRef.current === chatKey) {
        return;
      }

      loadedChatRef.current = chatKey;

      try {
        setIsLoadingMessages(true);
        setTypingUser(null);
        setError("");

        const { data } = await api.get(
          `/messages/${activeUserId}`,
        );

        setMessages(
          Array.isArray(data) ? data : [],
        );

        const chatRoom = [
          currentUserId,
          activeUserId,
        ]
          .sort()
          .join("_");

        socket.emit("joinChat", chatRoom);

        await api.put(
          `/messages/${activeUserId}/seen`,
        );

        setChats((previousChats) =>
          previousChats.map((chat) =>
            chat.user?._id === activeUserId
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

        setError(
          err.response?.data?.message ||
            "Failed to load messages",
        );
      } finally {
        setIsLoadingMessages(false);
      }
    };

    getMessages();
  }, [activeUserId, currentUserId]);

  useEffect(() => {
    const handleNewMessage = (newMessage) => {
      if (!newMessage?._id) return;

      const senderId = getMessageUserId(
        newMessage.sender,
      );

      const receiverId = getMessageUserId(
        newMessage.receiver,
      );

      const isMessageForActiveChat =
        (senderId === activeUserId &&
          receiverId === currentUserId) ||
        (senderId === currentUserId &&
          receiverId === activeUserId);

      if (isMessageForActiveChat) {
        setMessages((previousMessages) => {
          const messageExists =
            previousMessages.some(
              (message) =>
                message._id === newMessage._id,
            );

          if (messageExists) {
            return previousMessages;
          }

          return [
            ...previousMessages,
            newMessage,
          ];
        });

        if (
          senderId !== currentUserId &&
          activeUserId
        ) {
          api
            .put(
              `/messages/${activeUserId}/seen`,
            )
            .catch(() => {});
        }
      }

      const otherUser =
        senderId === currentUserId
          ? newMessage.receiver
          : newMessage.sender;

      const otherUserId =
        getMessageUserId(otherUser);

      if (!otherUserId) return;

      const lastMessageText =
        getChatLastMessageText(newMessage);

      setChats((previousChats) => {
        const existingChat =
          previousChats.find(
            (chat) =>
              chat.user?._id === otherUserId,
          );

        const shouldIncreaseUnread =
          senderId !== currentUserId &&
          otherUserId !== activeUserId;

        const nextChat = {
          user:
            typeof otherUser === "object"
              ? otherUser
              : existingChat?.user,
          lastMessage: lastMessageText,
          lastMessageDate:
            newMessage.createdAt,
          lastMessageSeen:
            newMessage.isSeen,
          lastMessageSender: senderId,
          lastMessageType:
            newMessage.messageType,
          lastSharedPost:
            newMessage.sharedPost || null,
          unreadCount: existingChat
            ? shouldIncreaseUnread
              ? (existingChat.unreadCount || 0) +
                1
              : otherUserId === activeUserId
                ? 0
                : existingChat.unreadCount || 0
            : shouldIncreaseUnread
              ? 1
              : 0,
        };

        if (!existingChat) {
          return [nextChat, ...previousChats];
        }

        return [
          nextChat,
          ...previousChats.filter(
            (chat) =>
              chat.user?._id !== otherUserId,
          ),
        ];
      });
    };

    const handleMessagesSeen = ({ seenBy }) => {
      setMessages((previousMessages) =>
        previousMessages.map((message) => {
          const senderId = getMessageUserId(
            message.sender,
          );

          if (senderId === currentUserId) {
            return {
              ...message,
              isSeen: true,
              seenAt:
                new Date().toISOString(),
            };
          }

          return message;
        }),
      );

      setChats((previousChats) =>
        previousChats.map((chat) =>
          chat.user?._id === seenBy
            ? {
                ...chat,
                lastMessageSeen: true,
              }
            : chat,
        ),
      );
    };

    socket.on(
      "newMessage",
      handleNewMessage,
    );

    socket.on(
      "messagesSeen",
      handleMessagesSeen,
    );

    return () => {
      socket.off(
        "newMessage",
        handleNewMessage,
      );

      socket.off(
        "messagesSeen",
        handleMessagesSeen,
      );
    };
  }, [
    currentUserId,
    activeUserId,
  ]);

  useEffect(() => {
    const handleTyping = (typingUserData) => {
      setTypingUser(typingUserData);
    };

    const handleStopTyping = () => {
      setTypingUser(null);
    };

    socket.on("typing", handleTyping);

    socket.on(
      "stopTyping",
      handleStopTyping,
    );

    return () => {
      socket.off("typing", handleTyping);

      socket.off(
        "stopTyping",
        handleStopTyping,
      );
    };
  }, []);

  useEffect(() => {
    const handleOnlineUsers = (users) => {
      setOnlineUsers(
        Array.isArray(users) ? users : [],
      );
    };

    socket.on(
      "onlineUsers",
      handleOnlineUsers,
    );

    return () => {
      socket.off(
        "onlineUsers",
        handleOnlineUsers,
      );
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiRef.current &&
        !emojiRef.current.contains(event.target)
      ) {
        setIsEmojiOpen(false);
      }

      if (
        !event.target.closest(
          ".message-menu-wrap",
        ) &&
        !event.target.closest(
          ".chat-menu-wrap",
        )
      ) {
        setOpenMessageMenuId(null);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, typingUser]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(
          typingTimeoutRef.current,
        );
      }
    };
  }, []);

  const handleSelectChat = (chat) => {
    loadedChatRef.current = null;

    setEditingMessage(null);
    setOpenMessageMenuId(null);
    setMessageText("");
    setIsEmojiOpen(false);
    setActiveChat(chat);

    navigate(
      `/messages?user=${chat.user._id}`,
    );
  };

  const handleBackToChats = () => {
    loadedChatRef.current = null;

    setActiveChat(null);
    setMessages([]);
    setEditingMessage(null);
    setOpenMessageMenuId(null);
    setMessageText("");
    setIsEmojiOpen(false);

    navigate("/messages");
  };

  const handleMessageChange = (event) => {
    const value = event.target.value;

    setMessageText(value);

    if (editingMessage) return;

    const chatRoom = getChatRoom();

    if (!chatRoom || !currentUserId) {
      return;
    }

    socket.emit("typing", {
      chatRoom,
      user: {
        _id: currentUserId,
        username: user?.username,
      },
    });

    if (typingTimeoutRef.current) {
      clearTimeout(
        typingTimeoutRef.current,
      );
    }

    typingTimeoutRef.current = setTimeout(
      () => {
        socket.emit(
          "stopTyping",
          chatRoom,
        );
      },
      1200,
    );
  };

  const handleEmojiClick = (emojiData) => {
    setMessageText(
      (previousText) =>
        `${previousText}${emojiData.emoji}`,
    );

    setIsEmojiOpen(false);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const toggleMessageMenu = (messageId) => {
    setOpenMessageMenuId(
      (previousId) =>
        previousId === messageId
          ? null
          : messageId,
    );
  };

  const startEditingMessage = (message) => {
    if (
      message.messageType === "post" ||
      message.sharedPost
    ) {
      return;
    }

    const normalizedText =
      message.text?.trim();

    if (!normalizedText) {
      return;
    }

    setEditingMessage(message);
    setMessageText(normalizedText);
    setOpenMessageMenuId(null);
    setIsEmojiOpen(false);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleDeleteMessage = async (
    messageId,
  ) => {
    try {
      setError("");

      await api.delete(
        `/messages/message/${messageId}`,
      );

      setMessages((previousMessages) =>
        previousMessages.filter(
          (message) =>
            message._id !== messageId,
        ),
      );

      const chatsResponse =
        await api.get("/messages");

      setChats(
        Array.isArray(chatsResponse.data)
          ? chatsResponse.data
          : [],
      );

      setOpenMessageMenuId(null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to delete message",
      );
    }
  };

  const handleDeleteChat = async (userId) => {
    try {
      setError("");

      await api.delete(
        `/messages/chat/${userId}`,
      );

      setChats((previousChats) =>
        previousChats.filter(
          (chat) =>
            chat.user?._id !== userId,
        ),
      );

      if (activeUserId === userId) {
        setActiveChat(null);
        setMessages([]);
        setEditingMessage(null);
        setMessageText("");
        setIsEmojiOpen(false);

        navigate("/messages");
      }

      setOpenMessageMenuId(null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to delete chat",
      );
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();

    const normalizedText =
      messageText.trim();

    if (!normalizedText) {
      return;
    }

    try {
      setError("");

      if (editingMessage) {
        const { data } = await api.put(
          `/messages/message/${editingMessage._id}`,
          {
            text: normalizedText,
          },
        );

        setMessages((previousMessages) =>
          previousMessages.map((message) =>
            message._id ===
            editingMessage._id
              ? data
              : message,
          ),
        );

        const chatsResponse =
          await api.get("/messages");

        setChats(
          Array.isArray(
            chatsResponse.data,
          )
            ? chatsResponse.data
            : [],
        );

        setEditingMessage(null);
        setMessageText("");

        return;
      }

      if (!activeUserId) return;

      const chatRoom = getChatRoom();

      if (chatRoom) {
        socket.emit(
          "stopTyping",
          chatRoom,
        );
      }

      const { data } = await api.post(
        "/messages",
        {
          receiver: activeUserId,
          text: normalizedText,
          messageType: "text",
        },
      );

      setMessages((previousMessages) => {
        const messageExists =
          previousMessages.some(
            (message) =>
              message._id === data._id,
          );

        if (messageExists) {
          return previousMessages;
        }

        return [
          ...previousMessages,
          data,
        ];
      });

      const chatsResponse =
        await api.get("/messages");

      setChats(
        Array.isArray(chatsResponse.data)
          ? chatsResponse.data
          : [],
      );

      setMessageText("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to save message",
      );
    }
  };

  const formatTime = (date) => {
    if (!date) return "";

    const difference =
      currentTime -
      new Date(date).getTime();

    const minutes = Math.floor(
      difference / 60000,
    );

    const hours = Math.floor(
      minutes / 60,
    );

    const days = Math.floor(hours / 24);

    if (minutes < 1) return "now";

    if (minutes < 60) {
      return `${minutes}m`;
    }

    if (hours < 24) {
      return `${hours}h`;
    }

    return `${days}d`;
  };

  const formatMessageDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    );
  };

  const getLastOwnMessageId = () => {
    const ownMessages = messages.filter(
      (message) => {
        const senderId = getMessageUserId(
          message.sender,
        );

        return senderId === currentUserId;
      },
    );

    return ownMessages.at(-1)?._id;
  };

  const renderMessageContent = (
    message,
    isOwnMessage,
  ) => {
    const isSharedPostMessage =
      message.messageType === "post" &&
      Boolean(message.sharedPost);

    if (isSharedPostMessage) {
      return (
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
              {message.sharedPost.author
                ?.username || "Post"}
            </strong>

            {message.sharedPost.caption && (
              <span>
                {message.sharedPost.caption}
              </span>
            )}
          </div>
        </div>
      );
    }

    const normalizedText =
      message.text?.trim();

    if (!normalizedText) {
      return null;
    }

    return (
      <div
        className={`message-bubble ${
          isOwnMessage
            ? "sent"
            : "received"
        }`}
      >
        {normalizedText}
      </div>
    );
  };

  if (isLoadingChats) {
    return <Loader />;
  }

  const lastOwnMessageId =
    getLastOwnMessageId();

  return (
    <main
      className={`messages-page ${
        activeChat
          ? "chat-open"
          : "chat-list-open"
      }`}
    >
      <section className="messages-list-panel">
        <h2 className="messages-account">
          {user?.username || "Messages"}
        </h2>

        {error && (
          <p
            className="messages-error"
            role="alert"
          >
            {error}
          </p>
        )}

        {chats.length === 0 && (
          <p className="messages-empty">
            No messages yet.
          </p>
        )}

        <div className="messages-chat-list">
          {chats.map((chat) => {
            const chatUserId =
              chat.user?._id;

            if (!chatUserId) {
              return null;
            }

            const isOnline =
              onlineUsers.includes(chatUserId);

            const lastMessageText =
              chat.lastMessageType === "post" ||
              chat.lastSharedPost
                ? "Shared a post"
                : chat.lastMessage?.trim() ||
                  "No messages yet";

            return (
              <div
                key={chatUserId}
                className={`messages-chat-item ${
                  activeUserId === chatUserId
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  handleSelectChat(chat)
                }
              >
                <div className="messages-avatar-wrap">
                  <Avatar
                    src={chat.user.avatar}
                    name={
                      chat.user.username ||
                      chat.user.fullName
                    }
                    size={52}
                  />

                  {isOnline && (
                    <span className="messages-online-dot" />
                  )}
                </div>

                <div className="messages-chat-info">
                  <strong>
                    {chat.user.username}
                  </strong>

                  <span>
                    {typingUser?._id ===
                    chatUserId
                      ? "typing..."
                      : `${lastMessageText}${
                          chat.lastMessageDate
                            ? ` · ${formatTime(
                                chat.lastMessageDate,
                              )}`
                            : ""
                        }`}
                  </span>
                </div>

                {chat.unreadCount > 0 && (
                  <span className="chat-unread-badge">
                    {chat.unreadCount > 9
                      ? "9+"
                      : chat.unreadCount}
                  </span>
                )}

                <div
                  className="chat-menu-wrap"
                  onClick={(event) =>
                    event.stopPropagation()
                  }
                >
                  <button
                    type="button"
                    className="chat-menu-button"
                    onClick={(event) => {
                      event.stopPropagation();

                      toggleMessageMenu(
                        `chat-${chatUserId}`,
                      );
                    }}
                    aria-label="Open chat menu"
                  >
                    <MoreHorizontal
                      size={18}
                    />
                  </button>

                  {openMessageMenuId ===
                    `chat-${chatUserId}` && (
                    <div className="chat-menu-dropdown">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();

                          handleDeleteChat(
                            chatUserId,
                          );
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

            <p>
              Choose a chat or open a profile
              to start messaging.
            </p>
          </div>
        ) : (
          <>
            <header className="messages-conversation-header">
              <button
                type="button"
                className="messages-back-button"
                onClick={handleBackToChats}
                aria-label="Back to chats"
              >
                <ArrowLeft size={22} />
              </button>

              <Link
                to={`/users/${activeChat.user._id}`}
                className="messages-header-user"
              >
                <div className="messages-avatar-wrap">
                  <Avatar
                    src={
                      activeChat.user.avatar
                    }
                    name={
                      activeChat.user
                        .username ||
                      activeChat.user
                        .fullName
                    }
                    size={40}
                  />

                  {onlineUsers.includes(
                    activeChat.user._id,
                  ) && (
                    <span className="messages-online-dot small" />
                  )}
                </div>

                <div className="messages-header-info">
                  <strong>
                    {activeChat.user.username}
                  </strong>

                  <span>
                    {typingUser?._id ===
                    activeChat.user._id
                      ? "typing..."
                      : onlineUsers.includes(
                            activeChat.user._id,
                          )
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
                    src={
                      activeChat.user.avatar
                    }
                    name={
                      activeChat.user
                        .username ||
                      activeChat.user
                        .fullName
                    }
                    size={96}
                  />

                  {onlineUsers.includes(
                    activeChat.user._id,
                  ) && (
                    <span className="messages-online-dot large" />
                  )}
                </div>

                <h3>
                  {activeChat.user.username}
                </h3>

                <p>
                  {activeChat.user.fullName} ·
                  ICHgram
                </p>

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
                      {formatMessageDate(
                        messages[0].createdAt,
                      )}
                    </p>
                  )}

                  <div className="messages-bubbles">
                    {messages.map(
                      (message) => {
                        const senderId =
                          getMessageUserId(
                            message.sender,
                          );

                        const isOwnMessage =
                          senderId ===
                          currentUserId;

                        const isLastOwnMessage =
                          message._id ===
                          lastOwnMessageId;

                        const messageContent =
                          renderMessageContent(
                            message,
                            isOwnMessage,
                          );

                        if (!messageContent) {
                          return null;
                        }

                        return (
                          <div
                            key={message._id}
                            className={`message-row ${
                              isOwnMessage
                                ? "own"
                                : "other"
                            }`}
                          >
                            {isOwnMessage ? (
                              <>
                                <div className="message-menu-wrap">
                                  <button
                                    type="button"
                                    className="message-menu-button"
                                    onClick={() =>
                                      toggleMessageMenu(
                                        message._id,
                                      )
                                    }
                                    aria-label="Open message menu"
                                  >
                                    <MoreHorizontal
                                      size={18}
                                    />
                                  </button>

                                  {openMessageMenuId ===
                                    message._id && (
                                    <div className="message-menu-dropdown">
                                      {message.messageType !==
                                        "post" &&
                                        !message.sharedPost &&
                                        message.text?.trim() && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              startEditingMessage(
                                                message,
                                              )
                                            }
                                          >
                                            Edit
                                          </button>
                                        )}

                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleDeleteMessage(
                                            message._id,
                                          )
                                        }
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>

                                <div className="message-content">
                                  {messageContent}

                                  <span className="message-time">
                                    {formatTime(
                                      message.createdAt,
                                    )}
                                  </span>

                                  {isLastOwnMessage && (
                                    <span
                                      className={`message-status ${
                                        message.isSeen
                                          ? "seen"
                                          : "sent"
                                      }`}
                                    >
                                      {message.isSeen
                                        ? "✓✓ Seen"
                                        : "✓ Sent"}
                                    </span>
                                  )}
                                </div>

                                <Avatar
                                  src={user?.avatar}
                                  name={
                                    user?.username
                                  }
                                  size={28}
                                />
                              </>
                            ) : (
                              <>
                                <Avatar
                                  src={
                                    message.sender
                                      ?.avatar
                                  }
                                  name={
                                    message.sender
                                      ?.username
                                  }
                                  size={28}
                                />

                                <div className="message-content">
                                  {messageContent}

                                  <span className="message-time">
                                    {formatTime(
                                      message.createdAt,
                                    )}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      },
                    )}

                    {typingUser?._id ===
                      activeChat.user._id && (
                      <div className="message-row other">
                        <Avatar
                          src={
                            activeChat.user
                              .avatar
                          }
                          name={
                            activeChat.user
                              .username
                          }
                          size={26}
                        />

                        <div className="message-content">
                          <div className="message-bubble received typing-bubble">
                            typing...
                          </div>
                        </div>
                      </div>
                    )}

                    <div
                      ref={messagesEndRef}
                    />
                  </div>
                </>
              )}
            </div>

            <form
              className="messages-form"
              onSubmit={handleSendMessage}
            >
              <div
                className="messages-emoji"
                ref={emojiRef}
              >
                <button
                  type="button"
                  className="messages-emoji-button"
                  onClick={() =>
                    setIsEmojiOpen(
                      (previousValue) =>
                        !previousValue,
                    )
                  }
                  aria-label="Choose emoji"
                >
                  <Smile size={20} />
                </button>

                {isEmojiOpen && (
                  <div className="messages-emoji-picker">
                    <EmojiPicker
                      onEmojiClick={
                        handleEmojiClick
                      }
                      width={320}
                      height={380}
                      emojiStyle="native"
                      previewConfig={{
                        showPreview: false,
                      }}
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
                  editingMessage
                    ? "Edit message..."
                    : "Write message..."
                }
                autoComplete="off"
                value={messageText}
                onChange={
                  handleMessageChange
                }
              />

              <button
                type="submit"
                className="messages-send-button"
                disabled={
                  !messageText.trim()
                }
                title={
                  editingMessage
                    ? "Save"
                    : "Send"
                }
                aria-label={
                  editingMessage
                    ? "Save message"
                    : "Send message"
                }
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
