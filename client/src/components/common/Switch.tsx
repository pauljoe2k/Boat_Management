import React from 'react';

export interface SwitchProps {
  id?: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({
  id,
  label,
  description,
  checked,
  onChange,
  disabled = false,
}) => {
  const switchId = id || `switch-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="sw">
      <div>
        <label htmlFor={switchId} style={{ cursor: 'pointer', display: 'block' }}>
          <b>{label}</b>
          {description && (
            <>
              <br />
              <small className="mu">{description}</small>
            </>
          )}
        </label>
      </div>
      <input
        id={switchId}
        type="checkbox"
        className="tgl"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
      />
    </div>
  );
};
