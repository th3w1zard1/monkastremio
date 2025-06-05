import React, { useState } from 'react';
import styles from './AddonsList.module.css';
import { AddonDetail, Config } from '@aiostreams/types';
import CredentialInput from './CredentialInput';
import MultiSelect from './MutliSelect';

interface AddonsListProps {
  choosableAddons: string[];
  addonDetails: AddonDetail[];
  addons: Config['addons'];
  setAddons: (addons: Config['addons']) => void;
}

const AddonsList: React.FC<AddonsListProps> = ({
  choosableAddons,
  addonDetails,
  addons,
  setAddons,
}) => {
  const [selectedAddon, setSelectedAddon] = useState<string>('');

  const addAddon = () => {
    if (selectedAddon) {
      setAddons([...addons, { id: selectedAddon, options: {} }]);
      setSelectedAddon('');
    }
  };

  const removeAddon = (index: number) => {
    const newAddons = [...addons];
    newAddons.splice(index, 1);
    setAddons(newAddons);
  };

  const updateOption = (
    addonIndex: number,
    optionKey: string,
    value?: string
  ) => {
    const newAddons = [...addons];
    newAddons[addonIndex].options[optionKey] = value;
    setAddons(newAddons);
  };

  const moveAddon = (index: number, direction: 'up' | 'down') => {
    const newAddons = [...addons];
    const [movedAddon] = newAddons.splice(index, 1);
    newAddons.splice(direction === 'up' ? index - 1 : index + 1, 0, movedAddon);
    setAddons(newAddons);
  };

  return (
    <div className={styles.container}>
      <div className={styles.addonSelector}>
        <select
          value={selectedAddon}
          onChange={(e) => setSelectedAddon(e.target.value)}
        >
          <option value="">Select an addon</option>
          {choosableAddons.map((addon) => {
            const addonDetail = addonDetails.find(
              (detail) => detail.id === addon
            );
            if (addonDetail) {
              return (
                <option key={addon} value={addon}>
                  {addonDetail.name}
                </option>
              );
            }
            return null;
          })}
        </select>
        <button onClick={addAddon}>Add Addon</button>
      </div>
      {addons.map((addon, index) => {
        const details = addonDetails.find((detail) => detail.id === addon.id);
        return (
          <div key={index} className={styles.card}>
            <div className={styles.cardHeader}>
              <span style={{ fontSize: '1.2em', fontWeight: 'bold' }}>
                {details?.name}
              </span>
              <div className={styles.actions}>
                {index > 0 && (
                  <button
                    className={styles.actionButton}
                    onClick={() => moveAddon(index, 'up')}
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
                {index < addons.length - 1 && (
                  <button
                    className={styles.actionButton}
                    onClick={() => moveAddon(index, 'down')}
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
                <button
                  onClick={() => removeAddon(index)}
                  className={styles.actionButton}
                >
                  ✖
                </button>
              </div>
            </div>
            <div className={styles.cardBody}>
              {details?.options
                ?.filter((option) => option.type !== 'deprecated')
                ?.map((option) => (
                  <div key={option.id} className={styles.option}>
                    <label>
                      {option.label}
                      {option.required && (
                        <span className={styles.required}>
                          <small>
                            <em>*Required Field</em>
                          </small>
                        </span>
                      )}
                      {option.type === 'checkbox' && (
                        <input
                          type="checkbox"
                          checked={addon.options[option.id] === 'true'}
                          onChange={(e) =>
                            updateOption(
                              index,
                              option.id,
                              e.target.checked ? 'true' : undefined
                            )
                          }
                          className={styles.checkbox}
                        />
                      )}
                    </label>
                    {option.description && <small>{option.description}</small>}
                    {option.type === 'text' &&
                      (option.secret ? (
                        <CredentialInput
                          credential={addon.options[option.id] || ''}
                          setCredential={(value) =>
                            updateOption(
                              index,
                              option.id,
                              value ? value : undefined
                            )
                          }
                        />
                      ) : (
                        <input
                          type="text"
                          value={(addon.options[option.id] as string) || ''}
                          onChange={(e) =>
                            updateOption(
                              index,
                              option.id,
                              e.target.value ? e.target.value : undefined
                            )
                          }
                          className={styles.textInput}
                        />
                      ))}
                    {option.type === 'select' && (
                      <select
                        value={addon.options[option.id] || ''}
                        onChange={(e) =>
                          updateOption(
                            index,
                            option.id,
                            e.target.value ? e.target.value : undefined
                          )
                        }
                        className={styles.textInput}
                      >
                        <option value="">None</option>
                        {option.options.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                    {option.type === 'number' && (
                      <input
                        type="number"
                        value={addon.options[option.id] || ''}
                        onChange={(e) =>
                          updateOption(
                            index,
                            option.id,
                            e.target.value ? e.target.value : undefined
                          )
                        }
                        className={styles.textInput}
                      />
                    )}
                    {option.type === 'multiSelect' && (
                      <MultiSelect
                        options={option.options}
                        setValues={(values) =>
                          updateOption(index, option.id, values.join(','))
                        }
                        values={addon.options[option.id]?.split(',') || []}
                      />
                    )}
                  </div>
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AddonsList;
