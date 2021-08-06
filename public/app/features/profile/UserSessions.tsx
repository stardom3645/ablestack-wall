import React, { PureComponent } from 'react';
import { UserSession } from 'app/types';
import { Button, Icon, LoadingPlaceholder } from '@grafana/ui';

export interface Props {
  sessions: UserSession[];
  isLoading: boolean;
  revokeUserSession: (tokenId: number) => void;
}

export class UserSessions extends PureComponent<Props> {
  render() {
    const { isLoading, sessions, revokeUserSession } = this.props;

    if (isLoading) {
      return <LoadingPlaceholder text="Loading sessions..." />;
    }

    return (
      <div>
        {sessions.length > 0 && (
          <>
            <h3 className="page-sub-heading">세션</h3>
            <div className="gf-form-group">
              <table className="filter-table form-inline" aria-label="User sessions table">
                <thead>
                  <tr>
                    <th>마지막으로 로그인 시간</th>
                    <th>로그인 날짜</th>
                    <th>IP 주소</th>
                    <th>브라우저 &amp; OS</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session: UserSession, index) => (
                    <tr key={index}>
                      {session.isActive ? <td>Now</td> : <td>{session.seenAt}</td>}
                      <td>{session.createdAt}</td>
                      <td>{session.clientIp}</td>
                      <td>
                        {session.browser} on {session.os} {session.osVersion}
                      </td>
                      <td>
                        <Button size="sm" variant="destructive" onClick={() => revokeUserSession(session.id)}>
                          <Icon name="power" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    );
  }
}

export default UserSessions;
