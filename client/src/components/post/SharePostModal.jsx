import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";

import api from "../../api/axios";
import Avatar from "../ui/Avatar";
import Loader from "../ui/Loader";

import "../../styles/sharePostModal.css";

const SharePostModal = ({ post, isOpen, onClose }) => {
  const [users, setUsers] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sendingUserId, setSendingUserId] = useState(null);
  const [sentUserIds, setSentUserIds] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const loadUsers = async () => {
      try {
        setIsLoading(true);
        setError("");
        setSearchText("");
        setSentUserIds([]);

        const { data } = await api.get("/users/share-list");

        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load users"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    if (!normalizedSearch) {
      return users;
    }

    return users.filter((user) => {
      const username = user.username?.toLowerCase() || "";
      const fullName = user.fullName?.toLowerCase() || "";

      return (
        username.includes(normalizedSearch) ||
        fullName.includes(normalizedSearch)
      );
    });
  }, [users, searchText]);

  const handleSendPost = async (userId) => {
    if (!post?._id || !userId || sendingUserId) return;

    try {
      setSendingUserId(userId);
      setError("");

      await api.post("/messages", {
        receiver: userId,
        messageType: "post",
        sharedPost: post._id,
      });

      setSentUserIds((prev) =>
        prev.includes(userId) ? prev : [...prev, userId]
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to send post"
      );
    } finally {
      setSendingUserId(null);
    }
  };

  if (!isOpen || !post) return null;

  return (
    <div className="share-post-backdrop" onClick={onClose}>
      <section
        className="share-post-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="share-post-header">
          <h2>Share</h2>

          <button
            type="button"
            className="share-post-close"
            onClick={onClose}
            aria-label="Close share window"
          >
            <X size={24} />
          </button>
        </header>

        <div className="share-post-search">
          <Search size={18} />

          <input
            type="search"
            placeholder="Search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="share-post-preview">
          <img
            src={post.image}
            alt={post.caption || "Shared post preview"}
          />

          <div>
            <strong>{post.author?.username || "Post"}</strong>
            <span>{post.caption || "Shared post"}</span>
          </div>
        </div>

        {error && <p className="share-post-error">{error}</p>}

        <div className="share-post-list">
          {isLoading ? (
            <Loader />
          ) : filteredUsers.length === 0 ? (
            <p className="share-post-empty">No users found.</p>
          ) : (
            filteredUsers.map((user) => {
              const userId = user._id;
              const isSending = sendingUserId === userId;
              const isSent = sentUserIds.includes(userId);

              return (
                <div className="share-post-user" key={userId}>
                  <Avatar
                    src={user.avatar}
                    name={user.username || user.fullName}
                    size={44}
                  />

                  <div className="share-post-user-info">
                    <strong>{user.username}</strong>
                    <span>{user.fullName}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSendPost(userId)}
                    disabled={isSending || isSent}
                  >
                    {isSent
                      ? "Sent"
                      : isSending
                        ? "Sending..."
                        : "Send"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
};

export default SharePostModal;
