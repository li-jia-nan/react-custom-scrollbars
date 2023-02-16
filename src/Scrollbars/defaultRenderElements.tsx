import React from 'react';

export const renderViewDefault = (props: React.HTMLAttributes<HTMLElement>): React.ReactElement => {
  return <div {...props} />;
};

export const renderTrackHorizontalDefault = ({ style, ...props }: React.HTMLAttributes<HTMLElement>): React.ReactElement => {
  const finalStyle: React.CSSProperties = { ...style, right: 2, bottom: 2, left: 2, borderRadius: 3 };
  return <div style={finalStyle} {...props} />;
};

export const renderTrackVerticalDefault = ({ style, ...props }: React.HTMLAttributes<HTMLElement>): React.ReactElement => {
  const finalStyle = { ...style, right: 2, bottom: 2, top: 2, borderRadius: 3 };
  return <div style={finalStyle} {...props} />;
};

export const renderThumbHorizontalDefault = ({ style, ...props }: React.HTMLAttributes<HTMLElement>): React.ReactElement => {
  const finalStyle: React.CSSProperties = { ...style, cursor: 'pointer', borderRadius: 'inherit', backgroundColor: 'rgba(0,0,0,.2)' };
  return <div style={finalStyle} {...props} />;
};

export const renderThumbVerticalDefault = ({ style, ...props }: React.HTMLAttributes<HTMLElement>): React.ReactElement => {
  const finalStyle: React.CSSProperties = { ...style, cursor: 'pointer', borderRadius: 'inherit', backgroundColor: 'rgba(0,0,0,.2)' };
  return <div style={finalStyle} {...props} />;
};
