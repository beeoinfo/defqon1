import AboutPage from './AboutPage';
import LegalPage from './LegalPage';
import RoadmapPage from './RoadmapPage';
import SearchPage, { SearchPageHeaderContent } from './SearchPage';
import SettingsPage from './SettingsPage';

export const PAGE_DEFINITIONS = {
  settings: {
    title: 'Settings',
    Component: SettingsPage,
  },
  about: {
    title: 'About',
    Component: AboutPage,
    stackGroup: 'footer-links',
  },
  roadmap: {
    title: 'Roadmap',
    Component: RoadmapPage,
    stackGroup: 'footer-links',
  },
  legal: {
    title: 'Legal',
    Component: LegalPage,
    stackGroup: 'footer-links',
  },
  search: {
    title: null,
    Component: SearchPage,
    showFooter: false,
    wideHeaderContent: true,
    hideHeaderBrand: true,
    showCloseButton: false,
    inlineCloseButton: false,
    HeaderContentComponent: SearchPageHeaderContent,
  },
};
