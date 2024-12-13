/*
 * Skeleton component
 * Displays a skeleton for loading animations so that the user doesn't think the page is frozen (like loading dots - but for initial page load)
 */


import React from 'react';
import '../styles/skeleton.css'; // Import the CSS file

// Base Skeleton component
export const Skeleton = ({ width, height, style }) => (
  <div
    className="skeleton"
    style={{
      width,
      height,
      ...style,
    }}
  />
);

// BookList skeleton - match the actual book card size
export const BookCardSkeleton = () => (
  <div className="book-card-skeleton">
    <Skeleton 
      width="100%" 
      height="200px"
      style={{ marginBottom: '10px', backgroundColor: '#b7b7b7' }} 
    />
    <Skeleton 
      width="90%" 
      height="20px" 
      style={{ marginBottom: '8px', backgroundColor: '#b7b7b7' }} 
    />
    <Skeleton 
      width="60%" 
      height="16px"
      style={{ backgroundColor: '#b7b7b7' }}
    />
  </div>
);

// Account page skeleton
export const AccountBookCardSkeleton = () => (
  <div className="account-book-card-skeleton">
    <Skeleton 
      width="120px"
      height="160px"
    />
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
      <Skeleton width="60%" height="24px" style={{ backgroundColor: '#b7b7b7' }}/>
      <Skeleton width="80%" height="20px" style={{ backgroundColor: '#b7b7b7' }}/>
      <Skeleton width="80%" height="20px" style={{ backgroundColor: '#b7b7b7' }}/>
    </div>
  </div>
);

// Table row skeleton
export const TableRowSkeleton = () => (
  <>
    <tr className="table-row-skeleton">
      <td><Skeleton width="150px" height="20px" style={{ backgroundColor: '#b7b7b7' }} /></td>
      <td><Skeleton width="120px" height="20px" style={{ backgroundColor: '#b7b7b7' }} /></td>
      <td><Skeleton width="100px" height="20px" style={{ backgroundColor: '#b7b7b7' }} /></td>
      <td><Skeleton width="60px" height="20px" style={{ backgroundColor: '#b7b7b7' }} /></td>
      <td><Skeleton width="100px" height="20px" style={{ backgroundColor: '#b7b7b7' }} /></td>
      <td><Skeleton width="150px" height="20px" style={{ backgroundColor: '#b7b7b7' }} /></td>
      <td><Skeleton width="200px" height="40px" style={{ borderRadius: '8px', backgroundColor: '#b7b7b7' }} /></td>
    </tr>
  </>
);   