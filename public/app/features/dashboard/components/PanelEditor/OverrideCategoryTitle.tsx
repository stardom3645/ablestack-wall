import { css } from '@emotion/css';

import { FieldConfigOptionsRegistry, GrafanaTheme2, ConfigOverrideRule } from '@grafana/data';
import { HorizontalGroup, Icon, IconButton, useStyles2 } from '@grafana/ui';
import { FieldMatcherUIRegistryItem } from '@grafana/ui/src/components/MatchersUI/types';
import { useWallOptionText } from 'app/features/wall-modern/editor/optionText';

interface Props {
  isExpanded: boolean;
  registry: FieldConfigOptionsRegistry;
  matcherUi: FieldMatcherUIRegistryItem<ConfigOverrideRule>;
  override: ConfigOverrideRule;
  overrideName: string;
  onOverrideRemove: () => void;
}
export const OverrideCategoryTitle = ({
  isExpanded,
  registry,
  matcherUi,
  overrideName,
  override,
  onOverrideRemove,
}: Props) => {
  const text = useWallOptionText();
  const styles = useStyles2(getStyles);
  const properties = override.properties.map((p) => registry.getIfExists(p.id)).filter((prop) => !!prop);
  const propertyNames = properties.map((p) => text(p?.name)).join(', ');
  const matcherOptions = matcherUi.optionsToLabel(override.matcher.options);

  return (
    <div>
      <HorizontalGroup justify="space-between">
        <div>{text(overrideName)}</div>
        <IconButton name="trash-alt" onClick={onOverrideRemove} tooltip={text('Remove override')} />
      </HorizontalGroup>
      {!isExpanded && (
        <div className={styles.overrideDetails}>
          <div className={styles.options} title={matcherOptions}>
            {matcherOptions} <Icon name="angle-right" /> {propertyNames}
          </div>
        </div>
      )}
    </div>
  );
};

OverrideCategoryTitle.displayName = 'OverrideTitle';

const getStyles = (theme: GrafanaTheme2) => {
  return {
    matcherUi: css({
      padding: theme.spacing(1),
    }),
    propertyPickerWrapper: css({
      marginTop: theme.spacing(2),
    }),
    overrideDetails: css({
      fontSize: theme.typography.bodySmall.fontSize,
      color: theme.colors.text.secondary,
      fontWeight: theme.typography.fontWeightRegular,
    }),
    options: css({
      overflow: 'hidden',
      paddingRight: theme.spacing(4),
    }),
    unknownLabel: css({
      marginBottom: 0,
    }),
  };
};
