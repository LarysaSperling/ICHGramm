import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import api from "../api/axios";
import socket from "../socket";
import Avatar from "../components/ui/Avatar";
import Loader from "../components/ui/Loader";
import { useAuth } from "../context/AuthContext";

import "../styles/messages.css";

const Messages = () => {
  const { user } = useAuth();

  const [searchParams] = useSearchParams();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState("");
  const [currentTime] = useState(() => new Date().getTime());

  useEffect(() => {
    if (!user?._id) return;

    socket.connect();
    socket.emit("joinUserRoom", user._id);

    return () => {
      socket.off("newMessage");
      socket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    const handleNewMessage = (newMessage) => {
      const otherUser =
        newMessage.sender._id === user?._id
          ? newMessage.receiver
          : newMessage.sender;

      setMessages((prev) => {
        const exists = prev.some((message) => message._id === newMessage._id);
        return exists ? prev : [...prev, newMessage];
      });

      setChats((prev) => {
        const chatExists = prev.some(
          (chat) => chat.user._id === otherUser._id
        );

        if (!chatExists) {
          return [
            {
              user: otherUser,
              lastMessage: newMessage.text,
              lastMessageDate: newMessage.createdAt,
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
              }
            : chat
        );
      });
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [user]);

  useEffect(() => {
    const getChats = async () => {
      try {
        setIsLoadingChats(true);
        const { data } = await api.get("/messages");

        setChats(data);

        if (data.length > 0) {
          setActiveChat(data[0]);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load chats");
      } finally {
        setIsLoadingChats(false);
      }
    };

    getChats();
  }, []);

  useEffect(() => {
  const openChatFromProfile = async () => {
    const userId = searchParams.get("user");

    if (!userId || !user?._id) return;

    const existingChat = chats.find(
      (chat) => chat.user._id === userId
    );

    if (existingChat) {
      setActiveChat(existingChat);
      return;
    }

    try {
      const { data } = await api.get(`/users/${userId}`);

      setActiveChat({
        user: data.user,
        lastMessage: "",
        lastMessageDate: null,
      });
    } catch (err) {
      console.error(err);
    }
  };

  openChatFromProfile();
}, [searchParams, chats, user]);

  useEffect(() => {
    const getMessages = async () => {
      if (!activeChat?.user?._id) return;

      try {
        setIsLoadingMessages(true);

        const { data } = await api.get(`/messages/${activeChat.user._id}`);
        setMessages(data);

        const chatRoom = [user._id, activeChat.user._id].sort().join("_");
        socket.emit("joinChat", chatRoom);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load messages");
      } finally {
        setIsLoadingMessages(false);
      }
    };

    getMessages();
  }, [activeChat, user]);

  const handleSendMessage = async (event) => {
    event.preventDefault();

    if (!messageText.trim() || !activeChat?.user?._id) return;

    try {
      const { data } = await api.post("/messages", {
        receiver: activeChat.user._id,
        text: messageText.trim(),
      });

      setMessages((prev) => {
        const exists = prev.some((message) => message._id === data._id);
        return exists ? prev : [...prev, data];
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

  if (isLoadingChats) {
    return <Loader />;
  }

  return (
    <main className="messages-page">
      <section className="messages-list-panel">
        <h2 className="messages-account">{user?.username || "Messages"}</h2>

        {error && <p className="messages-error">{error}</p>}

        {chats.length === 0 && (
          <p className="messages-empty">No messages yet.</p>
        )}

        <div className="messages-chat-list">
          {chats.map((chat) => (
            <button
              key={chat.user._id}
              type="button"
              className={`messages-chat-item ${
                activeChat?.user?._id === chat.user._id ? "active" : ""
              }`}
              onClick={() => setActiveChat(chat)}
            >
              <Avatar
                src={chat.user.avatar}
                name={chat.user.username || chat.user.fullName}
                size={52}
              />

              <div className="messages-chat-info">
                <strong>{chat.user.username}</strong>
                <span>
                  {chat.lastMessage} · {formatTime(chat.lastMessageDate)}
                </span>
              </div>
            </button>
          ))}
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
              <Avatar
                src={activeChat.user.avatar}
                name={activeChat.user.username || activeChat.user.fullName}
                size={40}
              />

              <strong>{activeChat.user.username}</strong>
            </header>

            <div className="messages-conversation-body">
              <div className="messages-profile-preview">
                <Avatar
                  src={activeChat.user.avatar}
                  name={activeChat.user.username || activeChat.user.fullName}
                  size={96}
                />

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
                      {new Date(messages[0].createdAt).toLocaleDateString()}
                    </p>
                  )}

                  <div className="messages-bubbles">
                    {messages.map((message) => {
                      const isOwnMessage =
                        message.sender?._id === user?._id ||
                        message.sender === user?._id;

                      return (
                        <div
                          key={message._id}
                          className={`message-bubble ${
                            isOwnMessage ? "sent" : "received"
                          }`}
                        >
                          {message.text}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <form className="messages-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                name="message"
                placeholder="Write message"
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
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