import React, { useEffect } from 'react';
import styles from './Slider.module.css';

interface SliderProps {
  maxValue: number;
  value: number;
  setValue: (value: number | null) => void;
  defaultValue: 'min' | 'max';
  id: string;
}

const Slider: React.FC<SliderProps> = ({
  maxValue,
  value,
  setValue,
  defaultValue,
  id,
}) => {
  useEffect(() => {
    const slider = document.getElementById(id) as HTMLElement;
    const sliderValue =
      defaultValue === 'min'
        ? ((value || 0) / maxValue) * 100
        : ((value === null ? maxValue : value) / maxValue) * 100;

    if (slider) {
      slider.style.setProperty(`--${id}Value`, `${sliderValue}%`);
    }
  }, [value, maxValue, defaultValue, id]);

  return (
    <input
      type="range"
      id={id}
      min="0"
      max={maxValue}
      step={maxValue / 10240}
      value={value || 0}
      onChange={(e) => {
        setValue(
          defaultValue === 'min'
            ? e.target.value === '0'
              ? null
              : parseInt(e.target.value)
            : e.target.value === maxValue.toString()
              ? null
              : parseInt(e.target.value)
        );
      }}
      className={styles.slider}
      style={
        { '--currentSliderValue': `var(--${id}Value)` } as React.CSSProperties
      }
    />
  );
};

export default Slider;
