import React, { useEffect, useRef, useMemo } from 'react';
import { Form, Input, Button } from 'antd';
import Section from '@/components/section';
import { FormattedMessage } from 'react-intl';
import styles from './index.less';
import { useSelector, useDispatch } from 'dva';
import { GlobalStore, ClipperHeaderForm } from '@/common/types';
import { updateClipperHeader, asyncCreateDocument } from '@/actions/clipper';
import { isEqual } from 'lodash';
import { ServiceMeta, Repository } from '@/common/backend';
import classNames from 'classnames';
import localeService from '@/common/locales';

type PageProps = {
  pathname: string;
  service: ServiceMeta | null;
  currentRepository?: Repository;
};

const ClipperHeader: React.FC<PageProps> = props => {
  const { pathname, service, currentRepository } = props;
  const [form] = Form.useForm();
  const ref = useRef<ClipperHeaderForm>({ title: '' });
  const { loading, clipperHeaderForm } = useSelector((g: GlobalStore) => {
    return {
      loading: g.loading.effects[asyncCreateDocument.started.type],
      clipperHeaderForm: g.clipper.clipperHeaderForm,
    };
  }, isEqual);
  const dispatch = useDispatch();

  // Redux → Form 同步
  useEffect(() => {
    if (isEqual(clipperHeaderForm, ref.current)) {
      return;
    }
    form.setFieldsValue(clipperHeaderForm);
    ref.current = clipperHeaderForm;
  }, [clipperHeaderForm, form]);

  // Form → Redux 同步
  const handleValuesChange = (_: any, allValues: ClipperHeaderForm) => {
    if (isEqual(ref.current, allValues)) {
      return;
    }
    dispatch(updateClipperHeader(allValues));
    ref.current = allValues;
  };

  const handleSubmit = () => {
    form.validateFields().then(() => {
      dispatch(asyncCreateDocument.started({ pathname }));
    }).catch(() => {});
  };

  const headerForm = useMemo(() => {
    const HeaderForm = service?.headerForm;
    // antd 5: headerForm 子组件在 <Form> 内部，自动继承 form context
    return HeaderForm ? <HeaderForm currentRepository={currentRepository} /> : null;
  }, [currentRepository, service]);

  return (
    <Section
      title={<FormattedMessage id="tool.title" defaultMessage="Title" />}
      className={classNames(styles.header, styles.section)}
    >
      <Form
        form={form}
        onValuesChange={handleValuesChange}
        initialValues={clipperHeaderForm}
      >
        <Form.Item
          name="title"
          rules={[{ required: true, message: <FormattedMessage id="tool.title.required" /> }]}
        >
          <Input placeholder="Please Input Title" />
        </Form.Item>
        {headerForm}
      </Form>
      <Button
        className={styles.saveButton}
        size="large"
        type="primary"
        title={
          !currentRepository
            ? localeService.format({ id: 'tool.saveButton.noRepository' })
            : ''
        }
        onClick={handleSubmit}
        loading={loading}
        disabled={loading || pathname === '/' || !currentRepository}
        block
      >
        <FormattedMessage id="tool.save" defaultMessage="Save Content" />
      </Button>
    </Section>
  );
};

export default ClipperHeader;
