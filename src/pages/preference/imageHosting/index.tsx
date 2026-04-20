import * as React from 'react';
import {
  asyncAddImageHosting,
  asyncDeleteImageHosting,
  asyncEditImageHosting,
} from 'pageActions/userPreference';
import { bindActionCreators, Dispatch } from 'redux';
import { connect } from 'dva';
import styles from './index.less';
import AddImageHosting from './form/addImageHosting';
import ImageHostingListItem from 'components/imagehostingListItem';
import { PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { GlobalStore, ImageHosting } from 'common/types';
import { FormattedMessage } from 'react-intl';

const useActions = {
  asyncAddImageHosting: asyncAddImageHosting.started,
  asyncDeleteImageHosting: asyncDeleteImageHosting.started,
  asyncEditImageHosting: asyncEditImageHosting.started,
};

const mapStateToProps = ({
  userPreference: { imageHostingServicesMeta, imageHosting },
}: GlobalStore) => {
  return {
    imageHostingServicesMeta,
    imageHosting,
  };
};
type PageState = {
  showAddImageHostingModal: boolean;
  currentImageHosting?: null | ImageHosting;
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
      showAddImageHostingModal: false,
      currentImageHosting: null,
    };
  }

  handleAddAccount = (values: any) => {
    const { type, remark, ...info } = values;
    this.props.asyncAddImageHosting({
      type,
      remark,
      info,
      closeModal: this.closeModal,
    });
  };

  closeModal = () => {
    this.setState({
      currentImageHosting: null,
      showAddImageHostingModal: false,
    });
  };

  handleEditAccount = (id: string, values: any) => {
    const { type, remark, ...info } = values;
    this.props.asyncEditImageHosting({
      id,
      value: { type, remark, info },
      closeModal: this.closeModal,
    });
  };

  handleStartAddAccount = () => {
    this.setState({
      showAddImageHostingModal: true,
    });
  };

  handleDeleteImageHosting = (id: string) => {
    this.props.asyncDeleteImageHosting({ id });
  };

  handleEditImageHosting = (id: string) => {
    const { imageHosting } = this.props;
    this.setState({
      showAddImageHostingModal: true,
      currentImageHosting: imageHosting.find(o => o.id === id),
    });
  };

  renderImageHosting = () => {
    const { imageHosting, imageHostingServicesMeta } = this.props;
    return imageHosting
      .filter(o => imageHostingServicesMeta[o.type])
      .map(o => {
        const meta = imageHostingServicesMeta[o.type];
        return (
          <ImageHostingListItem
            id={o.id}
            key={o.id}
            name={meta.name}
            icon={meta.icon}
            remark={o.remark}
            onEditAccount={id => this.handleEditImageHosting(id)}
            onDeleteAccount={id => this.handleDeleteImageHosting(id)}
          />
        );
      });
  };

  render() {
    const { imageHostingServicesMeta } = this.props;
    const { showAddImageHostingModal, currentImageHosting } = this.state;

    return (
      <div className={styles.box}>
        <AddImageHosting
          currentImageHosting={currentImageHosting}
          imageHostingServicesMeta={imageHostingServicesMeta as any}
          visible={showAddImageHostingModal}
          onCancel={this.closeModal}
          onAddAccount={this.handleAddAccount}
          onEditAccount={this.handleEditAccount}
        />
        <Button
          type="dashed"
          onClick={this.handleStartAddAccount}
          style={{ height: 30, marginBottom: 10, width: '100%' }}
        >
          <PlusOutlined />
          <FormattedMessage id="preference.imageHosting.add" defaultMessage="Add" />
        </Button>
        {this.renderImageHosting()}
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Page);
