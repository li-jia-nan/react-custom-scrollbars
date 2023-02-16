const getInnerHeight = (el: HTMLElement) => {
  const { clientHeight } = el;
  const { paddingTop, paddingBottom } = getComputedStyle(el);
  return clientHeight - parseFloat(paddingTop) - parseFloat(paddingBottom);
};

export default getInnerHeight;
