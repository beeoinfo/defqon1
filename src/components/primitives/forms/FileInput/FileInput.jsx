import { useId, useState } from 'react';
import { FileArrowUpIcon } from '@phosphor-icons/react';
import useI18n from '@/hooks/useI18n';
import Box from '../../../layout/Box';
import { buildFieldId, joinFieldIds } from '../fieldUtils';
import '../forms.css';
import './FileInput.css';

const formatSelectedFiles = (files, multiple, t) => {
  const fileList = Array.from(files ?? []);

  if (fileList.length === 0) {
    return t('No file selected');
  }

  if (multiple && fileList.length > 1) {
    return t('{count} files selected', { count: fileList.length });
  }

  return fileList.map((file) => file.name).join(', ');
};

const FileInput = ({
  id,
  label,
  hideLabel = false,
  ariaLabel,
  description,
  buttonLabel = 'Choose file',
  multiple = false,
  disabled = false,
  required = false,
  onFilesChange,
  onChange,
  className = '',
  ...props
}) => {
  const { t } = useI18n();
  const generatedId = useId();
  const inputId = buildFieldId({ id, generatedId, prefix: 'dq-ui-file-input' });
  const descriptionId = description ? `${inputId}-description` : undefined;
  const [selectedFiles, setSelectedFiles] = useState([]);
  const selectedSummary = formatSelectedFiles(selectedFiles, multiple, t);

  const handleChange = (event) => {
    const nextFiles = event.target.files;

    setSelectedFiles(Array.from(nextFiles ?? []));
    onFilesChange?.(nextFiles, event);
    onChange?.(event);
  };

  return (
    <Box
      component="div"
      slot="content"
      gap="var(--dq-ui-space-sm)"
      className={['dq-ui-form-field', 'dq-ui-file-input', className].filter(Boolean).join(' ')}
    >
      {label ? (
        <label
          htmlFor={inputId}
          className={[
            'dq-ui-form-field__label',
            hideLabel ? 'sr-only' : '',
          ].filter(Boolean).join(' ')}
        >
          {label}
          {required ? (
            <span className="dq-ui-form-field__required" aria-hidden="true">
              {' '}*
            </span>
          ) : null}
        </label>
      ) : null}

      <Box
        component="label"
        htmlFor={inputId}
        slot="content"
        direction="row"
        align="center"
        wrap="wrap"
        gap="var(--dq-ui-space-md)"
        className={[
          'dq-ui-form-control',
          'dq-ui-file-input__control',
          disabled ? 'dq-ui-file-input__control--disabled' : '',
        ].filter(Boolean).join(' ')}
      >
        <input
          {...props}
          id={inputId}
          type="file"
          multiple={multiple}
          disabled={disabled}
          required={required}
          aria-label={!label ? ariaLabel : undefined}
          aria-describedby={joinFieldIds(descriptionId)}
          onChange={handleChange}
          className="sr-only dq-ui-file-input__input"
        />
        <span className="dq-ui-file-input__button" aria-hidden="true">
          <FileArrowUpIcon size={18} />
          <span>{t(buttonLabel)}</span>
        </span>
        <span className="dq-ui-file-input__value">
          {selectedSummary}
        </span>
      </Box>

      {description ? (
        <p id={descriptionId} className="dq-ui-form-field__description">
          {description}
        </p>
      ) : null}
    </Box>
  );
};

export default FileInput;
