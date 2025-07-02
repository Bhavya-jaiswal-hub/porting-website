const handlers = {};

export const EventBus = {
  emit(event, data) {
    localStorage.setItem(
      "event-broadcast",
      JSON.stringify({ event, data, timestamp: Date.now() })
    );
  },

  on(event, callback) {
    if (!handlers[event]) {
      handlers[event] = [];
    }
    handlers[event].push(callback);

    const listener = (e) => {
      if (e.key === "event-broadcast") {
        const { event: incomingEvent, data } = JSON.parse(e.newValue);
        if (incomingEvent === event) {
          handlers[event].forEach((cb) => cb(data));
        }
      }
    };

    window.addEventListener("storage", listener);

    // Save listener reference so we can remove it later
    callback._listener = listener;

    return () => {
      EventBus.off(event, callback);
    };
  },

  off(event, callback) {
    if (!handlers[event]) return;

    handlers[event] = handlers[event].filter((cb) => cb !== callback);

    if (callback._listener) {
      window.removeEventListener("storage", callback._listener);
    }
  },
};
