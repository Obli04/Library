/*
 * Loading Dots component
 * Displays loading dots animation so that user doesn't think the page is frozen
 */

import React from 'react';

const LoadingDots = () => {
  return (
    <span className="loading-dots">
      <style>
        {`
          .loading-dots::after {
            content: '.';
            animation: dots 1.5s steps(5, end) infinite;
          }
          
          @keyframes dots {
            0%, 20% { content: '.'; }
            40% { content: '..'; }
            60% { content: '...'; }
            80%, 100% { content: ''; }
          }
        `}
      </style>
    </span>
  );
};

export default LoadingDots;