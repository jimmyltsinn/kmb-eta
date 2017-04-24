export const RESIZE_WINDOW = 'SCREEN_RESIZE';

export let resizeWindow = (width, height) => ({
  type: RESIZE_WINDOW,
  width,
  height
});
