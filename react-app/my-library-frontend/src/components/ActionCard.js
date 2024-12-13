/*
 * Action Card Component
 * Displays a card with a title and description
 * Used for edit book and add book actions
 */


import React, { } from 'react';
import '../styles/actionCard.css';

function ActionCard({ title, description, onClick }) {
  return (
    <div className="action-card" onClick={onClick}>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

export default ActionCard;
