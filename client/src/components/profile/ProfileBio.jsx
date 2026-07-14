import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const normalizeWebsiteUrl = (website) => {
  if (!website) return "";

  const normalizedWebsite = website.trim();

  if (!normalizedWebsite) return "";

  if (
    normalizedWebsite.startsWith("http://") ||
    normalizedWebsite.startsWith("https://")
  ) {
    return normalizedWebsite;
  }

  return `https://${normalizedWebsite}`;
};

const ProfileBio = ({
  bio = "",
  website = "",
}) => {
  const bioRef = useRef(null);

  const [isExpanded, setIsExpanded] =
    useState(false);

  const [hasOverflow, setHasOverflow] =
    useState(false);

  const checkOverflow = useCallback(() => {
    const bioElement = bioRef.current;

    if (!bioElement) {
      setHasOverflow(false);
      return;
    }

    if (isExpanded) {
      return;
    }

    setHasOverflow(
      bioElement.scrollHeight >
        bioElement.clientHeight + 1,
    );
  }, [isExpanded]);

  useEffect(() => {
    setIsExpanded(false);
  }, [bio]);

  useEffect(() => {
    checkOverflow();

    window.addEventListener(
      "resize",
      checkOverflow,
    );

    return () => {
      window.removeEventListener(
        "resize",
        checkOverflow,
      );
    };
  }, [bio, checkOverflow]);

  const websiteUrl =
    normalizeWebsiteUrl(website);

  if (!bio && !websiteUrl) {
    return null;
  }

  return (
    <div className="profile-bio">
      {bio && (
        <div className="profile-bio-content">
          <p
            ref={bioRef}
            className={`profile-bio-text ${
              isExpanded ? "expanded" : ""
            }`}
          >
            {bio}
          </p>

          {(hasOverflow || isExpanded) && (
            <button
              type="button"
              className="profile-bio-more"
              onClick={() =>
                setIsExpanded(
                  (previousValue) =>
                    !previousValue,
                )
              }
              aria-expanded={isExpanded}
            >
              {isExpanded ? "less" : "... more"}
            </button>
          )}
        </div>
      )}

      {websiteUrl && (
        <a
          className="profile-website"
          href={websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={website}
        >
          {website}
        </a>
      )}
    </div>
  );
};

export default ProfileBio;