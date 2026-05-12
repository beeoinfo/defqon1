import { useContext } from 'react';
import { I18nContext } from '@/i18n/I18nContext';

const useI18n = () => useContext(I18nContext);

export default useI18n;
