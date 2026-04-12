/**
 * Compute the next page stack when opening a page.
 * Existing pages are brought to the front instead of duplicated.
 * Pages that share the same exclusive stack group replace each other.
 */
export const getNextPageStackOnOpen = ({
  currentStack,
  nextType,
  pageDefinitions,
  createPageId,
}) => {
  const nextDefinition = pageDefinitions[nextType];

  if (!nextDefinition) {
    return currentStack;
  }

  const nextGroup = nextDefinition.stackGroup ?? null;
  const existingPage = currentStack.find((page) => page.type === nextType) ?? null;

  if (existingPage) {
    const hasGroupConflict = nextGroup
      ? currentStack.some(
        (page) =>
          page.id !== existingPage.id &&
          pageDefinitions[page.type]?.stackGroup === nextGroup
      )
      : false;
    const isAlreadyOnTop = currentStack.at(-1)?.id === existingPage.id;

    if (isAlreadyOnTop && !hasGroupConflict) {
      return currentStack;
    }

    const nextStack = currentStack.filter((page) => {
      if (page.id === existingPage.id) {
        return false;
      }

      if (!nextGroup) {
        return true;
      }

      return pageDefinitions[page.type]?.stackGroup !== nextGroup;
    });

    return [...nextStack, existingPage];
  }

  const baseStack = nextGroup
    ? currentStack.filter((page) => pageDefinitions[page.type]?.stackGroup !== nextGroup)
    : currentStack;

  return [
    ...baseStack,
    {
      id: createPageId(nextType),
      type: nextType,
    },
  ];
};

export const getNextPageStackOnClose = ({ currentStack, pageId }) => {
  const hasMatchingPage = currentStack.some((page) => page.id === pageId);

  if (!hasMatchingPage) {
    return currentStack;
  }

  return currentStack.filter((page) => page.id !== pageId);
};
