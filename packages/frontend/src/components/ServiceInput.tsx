import React from 'react';
import styles from './ServiceInput.module.css';
import CredentialInput from './CredentialInput';

interface Field {
  label: string;
  link?: string;
  value: string;
  setValue: (value: string) => void;
}

interface ServiceInputProps {
  serviceName: string;
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  fields: Field[];
  moveService: (direction: 'up' | 'down') => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  signUpLink?: string;
}

const ServiceInput: React.FC<ServiceInputProps> = ({
  serviceName,
  enabled,
  setEnabled,
  fields,
  moveService,
  canMoveUp,
  canMoveDown,
  signUpLink,
}) => {
  return (
    <div
      className={`${styles.card} ${enabled ? styles.enabled : styles.disabled}`}
    >
      <div className={styles.header}>
        <span className={styles.serviceName}>
          {serviceName}
          {enabled && signUpLink && (
            <span className={styles.smallText}>
              {` (Don't have an account? Sign up with `}
              <a
                href={signUpLink}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                this link)
              </a>
            </span>
          )}
        </span>
        <div className={styles.actions}>
          {canMoveUp && (
            <button
              className={styles.actionButton}
              onClick={() => moveService('up')}
            >
              <svg
                fill="#ffffff"
                version="1.1"
                id="Capa_1"
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                width="24px"
                height="24px"
                viewBox="0 0 96.154 96.154"
                xmlSpace="preserve"
                stroke="#ffffff"
                transform="matrix(1, 0, 0, -1, 0, 0)"
              >
                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                <g
                  id="SVGRepo_tracerCarrier"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></g>
                <g id="SVGRepo_iconCarrier">
                  {' '}
                  <g>
                    {' '}
                    <path d="M0.561,20.971l45.951,57.605c0.76,0.951,2.367,0.951,3.127,0l45.956-57.609c0.547-0.689,0.709-1.716,0.414-2.61 c-0.061-0.187-0.129-0.33-0.186-0.437c-0.351-0.65-1.025-1.056-1.765-1.056H2.093c-0.736,0-1.414,0.405-1.762,1.056 c-0.059,0.109-0.127,0.253-0.184,0.426C-0.15,19.251,0.011,20.28,0.561,20.971z"></path>{' '}
                  </g>{' '}
                </g>
              </svg>
            </button>
          )}
          {canMoveDown && (
            <button
              className={styles.actionButton}
              onClick={() => moveService('down')}
            >
              <svg
                fill="#ffffff"
                version="1.1"
                id="Capa_1"
                xmlns="http://www.w3.org/2000/svg"
                width="24px"
                height="24px"
                viewBox="0 0 96.154 96.154"
                stroke="#ffffff"
              >
                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                <g
                  id="SVGRepo_tracerCarrier"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></g>
                <g id="SVGRepo_iconCarrier">
                  {' '}
                  <g>
                    {' '}
                    <path d="M0.561,20.971l45.951,57.605c0.76,0.951,2.367,0.951,3.127,0l45.956-57.609c0.547-0.689,0.709-1.716,0.414-2.61 c-0.061-0.187-0.129-0.33-0.186-0.437c-0.351-0.65-1.025-1.056-1.765-1.056H2.093c-0.736,0-1.414,0.405-1.762,1.056 c-0.059,0.109-0.127,0.253-0.184,0.426C-0.15,19.251,0.011,20.28,0.561,20.971z"></path>{' '}
                  </g>{' '}
                </g>
              </svg>
            </button>
          )}
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className={styles.checkbox}
          />
        </div>
      </div>

      {enabled && (
        <div className={styles.fields}>
          {fields.map((field, index) => (
            <div key={index} className={styles.field}>
              <label>
                {field.label}
                {field.link && (
                  <>
                    {'. Get it '}
                    <a
                      href={field.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.link}
                    >
                      here
                    </a>
                  </>
                )}
              </label>
              <CredentialInput
                credential={field.value}
                setCredential={field.setValue}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceInput;
