import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search as SearchIcon, X } from "lucide-react";

import api from "../api/axios";
import Avatar from "../components/ui/Avatar";
import Home from "./Home";

import "../styles/search.css";

const Search = () => {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.body.classList.add("search-open");

    return () => {
      document.body.classList.remove("search-open");
    };
  }, []);

  useEffect(() => {
    const searchUsers = async () => {
      if (!query.trim()) {
        setUsers([]);
        setError("");
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        const { data } = await api.get(`/users/search?q=${query.trim()}`);
        setUsers(data);
      } catch (err) {
        setUsers([]);
        setError(err.response?.data?.message || "Failed to search users");
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(searchUsers, 400);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <>
      <div className="search-home-bg">
        <Home />
      </div>

      <div className="search-dark-layer"></div>

      <div className="search-overlay">
        <section className="search-panel">
          <div className="search-header">
            <h1>Search</h1>

            <button type="button" onClick={() => navigate("/home")}>
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
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
              autoFocus
            />
          </div>

          <div className="search-divider"></div>

          {!query && <h2 className="search-recent-title">Recent</h2>}

          {isLoading && <p className="search-message">Searching...</p>}
          {error && <p className="search-error">{error}</p>}

          {!isLoading && query && users.length === 0 && !error && (
            <p className="search-message">No users found.</p>
          )}

          <div className="search-results">
            {users.map((user) => (
              <Link
                key={user._id}
                to={`/profile/${user._id}`}
                className="search-user-card"
              >
                <Avatar
                  src={user.avatar}
                  name={user.username || user.fullName}
                  size={44}
                />

                <div>
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