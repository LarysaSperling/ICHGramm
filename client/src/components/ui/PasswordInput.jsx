import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import "../../styles/passwordInput.css";

// Password field with a show/hide toggle. Every prop except className
// goes to the <input> as is (name, value, onChange, autoComplete, id,
// aria-*, disabled...), so forms keep working as with a plain input.
// Each PasswordInput keeps its own visibility state.
const PasswordInput = ({
  className = "",
  disabled,
  ...inputProps
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="password-input">
      <input
        {...inputProps}
        type={isVisible ? "text" : "password"}
        className={`password-input-field ${className}`.trim()}
        disabled={disabled}
      />

      <button
        type="button"
        className="password-input-toggle"
        onClick={() =>
          setIsVisible((previousValue) => !previousValue)
        }
        disabled={disabled}
        aria-label={isVisible ? "Hide password" : "Show password"}
        aria-controls={inputProps.id}
      >
        {isVisible ? (
          <EyeOff size={18} aria-hidden="true" />
        ) : (
          <Eye size={18} aria-hidden="true" />
        )}
      </button>
    </div>
  );
};

export default PasswordInput;
