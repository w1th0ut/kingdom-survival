import React from 'react';
import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: () => void;
  onRegisterUsername: () => void;
  isSignedIn: boolean;
  hasUsername: boolean;
}

export function AuthModal({ 
  isOpen, 
  onClose, 
  onSignIn, 
  onRegisterUsername, 
  isSignedIn, 
  hasUsername 
}: AuthModalProps) {
  if (!isOpen) return null;

  const getModalContent = () => {
    if (!isSignedIn) {
      return {
        title: "🎮 Sign In Required",
        message: "You need to sign in with Monad Games ID to start playing Kingdom Survival!",
        primaryAction: {
          label: "Sign In with Monad Games ID",
          onClick: onSignIn,
          className: "auth-modal-primary-btn"
        },
        secondaryAction: {
          label: "Cancel",
          onClick: onClose,
          className: "auth-modal-secondary-btn"
        }
      };
    } else if (!hasUsername) {
      return {
        title: "👤 Username Required",
        message: "You need to register a username on Monad Games ID to start playing and compete on the leaderboard!",
        primaryAction: {
          label: "Register Username",
          onClick: onRegisterUsername,
          className: "auth-modal-primary-btn"
        },
        secondaryAction: {
          label: "Cancel",
          onClick: onClose,
          className: "auth-modal-secondary-btn"
        }
      };
    }
    
    return null;
  };

  const content = getModalContent();
  if (!content) return null;

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-header">
          <h2 className="auth-modal-title">{content.title}</h2>
          <button className="auth-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="auth-modal-body">
          <p className="auth-modal-message">{content.message}</p>
        </div>
        
        <div className="auth-modal-footer">
          <button 
            className={content.primaryAction.className}
            onClick={content.primaryAction.onClick}
          >
            {content.primaryAction.label}
          </button>
          <button 
            className={content.secondaryAction.className}
            onClick={content.secondaryAction.onClick}
          >
            {content.secondaryAction.label}
          </button>
        </div>
      </div>
    </div>
  );
}
