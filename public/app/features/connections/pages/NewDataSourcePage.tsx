import { Page } from 'app/core/components/Page/Page';
import { Trans, t } from 'app/core/internationalization';
import { NewDataSource } from 'app/features/datasources/components/NewDataSource';


export function NewDataSourcePage() {
  return (
    <Page
      navId={'connections-datasources'}
      pageNav={{ text: <Trans i18nKey="ablestack-wall.connections.add-datasource">Add data source</Trans>, subTitle: <Trans i18nKey="ablestack-wall.connections.add-datasource-description">Choose a data source type</Trans>, active: true }}
    >
      <Page.Contents>
        <NewDataSource />
      </Page.Contents>
    </Page>
  );
}
