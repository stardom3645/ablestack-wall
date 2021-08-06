import React, { PureComponent } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { Button, Input, Form, Field } from '@grafana/ui';
import Page from 'app/core/components/Page/Page';
import { createNewFolder } from '../state/actions';
import { getNavModel } from 'app/core/selectors/navModel';
import { StoreState } from 'app/types';
import validationSrv from '../../manage-dashboards/services/ValidationSrv';

const mapStateToProps = (state: StoreState) => ({
  navModel: getNavModel(state.navIndex, 'manage-dashboards'),
});

const mapDispatchToProps = {
  createNewFolder,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

interface OwnProps {}

interface FormModel {
  folderName: string;
}

const initialFormModel: FormModel = { folderName: '' };

type Props = OwnProps & ConnectedProps<typeof connector>;

export class NewDashboardsFolder extends PureComponent<Props> {
  onSubmit = (formData: FormModel) => {
    this.props.createNewFolder(formData.folderName);
  };

  validateFolderName = (folderName: string) => {
    return validationSrv
      .validateNewFolderName(folderName)
      .then(() => {
        return true;
      })
      .catch((e) => {
        return e.message;
      });
  };

  render() {
    return (
      <Page navModel={this.props.navModel}>
        <Page.Contents>
          <h3>새 대시보드 폴더</h3>
          <Form defaultValues={initialFormModel} onSubmit={this.onSubmit}>
            {({ register, errors }) => (
              <>
                <Field
                  label="폴더 명"
                  invalid={!!errors.folderName}
                  error={errors.folderName && errors.folderName.message}
                >
                  <Input
                    {...register('folderName', {
                      required: '폴더 명은 필수입니다.',
                      validate: async (v) => await this.validateFolderName(v),
                    })}
                  />
                </Field>
                <Button type="submit">생성</Button>
              </>
            )}
          </Form>
        </Page.Contents>
      </Page>
    );
  }
}

export default connector(NewDashboardsFolder);
