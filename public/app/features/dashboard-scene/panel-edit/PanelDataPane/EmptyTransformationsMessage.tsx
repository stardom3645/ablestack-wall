import { useContext } from 'react';

import { selectors } from '@grafana/e2e-selectors';
import { Box, Button, Stack, Text } from '@grafana/ui';
import { Trans } from 'app/core/internationalization';
import { editorPresentationContext } from 'app/features/wall-modern/editor/EditorPresentationContext';
import { Button as WallButton } from 'app/features/wall-modern/ui';

interface EmptyTransformationsProps {
  onShowPicker: () => void;
}
export function EmptyTransformationsMessage(props: EmptyTransformationsProps) {
  const wall = useContext(editorPresentationContext);
  if (wall) {
    return (
      <div className="wall-work-transform-empty">
        <p>
          <Trans i18nKey="wall.work.transform-empty">원본 데이터를 그대로 표시합니다.</Trans>
        </p>
        <WallButton
          size="sm"
          onClick={props.onShowPicker}
          data-testid={selectors.components.Transforms.addTransformationButton}
        >
          <Trans i18nKey="wall.work.add-transform">데이터 변환 추가</Trans>
        </WallButton>
      </div>
    );
  }
  return (
    <Box alignItems="center" padding={4}>
      <Stack direction="column" alignItems="center" gap={2}>
        <Text element="h3" textAlignment="center">
          <Trans i18nKey="transformations.empty.add-transformation-header">Start transforming data</Trans>
        </Text>
        <Text element="p" textAlignment="center" data-testid={selectors.components.Transforms.noTransformationsMessage}>
          <Trans i18nKey="transformations.empty.add-transformation-body">
            Transformations allow data to be changed in various ways before your visualization is shown.
            <br />
            This includes joining data together, renaming fields, making calculations, formatting data for display, and
            more.
          </Trans>
        </Text>
        <Button
          icon="plus"
          variant="primary"
          size="md"
          onClick={props.onShowPicker}
          data-testid={selectors.components.Transforms.addTransformationButton}
        >
          <Trans i18nKey="correlations.transform.add-button">Add transformation</Trans>
        </Button>
      </Stack>
    </Box>
  );
}
