import React, { useEffect } from 'react';
import styles from './SortableCardList.module.css';

interface SortableCardListProps {
  items: { [key: string]: boolean | string | undefined }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setItems: (items: { [key: string]: any }[]) => void;
}

const SortableCardList: React.FC<SortableCardListProps> = ({
  items,
  setItems,
}) => {
  useEffect(() => {
    setItems(items);
  }, [items, setItems]);

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const [movedItem] = newItems.splice(index, 1);
    newItems.splice(direction === 'up' ? index - 1 : index + 1, 0, movedItem);
    setItems(newItems);
  };

  const toggleItem = (itemKey: string) => {
    const newItems = items.map((item) => {
      if (Object.keys(item)[0] === itemKey) {
        return { [itemKey]: !item[itemKey], direction: item.direction };
      }
      return item;
    });
    setItems(newItems);
  };

  const toggleDirection = (itemKey: string) => {
    const newItems = items.map((item) => {
      if (Object.keys(item)[0] === itemKey) {
        return {
          [itemKey]: item[itemKey],
          direction: item.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return item;
    });
    setItems(newItems);
  };

  return (
    <div className={styles.container}>
      {items.map((item, index) => {
        const itemKey = Object.keys(item)[0];
        const isEnabled =
          typeof item[itemKey] === 'boolean' ? item[itemKey] : false;
        const directionChangeable = item.direction;
        return (
          <div key={itemKey}>
            <div
              className={`${styles.card} ${!isEnabled ? styles.disabled : ''}`}
            >
              <div className={styles.actions}>
                {index > 0 && (
                  <button
                    className={styles.arrowButton}
                    onClick={() => moveItem(index, 'up')}
                    disabled={!isEnabled}
                  >
                    <svg
                      fill="#ffffff"
                      version="1.1"
                      id="Capa_1"
                      xmlns="http://www.w3.org/2000/svg"
                      xmlnsXlink="http://www.w3.org/1999/xlink"
                      width="32px"
                      height="32px"
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
                {index < items.length - 1 && (
                  <button
                    className={styles.arrowButton}
                    onClick={() => moveItem(index, 'down')}
                    disabled={!isEnabled}
                  >
                    <svg
                      fill="#ffffff"
                      version="1.1"
                      id="Capa_1"
                      xmlns="http://www.w3.org/2000/svg"
                      width="32px"
                      height="32px"
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
              </div>
              <span>
                <p style={{ fontSize: '1.2em' }}>{itemKey}</p>
              </span>
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={() => toggleItem(itemKey)}
                className={styles.checkbox}
              />
            </div>
            {directionChangeable && (
              <div
                className={`${styles.directionBar} ${!isEnabled ? styles.disabled : ''}`}
                key={`direction-${itemKey}`}
              >
                <button
                  className={`${styles.directionButton} ${!isEnabled ? styles.disabled : ''}`}
                  onClick={() => toggleDirection(itemKey)}
                >
                  {item.direction === 'asc'
                    ? '↑ Ascending ↑'
                    : '↓ Descending ↓'}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SortableCardList;
