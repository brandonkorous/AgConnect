import type { ToastInput, ToastPusher } from './types';

let pusher: ToastPusher | null = null;
const buffered: ToastInput[] = [];

export const setToastPusher = (fn: ToastPusher | null): void => {
  pusher = fn;
  if (fn) {
    while (buffered.length > 0) {
      const next = buffered.shift();
      if (next) fn(next);
    }
  }
};

export const pushToast: ToastPusher = (input) => {
  if (pusher) {
    pusher(input);
  } else {
    buffered.push(input);
  }
};
