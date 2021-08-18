import React, { useState, FC, useEffect } from 'react';
import EmptyListCTA from 'app/core/components/EmptyListCTA/EmptyListCTA';
import Page from 'app/core/components/Page/Page';
import { getBackendSrv } from '@grafana/runtime';
import { useAsyncFn } from 'react-use';
import { appEvents } from 'app/core/core';
import { useNavModel } from 'app/core/hooks/useNavModel';
import { HorizontalGroup, Button, LinkButton } from '@grafana/ui';
import { AlertNotification } from 'app/types/alerting';
import { ShowConfirmModalEvent } from '../../types/events';

const NotificationsListPage: FC = () => {
  const navModel = useNavModel('channels');

  const [notifications, setNotifications] = useState<AlertNotification[]>([]);

  const getNotifications = async () => {
    return await getBackendSrv().get(`/api/alert-notifications`);
  };

  const [state, fetchNotifications] = useAsyncFn(getNotifications);
  useEffect(() => {
    fetchNotifications().then((res) => {
      setNotifications(res);
    });
  }, [fetchNotifications]);

  const deleteNotification = (id: number) => {
    appEvents.publish(
      new ShowConfirmModalEvent({
        title: '삭제',
        text: '이 알림 채널을 삭제하시겠습니까?',
        text2: `이 알림 채널을 삭제해도 알림에서 해당 채널에 대한 참조는 삭제되지 않습니다.`,
        icon: 'trash-alt',
        confirmText: 'Delete',
        yesText: 'Delete',
        onConfirm: async () => {
          deleteNotificationConfirmed(id);
        },
      })
    );
  };

  const deleteNotificationConfirmed = async (id: number) => {
    await getBackendSrv().delete(`/api/alert-notifications/${id}`);
    const notifications = await fetchNotifications();
    setNotifications(notifications);
  };

  return (
    <Page navModel={navModel}>
      <Page.Contents>
        {state.error && <p>{state.error}</p>}
        {!!notifications.length && (
          <>
            <div className="page-action-bar">
              <div className="page-action-bar__spacer" />
              <LinkButton icon="channel-add" href="alerting/notification/new">
                새 채널
              </LinkButton>
            </div>
            <table className="filter-table filter-table--hover">
              <thead>
                <tr>
                  <th style={{ minWidth: '200px' }}>
                    <strong>이름</strong>
                  </th>
                  <th style={{ minWidth: '100px' }}>타입</th>
                  <th style={{ width: '1%' }}></th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((notification) => (
                  <tr key={notification.id}>
                    <td className="link-td">
                      <a href={`alerting/notification/${notification.id}/edit`}>{notification.name}</a>
                    </td>
                    <td className="link-td">
                      <a href={`alerting/notification/${notification.id}/edit`}>{notification.type}</a>
                    </td>
                    <td className="text-right">
                      <HorizontalGroup justify="flex-end">
                        {notification.isDefault && (
                          <Button disabled variant="secondary" size="sm">
                            default
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          icon="times"
                          size="sm"
                          onClick={() => {
                            deleteNotification(notification.id);
                          }}
                        />
                      </HorizontalGroup>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {!(notifications.length || state.loading) && (
          <EmptyListCTA
            title="아직 정의된 알림 채널이 없습니다"
            buttonIcon="channel-add"
            buttonLink="alerting/notification/new"
            buttonTitle="채널 추가"
            proTip="경고 알림에 이미지를 포함할 수 있습니다."
            //proTipLink="http://docs.grafana.org/alerting/notifications/"
            //proTipLinkTitle="Learn more"
            //proTipTarget="_blank"
          />
        )}
      </Page.Contents>
    </Page>
  );
};

export default NotificationsListPage;
