import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search as SearchIcon, X } from "lucide-react";
import axios from "axios";

import api from "../api/axios";
import Avatar from "../components/ui/Avatar";
import Home from "./Home";

import "../styles/search.css";

// Same limit as searchUsersValidator on the server.
const MAX_SEARCH_LENGTH = 50;

const Search = () => {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = useCallback(() => {
    navigate("/home");
  }, [navigate]);

  useEffect(() => {
    document.body.classList.add("search-open");

    return () => {
      document.body.classList.remove("search-open");
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleClose]);

  useEffect(() => {
    const keyword = query.trim();

    if (!keyword) {
      setUsers([]);
      setError("");
      setIsLoading(false);
      return;
    }

    // Aborted by the cleanup below: when the query changes (a newer
    // search replaces this one) or when the page unmounts. Without it
    // a slow older response could overwrite the results of a newer one.
    const controller = new AbortController();

    const searchUsers = async () => {
      try {
        setIsLoading(true);
        setError("");

        // params lets axios encode &, #, +, % and spaces in the keyword.
        const { data } = await api.get("/users/search", {
          params: { q: keyword },
          signal: controller.signal,
        });

        setUsers(data);
        setIsLoading(false);
      } catch (err) {
        // A cancelled search is not an error; the next search (or
        // unmount) owns the state from here.
        if (axios.isCancel(err)) {
          return;
        }

        setUsers([]);
        setError(err.response?.data?.message || "Failed to search users");
        setIsLoading(false);
      }
    };

    const timer = setTimeout(searchUsers, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return (
    <>
      <div className="search-home-bg">
        <Home />
      </div>

      {/* Sibling of the panel, not its parent, so clicks inside the
          panel never reach it. */}
      <div
        className="search-dark-layer"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="search-overlay">
        <section className="search-panel">
          <div className="search-header">
            <h1>Search</h1>

            <button
              type="button"
              onClick={handleClose}
              aria-label="Close search"
            >
              <X size={22} />
            </button>
          </div>

          <div className="search-box">
            <SearchIcon size={18} />

            <input
              type="text"
              name="search"
              placeholder="Search"
              value={query}
              maxLength={MAX_SEARCH_LENGTH}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
              autoFocus
            />
          </div>

          <div className="search-divider"></div>

          {!query && (
            <h2 className="search-recent-title">
              Recent
            </h2>
          )}

          {isLoading && (
            <p className="search-message">
              Searching...
            </p>
          )}

          {error && (
            <p className="search-error">
              {error}
            </p>
          )}

          {!isLoading &&
            query &&
            users.length === 0 &&
            !error && (
              <p className="search-message">
                No users found.
              </p>
            )}

          <div className="search-results">
            {users.map((user) => (
              <Link
                key={user._id}
                to={`/users/${user._id}`}
                className="search-user-card"
              >
                <Avatar
                  src={user.avatar}
                  name={user.username || user.fullName}
                  size={44}
                />

                <div className="search-user-info">
                  <strong>{user.username}</strong>
                  <span>{user.fullName}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
};

export default Search;