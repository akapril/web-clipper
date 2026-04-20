import * as React from 'react';
import {
  asyncAddAccount,
  asyncDeleteAccount,
  asyncUpdateDefaultAccountId,
  asyncUpdateAccount,
} from 'pageActions/account';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Row, Col } from 'antd';
import { bindActionCreators, Dispatch } from 'redux';
import { connect } from 'dva';
import AccountItem from '../../../components/accountItem';
import styles from './index.less';
import EditAccountModal from './modal/editAccountModal';
import CreateAccountModal from './modal/createAccountModal';
import { GlobalStore, AccountPreference } from 'common/types';
import { FormattedMessage } from 'react-intl';
import { asyncChangeAccount } from '@/actions/clipper';

const useActions = {
  asyncAddAccount: asyncAddAccount.started,
  asyncDeleteAccount: asyncDeleteAccount.started,
  asyncUpdateAccount: asyncUpdateAccount,
  asyncUpdateDefaultAccountId: asyncUpdateDefaultAccountId.started,
  asyncChangeAccount: asyncChangeAccount.started,
};

const mapStateToProps = ({
  clipper: { currentAccountId },
  account: { accounts, defaultAccountId },
  userPreference: { servicesMeta, imageHostingServicesMeta, imageHosting },
}: GlobalStore) => {
  return {
    currentAccountId,
    imageHostingServicesMeta,
    accounts,
    defaultAccountId,
    servicesMeta,
    imageHosting,
  };
};
type PageState = {
  showAccountModal: boolean;
  currentAccount: null | AccountPreference;
};

type PageStateProps = ReturnType<typeof mapStateToProps>;
type PageDispatchProps = typeof useActions;
type PageProps = PageStateProps & PageDispatchProps;
const mapDispatchToProps = (dispatch: Dispatch) =>
  bindActionCreators<PageDispatchProps, PageDispatchProps>(useActions, dispatch);

class Page extends React.Component<PageProps, PageState> {
  constructor(props: PageProps) {
    super(props);
    this.state = {
      showAccountModal: false,
      currentAccount: null,
    };
  }

  handleSetDefaultId = (id: string) => {
    if (this.props.defaultAccountId === id) {
      return;
    }
    this.props.asyncUpdateDefaultAccountId({ id });
  };

  handleEdit = (accountId: string) => {
    const currentAccount = this.props.accounts.find(o => o.id === accountId);
    if (!currentAccount) {
      return;
    }
    this.toggleAccountModal(currentAccount);
  };

  handleAdd = (id: string, userInfo: any, values: any) => {
    const { type, defaultRepositoryId, imageHosting, ...info } = values;
    this.props.asyncAddAccount({
      id,
      type,
      defaultRepositoryId,
      imageHosting,
      info,
      userInfo,
      callback: this.handleCancel,
    });
  };

  handleCancel = () => {
    this.toggleAccountModal();
  };

  toggleAccountModal = (currentAccount?: AccountPreference) => {
    const { showAccountModal } = this.state;
    this.setState(
      {
        showAccountModal: !showAccountModal,
      },
      () => {
        this.setState({
          currentAccount: currentAccount || null,
        });
      }
    );
  };

  handleEditAccount = (id: string, userInfo: any, newId: string, values: any) => {
    const { type, defaultRepositoryId, imageHosting, ...info } = values;
    this.props.asyncUpdateAccount({
      account: { type, defaultRepositoryId, imageHosting, info },
      id,
      newId,
      userInfo,
      callback: () => {
        this.handleCancel();
      },
    });
  };

  getAccountModal = () => {
    const { showAccountModal, currentAccount } = this.state;
    const { servicesMeta, imageHostingServicesMeta, imageHosting } = this.props;
    if (!showAccountModal) {
      return;
    }
    if (currentAccount) {
      return (
        <EditAccountModal
          visible
          imageHosting={imageHosting}
          imageHostingServicesMeta={imageHostingServicesMeta}
          servicesMeta={servicesMeta}
          currentAccount={currentAccount}
          onCancel={this.handleCancel}
          onEdit={this.handleEditAccount}
        />
      );
    }
    return (
      <CreateAccountModal
        visible
        imageHosting={imageHosting}
        imageHostingServicesMeta={imageHostingServicesMeta}
        servicesMeta={servicesMeta}
        onAdd={this.handleAdd}
        onCancel={this.handleCancel}
      />
    );
  };

  render() {
    const { defaultAccountId, accounts, asyncDeleteAccount, servicesMeta } = this.props;
    const { handleEdit, handleSetDefaultId, toggleAccountModal } = this;
    return (
      <React.Fragment>
        {this.getAccountModal()}
        <Row gutter={10}>
          {accounts.map(account => (
            <Col span={8} key={account.id} style={{ marginBottom: 10 }}>
              <AccountItem
                isDefault={defaultAccountId === account.id}
                id={account.id}
                name={account.name}
                description={account.description}
                avatar={account.avatar || servicesMeta[account.type].icon}
                onDelete={id => asyncDeleteAccount({ id })}
                onEdit={id => handleEdit(id)}
                onSetDefaultAccount={id => handleSetDefaultId(id)}
              />
            </Col>
          ))}
          <Col span={8}>
            <div className={styles.createButton}>
              <Button
                type="dashed"
                onClick={() => toggleAccountModal()}
                block
                style={{ height: '100%' }}
              >
                <PlusOutlined />
                <FormattedMessage id="preference.account.add" defaultMessage="Bind Account" />
              </Button>
            </div>
          </Col>
        </Row>
      </React.Fragment>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Page);
