import "../../styles/avatar.css";

const Avatar = ({ src, name = "User", size = 36 }) => {
  const firstLetter = name.trim().charAt(0).toUpperCase();

  if (src) {
    return (
      <img
        className="avatar-img"
        src={src}
        alt={name}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="avatar-fallback"
      style={{ width: size, height: size }}
    >
      {firstLetter}
    </div>
  );
};

export default Avatar;