const sanitizeFieldToken = (value) => String(value ?? '').replace(/[^a-zA-Z0-9_-]/g, '');

export const buildFieldId = ({ id, generatedId, prefix }) =>
  id ?? `${prefix}-${sanitizeFieldToken(generatedId)}`;

export const joinFieldIds = (...ids) => {
  const resolvedIds = ids.filter(Boolean).join(' ').trim();

  return resolvedIds || undefined;
};
