import type { Suggestion, Label } from './suggestions';
import type PLP from '../../language_provider';
import { NeverCaseError } from './util';

type Completion = {
  label: string;
  insertText: string;
  suggestOnInsert: boolean;
};

async function getAllMetricNamesCompletions(plp: PLP): Promise<Completion[]> {
  const { metricsMetadata } = plp;
  const texts = metricsMetadata == null ? [] : Object.keys(metricsMetadata);
  return texts.map((text) => ({
    label: text,
    insertText: text,
    suggestOnInsert: false,
  }));
}

function makeSelector(metricName: string, labels: Label[]): string {
  // FIXME: check if this deals well with usually-escaped-non-ascii things
  const labelTexts = labels.map((label) => `${label.name}="${label.value}"`);
  return `{__name__="${metricName}",${labelTexts.join(',')}}`;
}

async function getLabelNamesForCompletions(
  metric: string,
  suffix: string,
  otherLabels: Label[],
  plp: PLP
): Promise<Completion[]> {
  const selector = makeSelector(metric, otherLabels);
  const data = await plp.getSeries(selector);
  const possibleLabelNames = Object.keys(data); // all names from prometheus
  const usedLabelNames = new Set(otherLabels.map((l) => l.name)); // names used in the query
  const labelNames = possibleLabelNames.filter((l) => !usedLabelNames.has(l));
  return labelNames.map((text) => ({
    label: text,
    insertText: `${text}${suffix}`,
    suggestOnInsert: true,
  }));
}

async function getLabelNamesForSelectorCompletions(
  metric: string,
  otherLabels: Label[],
  plp: PLP
): Promise<Completion[]> {
  return getLabelNamesForCompletions(metric, '=', otherLabels, plp);
}
async function getLabelNamesForByCompletions(metric: string, otherLabels: Label[], plp: PLP): Promise<Completion[]> {
  return getLabelNamesForCompletions(metric, ',', otherLabels, plp);
}

async function getLabelValuesForMetricCompletions(
  metric: string,
  labelName: string,
  otherLabels: Label[],
  plp: PLP
): Promise<Completion[]> {
  const selector = makeSelector(metric, otherLabels);
  const data = await plp.getSeries(selector);
  const values = data[labelName] ?? [];
  return values.map((text) => ({
    label: text,
    insertText: `"${text}",`, // FIXME: escaping strange characters?
    suggestOnInsert: true,
  }));
}

export async function getCompletions(suggestion: Suggestion, plp: PLP): Promise<Completion[]> {
  console.log(`getting completions for ${JSON.stringify(suggestion)}`);
  switch (suggestion.type) {
    case 'ALL_METRIC_NAMES':
      return getAllMetricNamesCompletions(plp);
    case 'LABEL_NAMES_FOR_SELECTOR':
      return getLabelNamesForSelectorCompletions(suggestion.metricName, suggestion.otherLabels, plp);
    case 'LABEL_NAMES_FOR_BY':
      return getLabelNamesForByCompletions(suggestion.metricName, suggestion.otherLabels, plp);
    case 'LABEL_VALUES':
      return getLabelValuesForMetricCompletions(
        suggestion.metricName,
        suggestion.labelName,
        suggestion.otherLabels,
        plp
      );
    default:
      throw new NeverCaseError(suggestion);
  }
}
