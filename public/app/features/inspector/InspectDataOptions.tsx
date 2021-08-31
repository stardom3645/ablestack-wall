import React, { FC } from 'react';
import { DataFrame, DataTransformerID, getFrameDisplayName, SelectableValue } from '@grafana/data';
import { Field, HorizontalGroup, Select, Switch, VerticalGroup } from '@grafana/ui';
import { getPanelInspectorStyles } from './styles';
import { GetDataOptions } from 'app/features/query/state/PanelQueryRunner';
import { QueryOperationRow } from 'app/core/components/QueryOperationRow/QueryOperationRow';
import { PanelModel } from 'app/features/dashboard/state';
import { DetailText } from 'app/features/inspector/DetailText';

interface Props {
  options: GetDataOptions;
  dataFrames: DataFrame[];
  transformId: DataTransformerID;
  transformationOptions: Array<SelectableValue<DataTransformerID>>;
  selectedDataFrame: number | DataTransformerID;
  downloadForExcel: boolean;
  onDataFrameChange: (item: SelectableValue<DataTransformerID | number>) => void;
  toggleDownloadForExcel: () => void;
  data?: DataFrame[];
  panel?: PanelModel;
  onOptionsChange?: (options: GetDataOptions) => void;
}

export const InspectDataOptions: FC<Props> = ({
  options,
  onOptionsChange,
  panel,
  data,
  dataFrames,
  transformId,
  transformationOptions,
  selectedDataFrame,
  onDataFrameChange,
  downloadForExcel,
  toggleDownloadForExcel,
}) => {
  const styles = getPanelInspectorStyles();

  const panelTransformations = panel?.getTransformations();
  const showPanelTransformationsOption =
    Boolean(panelTransformations?.length) && (transformId as any) !== 'join by time';
  const showFieldConfigsOption = panel && !panel.plugin?.fieldConfigRegistry.isEmpty();

  let dataSelect = dataFrames;
  if (selectedDataFrame === DataTransformerID.seriesToColumns) {
    dataSelect = data!;
  }

  const choices = dataSelect.map((frame, index) => {
    return {
      value: index,
      label: `${getFrameDisplayName(frame)} (${index})`,
    } as SelectableValue<number>;
  });

  const selectableOptions = [...transformationOptions, ...choices];

  function getActiveString() {
    let activeString = '';

    if (!data) {
      return activeString;
    }

    const parts: string[] = [];

    if (selectedDataFrame === DataTransformerID.seriesToColumns) {
      parts.push('시간으로 연결된 시리즈');
    } else if (data.length > 1) {
      parts.push(getFrameDisplayName(data[selectedDataFrame as number]));
    }

    if (options.withTransforms || options.withFieldConfig) {
      if (options.withTransforms) {
        parts.push('패널 변환');
      }

      if (options.withTransforms && options.withFieldConfig) {
      }

      if (options.withFieldConfig) {
        parts.push('포맷된 데이터');
      }
    }

    if (downloadForExcel) {
      parts.push('엑셀 헤더');
    }

    return parts.join(', ');
  }

  return (
    <div className={styles.dataDisplayOptions}>
      <QueryOperationRow
        id="Data options"
        index={0}
        title="포맷된 데이터"
        headerElement={<DetailText>{getActiveString()}</DetailText>}
        isOpen={false}
      >
        <div className={styles.options} data-testid="dataOptions">
          <VerticalGroup spacing="none">
            {data!.length > 1 && (
              <Field label="데이터 프레임 표시">
                <Select
                  menuShouldPortal
                  options={selectableOptions}
                  value={selectedDataFrame}
                  onChange={onDataFrameChange}
                  width={30}
                  aria-label="Select dataframe"
                />
              </Field>
            )}

            <HorizontalGroup>
              {showPanelTransformationsOption && onOptionsChange && (
                <Field
                  label="패널 변형 적용"
                  description="테이블 데이터는 패널 변환 탭에 정의된 변환과 함께 표시됩니다."
                >
                  <Switch
                    value={!!options.withTransforms}
                    onChange={() => onOptionsChange({ ...options, withTransforms: !options.withTransforms })}
                  />
                </Field>
              )}
              {showFieldConfigsOption && onOptionsChange && (
                <Field
                  label="포맷된 데이터"
                  description="테이블 데이터는 필드 및 재정의 탭에 정의된 옵션으로 형식이 지정됩니다."
                >
                  <Switch
                    value={!!options.withFieldConfig}
                    onChange={() => onOptionsChange({ ...options, withFieldConfig: !options.withFieldConfig })}
                  />
                </Field>
              )}
              <Field label="엑셀용 다운로드" description="Excel에서 사용하기 위해 CSV에 헤더 추가">
                <Switch value={downloadForExcel} onChange={toggleDownloadForExcel} />
              </Field>
            </HorizontalGroup>
          </VerticalGroup>
        </div>
      </QueryOperationRow>
    </div>
  );
};
