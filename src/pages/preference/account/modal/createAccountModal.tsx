import React, { useMemo } from 'react';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Form, Modal, Select, Divider } from 'antd';
import styles from './index.less';
import { ImageHostingServiceMeta, BUILT_IN_IMAGE_HOSTING_ID } from 'common/backend';
import { UserPreferenceStore, ImageHosting } from '@/common/types';
import { FormattedMessage } from 'react-intl';
import useVerifiedAccount from '@/common/hooks/useVerifiedAccount';
import useFilterImageHostingServices from '@/common/hooks/useFilterImageHostingServices';
import ImageHostingSelect from '@/components/ImageHostingSelect';
import RepositorySelect from '@/components/RepositorySelect';
import Container from 'typedi';
import { IPermissionsService } from '@/service/common/permissions';
import { ITabService } from '@/service/common/tab';

type PageOwnProps = {
  imageHostingServicesMeta: {
    [type: string]: ImageHostingServiceMeta;
  };
  servicesMeta: UserPreferenceStore['servicesMeta'];
  imageHosting: ImageHosting[];
  visible: boolean;
  onCancel(): void;
  onAdd(id: string, userInfo: any, values: any): void;
};

const ModalTitle = () => (
  <div className={styles.modalTitle}>
    <FormattedMessage id="preference.accountList.addAccount" defaultMessage="Add Account" />
    <a href={'https://www.yuque.com/yuqueclipper/help_cn/bind_account'} target="_blank">
      <QuestionCircleOutlined />
    </a>
  </div>
);

const Page: React.FC<PageOwnProps> = ({
  imageHosting,
  imageHostingServicesMeta,
  servicesMeta,
  onCancel,
  onAdd,
  visible,
}) => {
  const [form] = Form.useForm();

  const {
    type,
    accountStatus: { verified, repositories, userInfo, id },
    loadAccount,
    verifying,
    changeType,
    serviceForm,
    okText,
    oauthLink,
  } = useVerifiedAccount({ form, services: servicesMeta });

  const imageHostingWithBuiltIn = useMemo(() => {
    const res = [...imageHosting];
    const meta = imageHostingServicesMeta[type];
    if (meta?.builtIn) {
      res.push({ type, info: {}, id: BUILT_IN_IMAGE_HOSTING_ID, remark: meta.builtInRemark });
    }
    return res;
  }, [imageHosting, imageHostingServicesMeta, type]);

  const supportedImageHostingServices = useFilterImageHostingServices({
    backendServiceType: type,
    imageHostingServices: imageHostingWithBuiltIn,
    imageHostingServicesMap: imageHostingServicesMeta,
  });

  const handleOk = async (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    const curType = form.getFieldValue('type');
    const permission = servicesMeta[curType]?.permission;
    if (permission) {
      const result = await Container.get(IPermissionsService).request(permission);
      if (!result) {
        return;
      }
    }
    if (oauthLink) {
      Container.get(ITabService).create({
        url: oauthLink.props.href,
      });
      onCancel();
    } else if (verified && id) {
      const values = form.getFieldsValue();
      onAdd(id, userInfo, values);
    } else {
      loadAccount();
    }
  };

  return (
    <Modal
      open={visible}
      okType="primary"
      onCancel={onCancel}
      okText={oauthLink ? oauthLink : okText}
      okButtonProps={{ loading: verifying, disabled: verifying }}
      onOk={handleOk}
      title={<ModalTitle />}
      destroyOnClose
      width={560}
      styles={{ body: { maxHeight: '60vh', overflowY: 'auto' } }}
    >
      <Form form={form} layout="vertical" initialValues={{ type }}>
        <Form.Item
          name="type"
          label={<FormattedMessage id="preference.accountList.type" defaultMessage="Type" />}
        >
          <Select showSearch disabled={verified} onChange={changeType}>
            {Object.values(servicesMeta).map(o => (
              <Select.Option key={o.type} label={o.name} value={o.type}>
                {o.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        {!oauthLink && serviceForm}
        {!oauthLink && (
          <>
            <Divider />
            <Form.Item
              name="defaultRepositoryId"
              label={<FormattedMessage id="preference.accountList.defaultRepository" defaultMessage="Default Repository" />}
            >
              <RepositorySelect disabled={!verified} loading={verifying} repositories={repositories} />
            </Form.Item>
            <Form.Item
              name="imageHosting"
              label={<FormattedMessage id="preference.accountList.imageHost" defaultMessage="Image Host" />}
            >
              <ImageHostingSelect loading={verifying} disabled={!verified} supportedImageHostingServices={supportedImageHostingServices} />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
};

export default Page;
