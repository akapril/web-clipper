import React, { useMemo, useEffect } from 'react';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { Form, Modal, Select } from 'antd';
import styles from './index.less';
import { ImageHostingServiceMeta } from 'common/backend';
import { AccountPreference, UserPreferenceStore, ImageHosting } from '@/common/types';
import { FormattedMessage } from 'react-intl';
import ImageHostingSelect from '@/components/ImageHostingSelect';
import useFilterImageHostingServices from '@/common/hooks/useFilterImageHostingServices';
import useVerifiedAccount from '@/common/hooks/useVerifiedAccount';
import RepositorySelect from '@/components/RepositorySelect';
import { BUILT_IN_IMAGE_HOSTING_ID } from '@/common/backend/imageHosting/interface';

type PageOwnProps = {
  imageHostingServicesMeta: {
    [type: string]: ImageHostingServiceMeta;
  };
  servicesMeta: UserPreferenceStore['servicesMeta'];
  imageHosting: ImageHosting[];
  currentAccount: AccountPreference;
  visible: boolean;
  onCancel(): void;
  onEdit(oldId: string, userInfo: any, newId: string, values: any): void;
};

const ModalTitle = () => (
  <div className={styles.modalTitle}>
    <FormattedMessage id="preference.accountList.editAccount" defaultMessage="Edit Account" />
    <a href={'https://www.yuque.com/yuqueclipper/help_cn/bind_account'} target="_blank">
      <QuestionCircleOutlined />
    </a>
  </div>
);

const Page: React.FC<PageOwnProps> = ({
  visible,
  currentAccount,
  servicesMeta,
  onCancel,
  onEdit,
  imageHosting,
  imageHostingServicesMeta,
}) => {
  const [form] = Form.useForm();

  const {
    type,
    accountStatus: { verified, repositories, userInfo, id },
    verifyAccount,
    loadAccount,
    serviceForm,
    verifying,
    okText: verifyText,
  } = useVerifiedAccount({
    form,
    services: servicesMeta,
    initAccount: currentAccount,
  });

  useEffect(() => {
    verifyAccount(currentAccount);
  }, [currentAccount, verifyAccount]);

  const imageHostingWithBuiltIn = useMemo(() => {
    const res = [...imageHosting];
    const meta = imageHostingServicesMeta[type];
    if (meta?.builtIn) {
      res.push({ type, info: {}, id: BUILT_IN_IMAGE_HOSTING_ID, remark: meta.builtInRemark });
    }
    return res;
  }, [imageHosting, imageHostingServicesMeta, type]);

  const supportedImageHostingServices = useFilterImageHostingServices({
    backendServiceType: currentAccount.type,
    imageHostingServices: imageHostingWithBuiltIn,
    imageHostingServicesMap: imageHostingServicesMeta,
  });

  const okText = verifying ? (
    <FormattedMessage id="preference.accountList.verifying" defaultMessage="Verifying" />
  ) : (
    <FormattedMessage id="preference.accountList.confirm" defaultMessage="Confirm" />
  );

  return (
    <Modal
      open={visible}
      title={<ModalTitle />}
      okText={verified ? okText : verifyText}
      okType="primary"
      okButtonProps={{ loading: verifying }}
      onCancel={onCancel}
      destroyOnClose
      width={560}
      onOk={() => {
        if (verified) {
          const values = form.getFieldsValue();
          onEdit(currentAccount.id, userInfo, id!, values);
        } else {
          loadAccount();
        }
      }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          type: currentAccount.type,
          defaultRepositoryId: currentAccount.defaultRepositoryId,
          imageHosting: currentAccount.imageHosting,
        }}
      >
        <Form.Item
          name="type"
          label={<FormattedMessage id="preference.accountList.type" defaultMessage="Type" />}
        >
          <Select disabled>
            {Object.values(servicesMeta).map(o => (
              <Select.Option key={o.type} value={o.type}>
                {o.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        {serviceForm}
        <Form.Item
          name="defaultRepositoryId"
          label={<FormattedMessage id="preference.accountList.defaultRepository" defaultMessage="Default Repository" />}
        >
          <RepositorySelect disabled={!verified || verifying} loading={verifying} repositories={repositories} />
        </Form.Item>
        <Form.Item
          name="imageHosting"
          label={<FormattedMessage id="preference.accountList.imageHost" defaultMessage="Image Host" />}
        >
          <ImageHostingSelect disabled={!verified} supportedImageHostingServices={supportedImageHostingServices} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default Page;
