import React, { FC, PureComponent } from 'react';
import { AccessControlAction, UserDTO } from 'app/types';
import { css, cx } from '@emotion/css';
import { config } from 'app/core/config';
import { GrafanaTheme } from '@grafana/data';
import { Button, ConfirmButton, ConfirmModal, Input, LegacyInputStatus, stylesFactory } from '@grafana/ui';
import { contextSrv } from 'app/core/core';

interface Props {
  user: UserDTO;

  onUserUpdate: (user: UserDTO) => void;
  onUserDelete: (userId: number) => void;
  onUserDisable: (userId: number) => void;
  onUserEnable: (userId: number) => void;
  onPasswordChange(password: string): void;
}

interface State {
  isLoading: boolean;
  showDeleteModal: boolean;
  showDisableModal: boolean;
}

export class UserProfile extends PureComponent<Props, State> {
  state = {
    isLoading: false,
    showDeleteModal: false,
    showDisableModal: false,
  };

  showDeleteUserModal = (show: boolean) => () => {
    this.setState({ showDeleteModal: show });
  };

  showDisableUserModal = (show: boolean) => () => {
    this.setState({ showDisableModal: show });
  };

  onUserDelete = () => {
    const { user, onUserDelete } = this.props;
    onUserDelete(user.id);
  };

  onUserDisable = () => {
    const { user, onUserDisable } = this.props;
    onUserDisable(user.id);
  };

  onUserEnable = () => {
    const { user, onUserEnable } = this.props;
    onUserEnable(user.id);
  };

  onUserNameChange = (newValue: string) => {
    const { user, onUserUpdate } = this.props;
    onUserUpdate({
      ...user,
      name: newValue,
    });
  };

  onUserEmailChange = (newValue: string) => {
    const { user, onUserUpdate } = this.props;
    onUserUpdate({
      ...user,
      email: newValue,
    });
  };

  onUserLoginChange = (newValue: string) => {
    const { user, onUserUpdate } = this.props;
    onUserUpdate({
      ...user,
      login: newValue,
    });
  };

  onPasswordChange = (newValue: string) => {
    this.props.onPasswordChange(newValue);
  };

  render() {
    const { user } = this.props;
    const { showDeleteModal, showDisableModal } = this.state;
    const authSource = user.authLabels?.length && user.authLabels[0];
    const lockMessage = authSource ? `Synced via ${authSource}` : '';
    const styles = getStyles(config.theme);

    const editLocked = user.isExternal || !contextSrv.hasPermission(AccessControlAction.UsersWrite);
    const passwordChangeLocked = user.isExternal || !contextSrv.hasPermission(AccessControlAction.UsersPasswordUpdate);
    const canDelete = contextSrv.hasPermission(AccessControlAction.UsersDelete);
    const canDisable = contextSrv.hasPermission(AccessControlAction.UsersDisable);
    const canEnable = contextSrv.hasPermission(AccessControlAction.UsersEnable);

    return (
      <>
        <h3 className="page-heading">사용자 정보</h3>
        <div className="gf-form-group">
          <div className="gf-form">
            <table className="filter-table form-inline">
              <tbody>
                <UserProfileRow
                  label="이름"
                  value={user.name}
                  locked={editLocked}
                  lockMessage={lockMessage}
                  onChange={this.onUserNameChange}
                />
                <UserProfileRow
                  label="이메일"
                  value={user.email}
                  locked={editLocked}
                  lockMessage={lockMessage}
                  onChange={this.onUserEmailChange}
                />
                <UserProfileRow
                  label="사용자 이름"
                  value={user.login}
                  locked={editLocked}
                  lockMessage={lockMessage}
                  onChange={this.onUserLoginChange}
                />
                <UserProfileRow
                  label="비밀번호"
                  value="********"
                  inputType="password"
                  locked={passwordChangeLocked}
                  lockMessage={lockMessage}
                  onChange={this.onPasswordChange}
                />
              </tbody>
            </table>
          </div>
          <div className={styles.buttonRow}>
            {canDelete && (
              <>
                <Button variant="destructive" onClick={this.showDeleteUserModal(true)}>
                  사용자 삭제
                </Button>
                <ConfirmModal
                  isOpen={showDeleteModal}
                  title="사용자 삭제"
                  body="이 사용자를 삭제하시겠습니까?"
                  confirmText="사용자 삭제"
                  onConfirm={this.onUserDelete}
                  onDismiss={this.showDeleteUserModal(false)}
                />
              </>
            )}
            {user.isDisabled && canEnable && (
              <Button variant="secondary" onClick={this.onUserEnable}>
                사용자 활성화
              </Button>
            )}
            {!user.isDisabled && canDisable && (
              <>
                <Button variant="secondary" onClick={this.showDisableUserModal(true)}>
                  사용자 비활성화
                </Button>
                <ConfirmModal
                  isOpen={showDisableModal}
                  title="사용자 비활성화"
                  body="이 사용자를 비활성화하시겠습니까?"
                  confirmText="사용자 비활성화"
                  onConfirm={this.onUserDisable}
                  onDismiss={this.showDisableUserModal(false)}
                />
              </>
            )}
          </div>
        </div>
      </>
    );
  }
}

const getStyles = stylesFactory((theme: GrafanaTheme) => {
  return {
    buttonRow: css`
      margin-top: 0.8rem;
      > * {
        margin-right: 16px;
      }
    `,
  };
});

interface UserProfileRowProps {
  label: string;
  value?: string;
  locked?: boolean;
  lockMessage?: string;
  inputType?: string;
  onChange?: (value: string) => void;
}

interface UserProfileRowState {
  value: string;
  editing: boolean;
}

export class UserProfileRow extends PureComponent<UserProfileRowProps, UserProfileRowState> {
  inputElem?: HTMLInputElement;

  static defaultProps: Partial<UserProfileRowProps> = {
    value: '',
    locked: false,
    lockMessage: '',
    inputType: 'text',
  };

  state = {
    editing: false,
    value: this.props.value || '',
  };

  setInputElem = (elem: any) => {
    this.inputElem = elem;
  };

  onEditClick = () => {
    if (this.props.inputType === 'password') {
      // Reset value for password field
      this.setState({ editing: true, value: '' }, this.focusInput);
    } else {
      this.setState({ editing: true }, this.focusInput);
    }
  };

  onCancelClick = () => {
    this.setState({ editing: false, value: this.props.value || '' });
  };

  onInputChange = (event: React.ChangeEvent<HTMLInputElement>, status?: LegacyInputStatus) => {
    if (status === LegacyInputStatus.Invalid) {
      return;
    }

    this.setState({ value: event.target.value });
  };

  onInputBlur = (event: React.FocusEvent<HTMLInputElement>, status?: LegacyInputStatus) => {
    if (status === LegacyInputStatus.Invalid) {
      return;
    }

    this.setState({ value: event.target.value });
  };

  focusInput = () => {
    if (this.inputElem && this.inputElem.focus) {
      this.inputElem.focus();
    }
  };

  onSave = () => {
    if (this.props.onChange) {
      this.props.onChange(this.state.value);
    }
  };

  render() {
    const { label, locked, lockMessage, inputType } = this.props;
    const { value } = this.state;
    const labelClass = cx(
      'width-16',
      css`
        font-weight: 500;
      `
    );
    const editButtonContainerClass = cx('pull-right');

    if (locked) {
      return <LockedRow label={label} value={value} lockMessage={lockMessage} />;
    }

    return (
      <tr>
        <td className={labelClass}>{label}</td>
        <td className="width-25" colSpan={2}>
          {this.state.editing ? (
            <Input
              type={inputType}
              defaultValue={value}
              onBlur={this.onInputBlur}
              onChange={this.onInputChange}
              ref={this.setInputElem}
              width={30}
            />
          ) : (
            <span>{this.props.value}</span>
          )}
        </td>
        <td>
          <div className={editButtonContainerClass}>
            <ConfirmButton
              confirmText="저장"
              onClick={this.onEditClick}
              onConfirm={this.onSave}
              onCancel={this.onCancelClick}
            >
              편집
            </ConfirmButton>
          </div>
        </td>
      </tr>
    );
  }
}

interface LockedRowProps {
  label: string;
  value?: any;
  lockMessage?: string;
}

export const LockedRow: FC<LockedRowProps> = ({ label, value, lockMessage }) => {
  const lockMessageClass = cx(
    'pull-right',
    css`
      font-style: italic;
      margin-right: 0.6rem;
    `
  );
  const labelClass = cx(
    'width-16',
    css`
      font-weight: 500;
    `
  );

  return (
    <tr>
      <td className={labelClass}>{label}</td>
      <td className="width-25" colSpan={2}>
        {value}
      </td>
      <td>
        <span className={lockMessageClass}>{lockMessage}</span>
      </td>
    </tr>
  );
};
