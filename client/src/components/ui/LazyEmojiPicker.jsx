import { Component, Suspense, lazy } from "react";

import "../../styles/lazyFallback.css";

// emoji-picker-react is ~300 kB (72 kB gzip), 40% of what was the whole
// bundle, and it was imported by the feed (PostCard). It is only shown
// after a click on the emoji button, so it is loaded only then
// (REVIEW M-15). Same props as the library's default export.
//
// A failed load does NOT reload the page (unlike pages, see
// utils/lazyWithReload.js): the user may be typing a comment or message.
// It shows a small message with "Retry" instead.

let pickerPromise = null;

// One shared import; a failed one may be tried again.
const loadPicker = () => {
  if (!pickerPromise) {
    pickerPromise = import("emoji-picker-react").catch((error) => {
      pickerPromise = null;
      throw error;
    });
  }

  return pickerPromise;
};

// Start loading before the click (hover / focus on the emoji button), so
// the picker usually opens without a wait.
export const preloadEmojiPicker = () => {
  loadPicker().catch(() => {
    // Shown when the picker is actually opened.
  });
};

const createLazyPicker = () => lazy(loadPicker);

// Module level, so opening the picker again does not suspend again.
// Replaced only by "Retry" after a failed load (React.lazy remembers a
// failure for good).
let LazyPicker = createLazyPicker();

const boxStyle = ({ width = 320, height = 360 }) => ({
  width: typeof width === "number" ? `${width}px` : width,
  height: typeof height === "number" ? `${height}px` : height,
});

const PickerLoading = (props) => (
  <div
    className="emoji-fallback"
    style={boxStyle(props)}
    role="status"
    aria-label="Loading emoji"
  >
    <span className="emoji-fallback-spinner" aria-hidden="true" />
  </div>
);

class PickerBoundary extends Component {
  constructor(props) {
    super(props);

    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("Emoji picker failed to load:", error);
  }

  handleRetry = () => {
    LazyPicker = createLazyPicker();
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        className="emoji-fallback"
        style={boxStyle(this.props.size)}
        role="alert"
      >
        <span>Couldn&apos;t load emoji.</span>

        <button
          type="button"
          className="emoji-fallback-button"
          onClick={this.handleRetry}
        >
          Retry
        </button>
      </div>
    );
  }
}

const Picker = (props) => <LazyPicker {...props} />;

const LazyEmojiPicker = (props) => (
  <PickerBoundary size={props}>
    <Suspense fallback={<PickerLoading {...props} />}>
      <Picker {...props} />
    </Suspense>
  </PickerBoundary>
);

export default LazyEmojiPicker;
