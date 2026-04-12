import useHiddenStackLayer from '../../../hooks/useHiddenStackLayer';
import Header from '../Header';
import Box from '../Box';
import Footer from '../Footer';
import '../layout.css';
import './Page.css';

const Page = ({
  component = 'section',
  title,
  onClose,
  onOpenPage = null,
  onOpenView = null,
  headerContent = null,
  showFooter = true,
  wideHeaderContent = false,
  hideHeaderBrand = false,
  showCloseButton = true,
  inlineCloseButton = false,
  isHidden = false,
  transitionState = 'open',
  className = '',
  layerIndex = 0,
  children,
  style,
  ...props
}) => {
  const Component = component;
  const layerRef = useHiddenStackLayer(isHidden);

  return (
    <Component
      {...props}
      ref={layerRef}
      className={[
        'dq-layout-page',
        `dq-layout-page--transition-${transitionState}`,
        isHidden ? 'dq-layout-page--hidden-stack' : '',
        className,
      ].filter(Boolean).join(' ')}
      style={{
        '--dq-layout-page-layer-index': layerIndex,
        ...style,
      }}
    >
      <Header
        isPageView
        pageTitle={title}
        centerContent={headerContent}
        wideCenterContent={wideHeaderContent}
        hideBrand={hideHeaderBrand}
        showCloseButton={showCloseButton}
        inlineCloseButton={inlineCloseButton}
        onClosePage={onClose}
      />

      <Box component="div" className="dq-layout-page__body">
        <Box component="main" className="dq-layout-main dq-layout-page__main dq-layout-container dq-layout-main-shell">
          {children}
        </Box>

        {showFooter ? <Footer onOpenPage={onOpenPage} onOpenView={onOpenView} /> : null}
      </Box>
    </Component>
  );
};

export default Page;
