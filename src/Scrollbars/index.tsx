import css from 'dom-css';
import { Component, createElement, cloneElement } from 'react';
import getScrollbarWidth from '../utils/getScrollbarWidth';
import getInnerWidth from '../utils/getInnerWidth';
import getInnerHeight from '../utils/getInnerHeight';
import {
  containerStyleDefault,
  containerStyleAutoHeight,
  viewStyleDefault,
  viewStyleAutoHeight,
  viewStyleUniversalInitial,
  trackHorizontalStyleDefault,
  trackVerticalStyleDefault,
  thumbHorizontalStyleDefault,
  thumbVerticalStyleDefault,
  disableSelectStyle,
  disableSelectStyleReset,
} from './styles';
import {
  renderViewDefault,
  renderTrackHorizontalDefault,
  renderTrackVerticalDefault,
  renderThumbHorizontalDefault,
  renderThumbVerticalDefault,
} from './defaultRenderElements';
import React from 'react';

interface ScrollbarsProps {
  onScroll?: (value?: any) => void;
  onScrollFrame?: (value?: any) => void;
  onScrollStart?: (value?: any) => void;
  onScrollStop?: (value?: any) => void;
  onUpdate?: (value?: any) => void;
  renderView?: (props?: React.HTMLAttributes<HTMLElement>) => React.ReactElement;
  renderTrackHorizontal?: (props?: React.HTMLAttributes<HTMLElement>) => React.ReactElement;
  renderTrackVertical?: (props?: React.HTMLAttributes<HTMLElement>) => React.ReactElement;
  renderThumbHorizontal?: (props?: React.HTMLAttributes<HTMLElement>) => React.ReactElement;
  renderThumbVertical?: (props?: React.HTMLAttributes<HTMLElement>) => React.ReactElement;
  tagName?: string;
  thumbSize?: number;
  thumbMinSize?: number;
  hideTracksWhenNotNeeded?: boolean;
  autoHide?: boolean;
  autoHideTimeout: number;
  autoHideDuration: number;
  autoHeight: boolean;
  autoHeightMin: number | string;
  autoHeightMax: number | string;
  universal: boolean;
  style: React.CSSProperties;
  children: React.ReactNode;
}

interface ScrollbarsStates {
  didMountUniversal: boolean;
}

class Scrollbars extends Component<ScrollbarsProps, ScrollbarsStates> {
  constructor(props: ScrollbarsProps) {
    super(props);

    this.getScrollLeft = this.getScrollLeft.bind(this);
    this.getScrollTop = this.getScrollTop.bind(this);
    this.getScrollWidth = this.getScrollWidth.bind(this);
    this.getScrollHeight = this.getScrollHeight.bind(this);
    this.getClientWidth = this.getClientWidth.bind(this);
    this.getClientHeight = this.getClientHeight.bind(this);
    this.getValues = this.getValues.bind(this);
    this.getThumbHorizontalWidth = this.getThumbHorizontalWidth.bind(this);
    this.getThumbVerticalHeight = this.getThumbVerticalHeight.bind(this);
    this.getScrollLeftForOffset = this.getScrollLeftForOffset.bind(this);
    this.getScrollTopForOffset = this.getScrollTopForOffset.bind(this);

    this.scrollLeft = this.scrollLeft.bind(this);
    this.scrollTop = this.scrollTop.bind(this);
    this.scrollToLeft = this.scrollToLeft.bind(this);
    this.scrollToTop = this.scrollToTop.bind(this);
    this.scrollToRight = this.scrollToRight.bind(this);
    this.scrollToBottom = this.scrollToBottom.bind(this);

    this.handleTrackMouseEnter = this.handleTrackMouseEnter.bind(this);
    this.handleTrackMouseLeave = this.handleTrackMouseLeave.bind(this);
    this.handleHorizontalTrackMouseDown = this.handleHorizontalTrackMouseDown.bind(this);
    this.handleVerticalTrackMouseDown = this.handleVerticalTrackMouseDown.bind(this);
    this.handleHorizontalThumbMouseDown = this.handleHorizontalThumbMouseDown.bind(this);
    this.handleVerticalThumbMouseDown = this.handleVerticalThumbMouseDown.bind(this);
    this.handleWindowResize = this.handleWindowResize.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.handleDrag = this.handleDrag.bind(this);
    this.handleDragEnd = this.handleDragEnd.bind(this);
  }
  state = {
    didMountUniversal: false,
  };
  componentDidMount() {
    this.addListeners();
    this.update();
    this.componentDidMountUniversal();
  }

  view = React.createRef<HTMLDivElement>();
  container = React.createRef<HTMLDivElement>();
  trackVertical = React.createRef<HTMLDivElement>();
  thumbVertical = React.createRef<HTMLDivElement>();
  thumbHorizontal = React.createRef<HTMLDivElement>();
  trackHorizontal = React.createRef<HTMLDivElement>();

  requestFrame = React.createRef<number>();
  hideTracksTimeout = React.createRef<NodeJS.Timer | null>();
  detectScrollingInterval = React.createRef<any>();

  viewScrollLeft = 0;
  viewScrollTop = 0;
  prevPageY = 0;
  dragging = false;
  trackMouseOver = false;
  scrolling = false;
  prevPageX = 0;
  lastViewScrollLeft = 0;
  lastViewScrollTop = 0;

  componentDidMountUniversal() {
    const { universal = false } = this.props;
    if (!universal) {
      return;
    }
    this.setState({ didMountUniversal: true });
  }

  componentDidUpdate() {
    this.update();
  }

  componentWillUnmount() {
    this.removeListeners();
    if (this.requestFrame.current) {
      cancelAnimationFrame(this.requestFrame.current);
    }
    if (this.hideTracksTimeout.current) {
      clearTimeout(this.hideTracksTimeout.current);
    }
    if (this.detectScrollingInterval.current) {
      clearInterval(this.detectScrollingInterval.current);
    }
  }

  getScrollLeft() {
    if (!this.view.current) {
      return 0;
    }
    return this.view.current.scrollLeft;
  }

  getScrollTop() {
    if (!this.view.current) {
      return 0;
    }
    return this.view.current.scrollTop;
  }

  getScrollWidth() {
    if (!this.view.current) {
      return 0;
    }
    return this.view.current.scrollWidth;
  }

  getScrollHeight() {
    if (!this.view.current) {
      return 0;
    }
    return this.view.current.scrollHeight;
  }

  getClientWidth() {
    if (!this.view.current) {
      return 0;
    }
    return this.view.current.clientWidth;
  }

  getClientHeight() {
    if (!this.view.current) {
      return 0;
    }
    return this.view.current.clientHeight;
  }

  getValues() {
    const { scrollLeft = 0, scrollTop = 0, scrollWidth = 0, scrollHeight = 0, clientWidth = 0, clientHeight = 0 } = this.view.current || {};

    return {
      left: scrollLeft / (scrollWidth - clientWidth) || 0,
      top: scrollTop / (scrollHeight - clientHeight) || 0,
      scrollLeft,
      scrollTop,
      scrollWidth,
      scrollHeight,
      clientWidth,
      clientHeight,
    };
  }

  getThumbHorizontalWidth() {
    const { thumbSize, thumbMinSize = 30 } = this.props;
    const { scrollWidth, clientWidth } = this.view.current || {};
    const trackWidth = getInnerWidth(this.trackHorizontal.current!);
    const width = Math.ceil((clientWidth! / scrollWidth!) * trackWidth);
    if (trackWidth === width) {
      return 0;
    }
    if (thumbSize) {
      return thumbSize;
    }
    return Math.max(width, thumbMinSize);
  }

  getThumbVerticalHeight = () => {
    const { thumbSize, thumbMinSize = 30 } = this.props;
    const { scrollHeight, clientHeight } = this.view.current || {};
    const trackHeight = getInnerHeight(this.trackVertical.current!);
    const height = Math.ceil((clientHeight! / scrollHeight!) * trackHeight);
    if (trackHeight === height) {
      return 0;
    }
    if (thumbSize) {
      return thumbSize;
    }
    return Math.max(height, thumbMinSize);
  };

  getScrollLeftForOffset = (offset: number) => {
    const { scrollWidth, clientWidth } = this.view.current || {};
    const trackWidth = getInnerWidth(this.trackHorizontal.current!);
    const thumbWidth = this.getThumbHorizontalWidth();
    return (offset / (trackWidth - thumbWidth)) * (scrollWidth! - clientWidth!);
  };

  getScrollTopForOffset = (offset: number) => {
    const { scrollHeight, clientHeight } = this.view.current || {};
    const trackHeight = getInnerHeight(this.trackVertical.current!);
    const thumbHeight = this.getThumbVerticalHeight();
    return (offset / (trackHeight - thumbHeight)) * (scrollHeight! - clientHeight!);
  };

  scrollLeft = (left = 0) => {
    if (!this.view.current) {
      return;
    }
    this.view.current!.scrollLeft = left;
  };

  scrollTop = (top = 0) => {
    if (!this.view.current) {
      return;
    }
    this.view.current.scrollTop = top;
  };

  scrollToLeft = () => {
    if (!this.view.current) {
      return;
    }
    this.view.current.scrollLeft = 0;
  };

  scrollToTop = () => {
    if (!this.view.current) {
      return;
    }
    this.view.current.scrollTop = 0;
  };

  scrollToRight = () => {
    if (!this.view.current) {
      return;
    }
    this.view.current.scrollLeft = this.view.current.scrollWidth;
  };

  scrollToBottom = () => {
    if (!this.view.current) {
      return;
    }
    this.view.current.scrollTop = this.view.current.scrollHeight;
  };

  addListeners = () => {
    if (typeof document === 'undefined' || !this.view.current) {
      return;
    }
    const { view, trackHorizontal, trackVertical, thumbHorizontal, thumbVertical } = this;
    view.current?.addEventListener('scroll', this.handleScroll);
    if (!getScrollbarWidth()) {
      return;
    }
    trackHorizontal.current?.addEventListener('mouseenter', this.handleTrackMouseEnter);
    trackHorizontal.current?.addEventListener('mouseleave', this.handleTrackMouseLeave);
    trackHorizontal.current?.addEventListener('mousedown', this.handleHorizontalTrackMouseDown);
    trackVertical.current?.addEventListener('mouseenter', this.handleTrackMouseEnter);
    trackVertical.current?.addEventListener('mouseleave', this.handleTrackMouseLeave);
    trackVertical.current?.addEventListener('mousedown', this.handleVerticalTrackMouseDown);
    thumbHorizontal.current?.addEventListener('mousedown', this.handleHorizontalThumbMouseDown);
    thumbVertical.current?.addEventListener('mousedown', this.handleVerticalThumbMouseDown);
    window.addEventListener('resize', this.handleWindowResize);
  };

  removeListeners = () => {
    if (typeof document === 'undefined' || !this.view.current) {
      return;
    }
    const { view, trackHorizontal, trackVertical, thumbHorizontal, thumbVertical } = this;
    view.current?.removeEventListener('scroll', this.handleScroll);
    if (!getScrollbarWidth()) {
      return;
    }
    trackHorizontal.current?.removeEventListener('mouseenter', this.handleTrackMouseEnter);
    trackHorizontal.current?.removeEventListener('mouseleave', this.handleTrackMouseLeave);
    trackHorizontal.current?.removeEventListener('mousedown', this.handleHorizontalTrackMouseDown);
    trackVertical.current?.removeEventListener('mouseenter', this.handleTrackMouseEnter);
    trackVertical.current?.removeEventListener('mouseleave', this.handleTrackMouseLeave);
    trackVertical.current?.removeEventListener('mousedown', this.handleVerticalTrackMouseDown);
    thumbHorizontal.current?.removeEventListener('mousedown', this.handleHorizontalThumbMouseDown);
    thumbVertical.current?.removeEventListener('mousedown', this.handleVerticalThumbMouseDown);
    window.removeEventListener('resize', this.handleWindowResize);
    // Possibly setup by `handleDragStart`
    this.teardownDragging();
  };

  handleScroll = event => {
    const { onScroll, onScrollFrame } = this.props;
    if (onScroll) onScroll(event);
    this.update(values => {
      const { scrollLeft, scrollTop } = values;
      this.viewScrollLeft = scrollLeft;
      this.viewScrollTop = scrollTop;
      if (onScrollFrame) onScrollFrame(values);
    });
    this.detectScrolling();
  };

  handleScrollStart = () => {
    const { onScrollStart } = this.props;
    if (onScrollStart) onScrollStart();
    this.handleScrollStartAutoHide();
  };

  handleScrollStartAutoHide = () => {
    const { autoHide = false } = this.props;
    if (!autoHide) {
      return;
    }
    this.showTracks();
  };

  handleScrollStop = () => {
    const { onScrollStop } = this.props;
    onScrollStop?.();
    this.handleScrollStopAutoHide();
  };

  handleScrollStopAutoHide = () => {
    const { autoHide = false } = this.props;
    if (!autoHide) {
      return;
    }
    this.hideTracks();
  };

  handleWindowResize = () => {
    this.update();
  };

  handleHorizontalTrackMouseDown = event => {
    event.preventDefault();
    const { target, clientX } = event;
    const { left: targetLeft } = target.getBoundingClientRect();
    const thumbWidth = this.getThumbHorizontalWidth();
    const offset = Math.abs(targetLeft - clientX) - thumbWidth / 2;
    if (this.view.current) {
      this.view.current.scrollLeft = this.getScrollLeftForOffset(offset);
    }
  };

  handleVerticalTrackMouseDown = event => {
    event.preventDefault();
    const { target, clientY } = event;
    const { top: targetTop } = target.getBoundingClientRect();
    const thumbHeight = this.getThumbVerticalHeight();
    const offset = Math.abs(targetTop - clientY) - thumbHeight / 2;
    if (this.view.current) {
      this.view.current.scrollTop = this.getScrollTopForOffset(offset);
    }
  };

  handleHorizontalThumbMouseDown = event => {
    event.preventDefault();
    this.handleDragStart(event);
    const { target, clientX } = event;
    const { offsetWidth } = target;
    const { left } = target.getBoundingClientRect();
    this.prevPageX = offsetWidth - (clientX - left);
  };

  handleVerticalThumbMouseDown = event => {
    event.preventDefault();
    this.handleDragStart(event);
    const { target, clientY } = event;
    const { offsetHeight } = target;
    const { top } = target.getBoundingClientRect();
    this.prevPageY = offsetHeight - (clientY - top);
  };

  setupDragging = () => {
    css(document.body, disableSelectStyle);
    document.addEventListener('mousemove', this.handleDrag);
    document.addEventListener('mouseup', this.handleDragEnd);
    document.onselectstart = () => false;
  };

  teardownDragging = () => {
    css(document.body, disableSelectStyleReset);
    document.removeEventListener('mousemove', this.handleDrag);
    document.removeEventListener('mouseup', this.handleDragEnd);
    document.onselectstart = () => false;
  };

  handleDragStart = event => {
    this.dragging = true;
    event.stopImmediatePropagation();
    this.setupDragging();
  };

  handleDrag = event => {
    if (this.prevPageX) {
      const { clientX } = event;
      const { left: trackLeft } = this.trackHorizontal.current?.getBoundingClientRect() || {};
      const thumbWidth = this.getThumbHorizontalWidth();
      const clickPosition = thumbWidth - this.prevPageX;
      const offset = -trackLeft! + clientX - clickPosition;
      if (this.view.current) {
        this.view.current.scrollLeft = this.getScrollLeftForOffset(offset);
      }
    }
    if (this.prevPageY) {
      const { clientY } = event;
      const { top: trackTop } = this.trackVertical.current?.getBoundingClientRect() || {};
      const thumbHeight = this.getThumbVerticalHeight();
      const clickPosition = thumbHeight - this.prevPageY;
      const offset = -trackTop! + clientY - clickPosition;
      if (this.view.current) {
        this.view.current.scrollTop = this.getScrollTopForOffset(offset);
      }
    }
    return false;
  };

  handleDragEnd = () => {
    this.dragging = false;
    this.prevPageX = this.prevPageY = 0;
    this.teardownDragging();
    this.handleDragEndAutoHide();
  };

  handleDragEndAutoHide = () => {
    const { autoHide = false } = this.props;
    if (!autoHide) {
      return;
    }
    this.hideTracks();
  };

  handleTrackMouseEnter = () => {
    this.trackMouseOver = true;
    this.handleTrackMouseEnterAutoHide();
  };

  handleTrackMouseEnterAutoHide = () => {
    const { autoHide = false } = this.props;
    if (!autoHide) {
      return;
    }
    this.showTracks();
  };

  handleTrackMouseLeave = () => {
    this.trackMouseOver = false;
    this.handleTrackMouseLeaveAutoHide();
  };

  handleTrackMouseLeaveAutoHide = () => {
    const { autoHide = false } = this.props;
    if (!autoHide) {
      return;
    }
    this.hideTracks();
  };

  showTracks = () => {
    if (this.hideTracksTimeout.current) {
      clearTimeout(this.hideTracksTimeout.current);
    }
    css(this.trackHorizontal, { opacity: 1 });
    css(this.trackVertical, { opacity: 1 });
  };

  hideTracks = () => {
    if (this.dragging) {
      return;
    }
    if (this.scrolling) {
      return;
    }
    if (this.trackMouseOver) {
      return;
    }
    const { autoHideTimeout = 1000 } = this.props;
    if (this.hideTracksTimeout.current) {
      clearTimeout(this.hideTracksTimeout.current);
    }
    this.hideTracksTimeout.current = setTimeout(() => {
      css(this.trackHorizontal, { opacity: 0 });
      css(this.trackVertical, { opacity: 0 });
    }, autoHideTimeout);
  };

  detectScrolling = () => {
    if (this.scrolling) {
      return;
    }
    this.scrolling = true;
    this.handleScrollStart();
    this.detectScrollingInterval.current = setInterval(() => {
      if (this.lastViewScrollLeft === this.viewScrollLeft && this.lastViewScrollTop === this.viewScrollTop) {
        if (this.detectScrollingInterval.current) {
          clearInterval(this.detectScrollingInterval.current);
        }
        this.scrolling = false;
        this.handleScrollStop();
      }
      this.lastViewScrollLeft = this.viewScrollLeft;
      this.lastViewScrollTop = this.viewScrollTop;
    }, 100);
  };

  raf = (callback?: (values?: any) => void) => {
    if (this.requestFrame.current) {
      cancelAnimationFrame(this.requestFrame.current);
    }
    this.requestFrame.current = requestAnimationFrame(() => {
      callback?.();
    });
  };

  update = (callback?: (values?: any) => void) => {
    this.raf(() => this._update(callback));
  };

  _update = (callback?: (values?: any) => void) => {
    const { onUpdate, hideTracksWhenNotNeeded = false } = this.props;
    const values = this.getValues();
    if (getScrollbarWidth()) {
      const { scrollLeft, clientWidth, scrollWidth } = values;
      const trackHorizontalWidth = getInnerWidth(this.trackHorizontal.current!);
      const thumbHorizontalWidth = this.getThumbHorizontalWidth();
      const thumbHorizontalX = (scrollLeft / (scrollWidth - clientWidth)) * (trackHorizontalWidth - thumbHorizontalWidth);
      const thumbHorizontalStyle = {
        width: thumbHorizontalWidth,
        transform: `translateX(${thumbHorizontalX}px)`,
      };
      const { scrollTop, clientHeight, scrollHeight } = values;
      const trackVerticalHeight = getInnerHeight(this.trackVertical.current!);
      const thumbVerticalHeight = this.getThumbVerticalHeight();
      const thumbVerticalY = (scrollTop / (scrollHeight - clientHeight)) * (trackVerticalHeight - thumbVerticalHeight);
      const thumbVerticalStyle = {
        height: thumbVerticalHeight,
        transform: `translateY(${thumbVerticalY}px)`,
      };
      if (hideTracksWhenNotNeeded) {
        const trackHorizontalStyle = {
          visibility: scrollWidth > clientWidth ? 'visible' : 'hidden',
        };
        const trackVerticalStyle = {
          visibility: scrollHeight > clientHeight ? 'visible' : 'hidden',
        };
        css(this.trackHorizontal, trackHorizontalStyle);
        css(this.trackVertical, trackVerticalStyle);
      }
      css(this.thumbHorizontal, thumbHorizontalStyle);
      css(this.thumbVertical, thumbVerticalStyle);
    }
    if (onUpdate) {
      onUpdate(values);
    }
    if (typeof callback !== 'function') {
      return;
    }
    callback(values);
  };

  render() {
    const scrollbarWidth = getScrollbarWidth();
    /* eslint-disable no-unused-vars */
    const {
      onScroll,
      onScrollFrame,
      onScrollStart,
      onScrollStop,
      onUpdate,
      renderView = renderViewDefault,
      renderTrackHorizontal = renderTrackHorizontalDefault,
      renderTrackVertical = renderTrackVerticalDefault,
      renderThumbHorizontal = renderThumbHorizontalDefault,
      renderThumbVertical = renderThumbVerticalDefault,
      tagName = 'div',
      hideTracksWhenNotNeeded = false,
      autoHide,
      autoHideTimeout = 1000,
      autoHideDuration = 200,
      thumbSize,
      thumbMinSize = 30,
      universal = false,
      autoHeight = false,
      autoHeightMin = 0,
      autoHeightMax = 200,
      style,
      children,
      ...props
    } = this.props;
    /* eslint-enable no-unused-vars */

    const { didMountUniversal } = this.state;

    const containerStyle: React.CSSProperties = {
      ...containerStyleDefault,
      ...(autoHeight && {
        ...containerStyleAutoHeight,
        minHeight: autoHeightMin,
        maxHeight: autoHeightMax,
      }),
      ...style,
    };

    const viewStyle: React.CSSProperties = {
      ...viewStyleDefault,
      // Hide scrollbars by setting a negative margin
      marginRight: scrollbarWidth ? -scrollbarWidth : 0,
      marginBottom: scrollbarWidth ? -scrollbarWidth : 0,
      ...(autoHeight && {
        ...viewStyleAutoHeight,
        // Add scrollbarWidth to autoHeight in order to compensate negative margins
        minHeight: typeof autoHeightMin === 'string' ? `calc(${autoHeightMin} + ${scrollbarWidth}px)` : autoHeightMin + scrollbarWidth,
        maxHeight: typeof autoHeightMax === 'string' ? `calc(${autoHeightMax} + ${scrollbarWidth}px)` : autoHeightMax + scrollbarWidth,
      }),
      // Override min/max height for initial universal rendering
      ...(autoHeight &&
        universal &&
        !didMountUniversal && {
          minHeight: autoHeightMin,
          maxHeight: autoHeightMax,
        }),
      // Override
      ...(universal && !didMountUniversal && viewStyleUniversalInitial),
    };

    const trackAutoHeightStyle: React.CSSProperties = {
      transition: `opacity ${autoHideDuration}ms`,
      opacity: 0,
    };

    const trackHorizontalStyle: React.CSSProperties = {
      ...trackHorizontalStyleDefault,
      ...(autoHide && trackAutoHeightStyle),
      ...((!scrollbarWidth || (universal && !didMountUniversal)) && {
        display: 'none',
      }),
    };

    const trackVerticalStyle: React.CSSProperties = {
      ...trackVerticalStyleDefault,
      ...(autoHide && trackAutoHeightStyle),
      ...((!scrollbarWidth || (universal && !didMountUniversal)) && {
        display: 'none',
      }),
    };

    return createElement(tagName, { ...props, style: containerStyle, ref: this.container }, [
      cloneElement(renderView({ style: viewStyle }), { key: 'view', ref: this.view }, children),
      cloneElement(
        renderTrackHorizontal({ style: trackHorizontalStyle }),
        { key: 'trackHorizontal', ref: this.trackHorizontal },
        cloneElement(renderThumbHorizontal({ style: thumbHorizontalStyleDefault }), { ref: this.thumbHorizontal })
      ),
      cloneElement(
        renderTrackVertical({ style: trackVerticalStyle }),
        { key: 'trackVertical', ref: this.trackVertical },
        cloneElement(renderThumbVertical({ style: thumbVerticalStyleDefault }), { ref: this.thumbVertical })
      ),
    ]);
  }
}

export default Scrollbars;
