import { useContext, useMemo } from 'react';
import { CSSObjectWithLabel } from 'react-select';

import { GrafanaTheme2 } from '@grafana/data';

import { PortalPresentationContext } from '../Portal/PortalPresentationContext';

import { EmbeddedSelectContext } from './EmbeddedSelectContext';

export default function resetSelectStyles(theme: GrafanaTheme2) {
  return {
    clearIndicator: () => ({}),
    container: () => ({}),
    control: () => ({}),
    dropdownIndicator: () => ({}),
    group: () => ({}),
    groupHeading: () => ({}),
    indicatorsContainer: () => ({}),
    indicatorSeparator: () => ({}),
    input: function (originalStyles: CSSObjectWithLabel) {
      return {
        ...originalStyles,
        color: 'inherit',
        margin: 0,
        padding: 0,
        // Set an explicit z-index here to ensure this element always overlays the singleValue
        zIndex: 1,
        overflow: 'hidden',
      };
    },
    loadingIndicator: () => ({}),
    loadingMessage: () => ({}),
    menu: () => ({}),
    menuList: ({ maxHeight }: { maxHeight: number }) => ({
      maxHeight,
    }),
    multiValue: () => ({}),
    multiValueLabel: () => ({
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }),
    multiValueRemove: () => ({}),
    noOptionsMessage: () => ({}),
    option: () => ({}),
    placeholder: (originalStyles: CSSObjectWithLabel) => ({
      ...originalStyles,
      color: theme.colors.text.secondary,
    }),
    singleValue: () => ({}),
    valueContainer: () => ({}),
  };
}

export function useCustomSelectStyles(theme: GrafanaTheme2, width: number | string | undefined) {
  const presentation = useContext(PortalPresentationContext);
  const embedded = useContext(EmbeddedSelectContext);
  return useMemo(() => {
    return {
      ...resetSelectStyles(theme),
      menuPortal: (base: any) => {
        // Would like to correct top position when menu is placed bottom, but have props are not sent to this style function.
        // Only state is. https://github.com/JedWatson/react-select/blob/master/packages/react-select/src/components/Menu.tsx#L605
        return {
          ...base,
          zIndex: theme.zIndex.portal,
          ...presentation,
        };
      },
      //These are required for the menu positioning to function
      menu: ({ top, bottom, position }: any) => {
        return {
          top: embedded ? undefined : top,
          bottom: embedded ? undefined : bottom,
          position: embedded ? 'relative' : position,
          minWidth: '100%',
          zIndex: theme.zIndex.dropdown,
          ...presentation,
        };
      },
      container: () => ({
        width: width ? theme.spacing(width) : '100%',
        display: !embedded && width === 'auto' ? 'inline-flex' : 'flex',
        flexDirection: embedded ? 'column' : undefined,
      }),
      option: (provided: any, state: any) => ({
        ...provided,
        opacity: state.isDisabled ? 0.5 : 1,
      }),
    };
  }, [theme, width, presentation, embedded]);
}
