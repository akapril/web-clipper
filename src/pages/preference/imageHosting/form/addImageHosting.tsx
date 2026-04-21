import React from 'react';
import { Form, Modal, Select, Input } from 'antd';
import { ImageHostingServiceMeta } from '../../../../common/backend';
import { ImageHosting } from '@/common/types';
import { FormattedMessage } from 'react-intl';
import Container from 'typedi';
import { IPermissionsService } from '@/service/common/permissions';

type PageOwnProps = {
  currentImageHosting?: ImageHosting | null;
  imageHostingServicesMeta: { [type: string]: ImageHostingServiceMeta };
  visible: boolean;
  onAddAccount(values: any): void;
  onEditAccount(id: string, values: any): void;
  onCancel(): void;
};

const formItemLayout = {
  wrapperCol: { span: 17 },
  labelCol: { span: 6, offset: 0 },
};

const AddImageHostingModal: React.FC<PageOwnProps> = props => {
  const { imageHostingServicesMeta, visible, currentImageHosting } = props;
  const [form] = Form.useForm();
  const type = Form.useWatch('type', form);

  const getImageHostingForm = () => {
    if (type) {
      const ServiceForm = imageHostingServicesMeta[type]?.form;
      if (ServiceForm) {
        return <ServiceForm info={currentImageHosting?.info} />;
      }
    }
    return null;
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const permissionsService = Container.get(IPermissionsService);
      const permission = imageHostingServicesMeta[values.type]?.permission;
      if (permission) {
        const result = await permissionsService.request(permission);
        if (!result) return;
      }
      if (currentImageHosting) {
        props.onEditAccount(currentImageHosting.id, values);
      } else {
        props.onAddAccount(values);
      }
    } catch (_e) {}
  };

  const services = Object.values(imageHostingServicesMeta);
  let title;
  let initValues: any;
  if (currentImageHosting) {
    title = <FormattedMessage id="preference.imageHosting.edit" defaultMessage="Edit" />;
    initValues = {
      type: currentImageHosting.type,
      remark: currentImageHosting.remark,
      ...currentImageHosting.info,
    };
  } else {
    title = <FormattedMessage id="preference.imageHosting.add" defaultMessage="Add" />;
    initValues = {
      type: services.filter(o => !o.builtIn)[0]?.type,
    };
  }

  return (
    <Modal title={title} open={visible} onOk={handleOk} onCancel={props.onCancel} destroyOnClose width={560}>
      <Form form={form} {...formItemLayout} initialValues={initValues}>
        <Form.Item
          name="type"
          label={<FormattedMessage id="preference.imageHosting.type" defaultMessage="Type" />}
          rules={[{ required: true }]}
        >
          <Select>
            {services
              .filter(o => !o.builtIn)
              .map(service => (
                <Select.Option key={service.type} value={service.type}>
                  {service.name}
                </Select.Option>
              ))}
          </Select>
        </Form.Item>
        {getImageHostingForm()}
        <Form.Item
          name="remark"
          label={<FormattedMessage id="preference.imageHosting.remark" defaultMessage="Remark" />}
        >
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddImageHostingModal;
