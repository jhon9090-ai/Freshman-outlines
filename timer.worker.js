// timer.worker.js
let timerId = null;
let timeLeft = 0;

self.onmessage = function(e) {
  const { command, value } = e.data;

  switch (command) {
    case 'start':
      timeLeft = value;
      if (timerId) clearInterval(timerId);
      timerId = setInterval(() => {
        timeLeft--;
        self.postMessage({ type: 'tick', timeLeft: timeLeft });
        if (timeLeft <= 0) {
          clearInterval(timerId);
          timerId = null;
          self.postMessage({ type: 'finished' });
        }
      }, 1000);
      break;

    case 'pause':
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
      break;
    
    case 'resume':
      if (!timerId && timeLeft > 0) {
        timerId = setInterval(() => {
          timeLeft--;
          self.postMessage({ type: 'tick', timeLeft: timeLeft });
          if (timeLeft <= 0) {
            clearInterval(timerId);
            timerId = null;
            self.postMessage({ type: 'finished' });
          }
        }, 1000);
      }
      break;

    case 'stop':
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
      timeLeft = 0;
      break;
  }
};
